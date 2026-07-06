const express = require('express');
const router = express.Router();
const User = require('../models/Users');

// 1. DEBUG REGISTER (Create a test account)
router.post('/debug-register', async (req, res) => {
    try {
        const { name, email, role } = req.body;
        
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ success: false, message: "User with this email already exists!" });

        // Create new user with a fake generated Student ID
        user = new User({ 
            name: name || "Debug User", 
            email: email, 
            role: role || "Student",
            StudentIdNumber: "DEBUG-" + Math.floor(Math.random() * 1000000) // Fulfills teammate's schema requirement
        });
        
        await user.save();
        res.status(201).json({ success: true, data: user, message: "Debug account created!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. DEBUG LOGIN (Log into a test account)
router.post('/debug-login', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "Account not found. Please register first." });
        
        res.json({ success: true, data: user, message: "Logged in successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. GET USER PROFILE (For the Dashboard)
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('activeRentals');
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;