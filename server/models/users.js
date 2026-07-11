const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true,
        trim: true
    },

    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password:{
        type: String,
        required: true
    },
    
    StudentIdNumber:{
        type: String,
        required: true,
        unique: true
    },

    role: {
        type: String,
        enum: ['student', 'faculty', 'admin'],
        default: 'student'
    },

    activeRentals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device'
    }]
}, {timestamps: true});

const bcrypt = require('bcrypt');

userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    // Hash the password with a salt round of 10
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model('User', userSchema);
