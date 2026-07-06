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

module.exports = mongoose.model('User', userSchema);