const Transactions = require('../models/Transactions');
const Device = require('../models/Device');
const User = require('../models/users'); // Lowercase 'u' to match Linux case-sensitivity
const { sendCheckoutEmail, sendReturnEmail } = require('../services/emailService');

exports.rentDevice = async (req, res) => { // Post - Rent a device
    try {
        const { deviceId, conditionAtCheckout } = req.body;
        
        // CIRCULATION DESK 
        // If a Faculty or Admin is at the desk, allow them to use the student's ID from the body.
        // Otherwise, use the logged-in user's ID (for self-checkout).
        const isFacultyOrAdmin = req.user.role === 'Admin' || req.user.role === 'Faculty';
        const targetUserId = (isFacultyOrAdmin && req.body.userId) ? req.body.userId : req.user._id;

        const device = await Device.findById(deviceId);
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }
        if (!device.isAvailable) {
            return res.status(400).json({ message: "Device is already checked out by someone else" });
        }

        const user = await User.findById(targetUserId);
        if (!user) {
            return res.status(404).json({ message: "Student account not found" });
        }

        // 1. Update Device
        device.isAvailable = false;
        device.currentRenter = targetUserId;
        device.rentalHistory.push({
            userId: targetUserId,
            rentedAt: new Date()
        });
        await device.save();

        // 2. Update User Account
        user.activeRentals.push(deviceId);
        await user.save();

        // 3. Calculate exact Due Date based on the specific device's loan period
        const loanDays = parseInt(device.loanPeriod) || 7; // Default to 7 if extraction fails
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanDays);
        
        // 4. Create the Transaction record
        const newTransaction = await Transactions.create({
            UserID: targetUserId,
            ItemID: deviceId,
            Status: 'active',
            ConditionAtCheckout: conditionAtCheckout || 'Good',
            DueDate: dueDate
        });

        // 5. Send best-effort transactional email to the student
        await sendCheckoutEmail({
            to: user.email,
            name: user.name,
            deviceName: device.name,
            loanPeriod: device.loanPeriod || 'allotted period',
        });

        res.status(200).json({
            message: `Success! Device assigned to ${user.name}. Please return within ${device.loanPeriod}.`, 
            device,
            transaction: newTransaction
        });
    } catch (error) {
        res.status(500).json({ message: "Backend checkout runtime error", error: error.message });
    }
};

exports.returnDevice = async (req, res) => { // Post - takes care of a returned device
    try {
        const { deviceId, conditionAtReturn } = req.body;
        const isFacultyOrAdmin = req.user.role === 'Admin' || req.user.role === 'Faculty';

        // 1. Find the active transaction regardless of who is scanning it
        const activeTransaction = await Transactions.findOne({ ItemID: deviceId, Status: 'active' });
        if (!activeTransaction) {
            return res.status(404).json({ message: "No active rental found for this device." });
        }

        const actualRenterId = activeTransaction.UserID;

        // 2. Security check: Only Faculty/Admins or the actual renter can return it
        if (!isFacultyOrAdmin && req.user._id.toString() !== actualRenterId.toString()) {
            return res.status(403).json({ message: "You cannot return a device you did not rent." });
        }

        const device = await Device.findById(deviceId);
        if (!device) {
            return res.status(404).json({ message: "Device not found in inventory." });
        }
        
        // 3. Calculate Fines
        const now = new Date();
        const dailyFineRate = device.overdueFeeRate || 15; 
        let fine = 0;

        if (now > activeTransaction.DueDate) {
            const diffTime = Math.abs(now - activeTransaction.DueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            fine = diffDays * dailyFineRate;
        }

        // 4. Close Transaction and Log Condition
        activeTransaction.FineAmount = fine;
        activeTransaction.Status = 'returned';
        activeTransaction.ReturnDate = now;
        activeTransaction.ConditionAtReturn = conditionAtReturn || 'Good'; 
        await activeTransaction.save();

        // 5. Release Device Inventory
        device.isAvailable = true;
        device.currentRenter = null;
        
        // Close out the tracking log on the device model
        const currentLog = device.rentalHistory.find(
            history => history.userId.toString() === actualRenterId.toString() && !history.returnedAt
        );
        if (currentLog) {
            currentLog.returnedAt = now;
        }
        await device.save();

        // 6. Release from Student Account
        await User.findByIdAndUpdate(actualRenterId, {
            $pull: { activeRentals: deviceId }
        });

        // 7. Send confirmation email to the student
        const user = await User.findById(actualRenterId);
        if (user) {
            await sendReturnEmail({
                to: user.email,
                name: user.name,
                deviceName: device.name,
            });
        }

        res.status(200).json({ 
            message: `Device successfully returned. Condition logged: ${conditionAtReturn || 'Good'}.`, 
            fineApplied: fine,
            device 
        });

    } catch (error) {
        res.status(500).json({ message: "Backend return process error", error: error.message });
    }
};

exports.getMyLoans = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find only active rentals for this specific user
        const loans = await Transactions.find({ UserID: userId, Status: 'active' }).populate('ItemID'); 

        res.status(200).json(loans);
    } catch (error) {
        res.status(500).json({ message: "Error fetching loans", error: error.message });
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