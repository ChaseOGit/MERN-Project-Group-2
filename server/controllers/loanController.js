const Transactions = require('../models/Transactions'); 
const Device = require('../models/Device');
const User = require('../models/Users');

exports.checkoutDevice = async (req, res) => {
    try {
        const { UserID, ItemID, DueDate } = req.body;
      
        const newTransaction = new Transactions({ UserID, ItemID, DueDate });
        await newTransaction.save();

        await Device.findByIdAndUpdate(ItemID, { 
            isAvailable: false, 
            currentRenter: UserID 
        });

        await User.findByIdAndUpdate(UserID, { 
            $push: { activeRentals: ItemID } 
        });

        res.status(201).json({ message: 'Device checked out successfully', transaction: newTransaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.returnDevice = async (req, res) => {
    try {
        const { id } = req.params; 
        const transaction = await Transactions.findById(id); 

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        const now = new Date();
        const dailyFineRate = 15; 
        let fine = 0;

        if (now > transaction.DueDate) {
            const diffTime = Math.abs(now - transaction.DueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            fine = diffDays * dailyFineRate;
        }


        transaction.FineAmount = fine;
        transaction.Status = 'returned';
        await transaction.save();


        await Device.findByIdAndUpdate(transaction.ItemID, { 
            isAvailable: true, 
            currentRenter: null 
        });


        await User.findByIdAndUpdate(transaction.UserID, { 
            $pull: { activeRentals: transaction.ItemID } 
        });

        res.status(200).json({ 
            message: 'Device returned successfully', 
            fineApplied: fine 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
