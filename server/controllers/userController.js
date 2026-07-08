const User = require('../models/Users'); // Make sure casing matches your file (user vs User)

// Create a new user
exports.createUser = async (req, res) => {
    try {
        // Pass the entire req.body so all fields (like StudentIdNumber) are included automatically
        const newUser = new User(req.body);
        await newUser.save();
        
        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};