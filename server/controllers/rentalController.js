const Device = require('../models/device');
const User = require('../models/Users');


exports.rentDevice = async (req,res) => { // Post - Rent a device to a student
    try{
        const {deviceId, userId} = req.body;

        const device = await Device.findById(deviceId);
        if(!device){
            return res.status(404).json({message: "Device not found"});
        }
        if(!device.isAvailable){
            return res.status(400).json({message: "Device is already checked out by someone else"});
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message: "Student account not found"});
        }

        device.isAvailable = false
        device.currentRenter = userId;
        device.rentalHistory.push({
            userId: userId,
            rentedAt: new Date()
        });
        await device.save();
        user.activeRentals.push(deviceId);
        await user.save();

        res.status(200).json({
            message: `Success! Device checked out. Please return it within the standard ${device.loanPeriod || 'allotted'} loan period.`, 
            device 
        });
    } catch(error) {
        res.status(500).json({ message: "Backend checkout runtime error", error: error.message });
    }
};


exports.returnDevice = async (req, res) => { //Post - takes care of a returned device
    try {
        const { deviceId, userId } = req.body;

        // 1. Verify the device exists
        const device = await Device.findById(deviceId);
        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        // 2. Clear out the active rental variables
        device.isAvailable = true;
        device.currentRenter = null;

        // 3. Find their open logging line item in the history block and timestamp the return
        const currentLog = device.rentalHistory.find(
            history => history.userId.toString() === userId && !history.returnedAt
        );
        if (currentLog) {
            currentLog.returnedAt = new Date();
        }
        await device.save();

        // 4. Take the device completely out of that specific student's activeRentals array
        await User.findByIdAndUpdate(userId, {
            $pull: { activeRentals: deviceId }
        });

        res.status(200).json({ 
            message: "Device safely checked back into campus inventory!", 
            device 
        });

    } catch (error) {
        res.status(500).json({ message: "Backend return process error", error: error.message });
    }
};
