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
        type: String, // Oauth doesn't require a password, but local auth does. This is why it's not required.
    },
    
    StudentIdNumber:{
        type: String,
        required: true,
        unique: true
    },

    role: {
        type: String,
        enum: ['Student', 'Faculty', 'Admin'],
        default: 'Student'
    },

    activeRentals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device'
    }]
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);