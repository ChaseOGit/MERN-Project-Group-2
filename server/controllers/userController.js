const User = require('../models/Users'); // Make sure casing matches your file (user vs User)

// Create a new user
exports.createUser = async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        
        // Convert to object and delete the password field before sending
        const userObject = newUser.toObject();
        delete userObject.password;
        
        res.status(201).json(userObject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// 2. NEW Login Function
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Login success
        res.status(200).json({ 
            message: "Login successful",
            user: { id: user._id, name: user.name, role: user.role } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
