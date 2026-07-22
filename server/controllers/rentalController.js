const Transactions = require('../models/Transactions');
const Device = require('../models/Device');
const User = require('../models/users'); 
const { sendCheckoutEmail, sendReturnEmail } = require('../services/emailService');

exports.rentDevice = async (req, res) => { 
    try {
        const { deviceId, conditionAtCheckout } = req.body;
        const isFacultyOrAdmin = req.user.role === 'Admin' || req.user.role === 'Faculty';
        const targetUserId = (isFacultyOrAdmin && req.body.userId) ? req.body.userId : req.user._id;

        // ==========================================
        // 1. STUDENT WEB RESERVATION FLOW (1 Hour Hold)
        // ==========================================
        if (!isFacultyOrAdmin) {
            // Check if student already has a pending reservation
            const existingRes = await Transactions.findOne({ UserID: targetUserId, Status: 'reserved' });
            if (existingRes) return res.status(400).json({ message: "You already have a pending reservation. Limit 1 reservation at a time." });

            const device = await Device.findById(deviceId);
            if (!device || !device.isAvailable) return res.status(400).json({ message: "Device is unavailable." });

            // Hold it for 1 hour
            const expireDate = new Date();
            expireDate.setHours(expireDate.getHours() + 1); 

            device.isAvailable = false;
            device.currentRenter = targetUserId;
            await device.save();

            const user = await User.findById(targetUserId);
            user.activeRentals.push(deviceId);
            await user.save();

            const newTransaction = await Transactions.create({
                UserID: targetUserId, ItemID: deviceId, Status: 'reserved',
                ConditionAtCheckout: 'Pending Staff Approval', DueDate: expireDate
            });

            return res.status(200).json({ message: `Reserved! You have 1 hour to pick it up at ${device.location}.` });
        }

        // ==========================================
        // 2. FACULTY DESK CHECKOUT FLOW
        // ==========================================
        const device = await Device.findById(deviceId);
        if (!device) return res.status(404).json({ message: "Device not found" });

        const user = await User.findById(targetUserId);
        const loanDays = parseInt(device.loanPeriod) || 7; 
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanDays);

        // Check if the student previously reserved this exact device
        const existingRes = await Transactions.findOne({ ItemID: deviceId, Status: 'reserved' });
        
        if (existingRes) {
            if (existingRes.UserID.toString() !== targetUserId.toString()) {
                return res.status(400).json({ message: "This device is reserved by a different student!" });
            }
            // UPGRADE RESERVATION TO ACTIVE CHECKOUT
            existingRes.Status = 'active';
            existingRes.ConditionAtCheckout = conditionAtCheckout || 'Good';
            existingRes.DueDate = dueDate;
            await existingRes.save();

            device.rentalHistory.push({ userId: targetUserId, rentedAt: new Date() });
            await device.save();

            await sendCheckoutEmail({ to: user.email, name: user.name, deviceName: device.name, loanPeriod: device.loanPeriod });
            return res.status(200).json({ message: `Reservation Confirmed! Officially checked out to ${user.name}.` });
        }

        // NO RESERVATION: Walk-up Checkout
        if (!device.isAvailable) return res.status(400).json({ message: "Device is currently checked out." });

        device.isAvailable = false;
        device.currentRenter = targetUserId;
        device.rentalHistory.push({ userId: targetUserId, rentedAt: new Date() });
        await device.save();

        user.activeRentals.push(deviceId);
        await user.save();

        await Transactions.create({
            UserID: targetUserId, ItemID: deviceId, Status: 'active',
            ConditionAtCheckout: conditionAtCheckout || 'Good', DueDate: dueDate
        });

        await sendCheckoutEmail({ to: user.email, name: user.name, deviceName: device.name, loanPeriod: device.loanPeriod });
        res.status(200).json({ message: `Walk-up Checkout Success! Assigned to ${user.name}.` });
        
    } catch (error) {
        res.status(500).json({ message: "Checkout error", error: error.message });
    }
};

exports.cancelReservation = async (req, res) => {
    try {
        const { transactionId } = req.body;
        const transaction = await Transactions.findById(transactionId);
        
        if (!transaction || transaction.Status !== 'reserved') return res.status(404).json({ message: "Reservation not found." });
        if (transaction.UserID.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Unauthorized." });

        // Cancel transaction and release device
        transaction.Status = 'cancelled';
        await transaction.save();

        await Device.findByIdAndUpdate(transaction.ItemID, { isAvailable: true, currentRenter: null });
        await User.findByIdAndUpdate(req.user._id, { $pull: { activeRentals: transaction.ItemID } });

        res.status(200).json({ message: "Reservation cancelled successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error cancelling reservation." });
    }
}

exports.getMyLoans = async (req, res) => {
    try {
        const userId = req.user._id;
        const loans = await Transactions.find({ UserID: userId, Status: { $in: ['active', 'reserved'] } }).populate('ItemID'); 
        res.status(200).json(loans);
    } catch (error) {
        res.status(500).json({ message: "Error fetching loans", error: error.message });
    }
};

exports.returnDevice = async (req, res) => {
    try {
        const { deviceId, conditionAtReturn } = req.body;
        const isFacultyOrAdmin = req.user.role === 'Admin' || req.user.role === 'Faculty';
        const activeTransaction = await Transactions.findOne({ ItemID: deviceId, Status: 'active' });
        if (!activeTransaction) return res.status(404).json({ message: "No active rental found for this device." });
        const actualRenterId = activeTransaction.UserID;
        if (!isFacultyOrAdmin && req.user._id.toString() !== actualRenterId.toString()) return res.status(403).json({ message: "You cannot return a device you did not rent." });
        const device = await Device.findById(deviceId);
        if (!device) return res.status(404).json({ message: "Device not found in inventory." });
        const now = new Date();
        const dailyFineRate = device.overdueFeeRate || 15; 
        let fine = 0;
        if (now > activeTransaction.DueDate) {
            const diffTime = Math.abs(now - activeTransaction.DueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            fine = diffDays * dailyFineRate;
        }
        activeTransaction.FineAmount = fine;
        activeTransaction.Status = 'returned';
        activeTransaction.ReturnDate = now;
        activeTransaction.ConditionAtReturn = conditionAtReturn || 'Good'; 
        await activeTransaction.save();
        device.isAvailable = true;
        device.currentRenter = null;
        const currentLog = device.rentalHistory.find(history => history.userId.toString() === actualRenterId.toString() && !history.returnedAt);
        if (currentLog) currentLog.returnedAt = now;
        await device.save();
        await User.findByIdAndUpdate(actualRenterId, { $pull: { activeRentals: deviceId } });
        const user = await User.findById(actualRenterId);
        if (user) await sendReturnEmail({ to: user.email, name: user.name, deviceName: device.name });
        res.status(200).json({ message: `Device successfully returned. Condition logged: ${conditionAtReturn || 'Good'}.`, fineApplied: fine, device });
    } catch (error) {
        res.status(500).json({ message: "Backend return process error", error: error.message });
    }
};

exports.filterItems = async (req, res) => {
    try {
        const { location, category, accountType } = req.query;
        let query = {};
        if (location) query.location = location;
        if (category) query.category = category;
        if (accountType) query.accountType = accountType;
        const items = await Device.find(query);
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Error filtering items", error: error.message });
    }
};