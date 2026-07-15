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
    // Identifies how this account authenticates (local credentials or OAuth).
        lowercase: true,
        trim: true
    },

    password:{
        type: String, // Oauth doesn't require a password, but local auth does. This is why it's not required.
    // Stores provider-specific user id (e.g., Google sub) for account linking.
    },

    // Identifies how this account authenticates (local credentials or OAuth).
    authProvider: {
        type: String,
    // Login is blocked until this becomes true for local accounts.
        enum: ['local', 'google'],
        default: 'local'
    },

    // Stores provider-specific user id (e.g., Google sub) for account linking.
    // Verification links are matched by hash so raw tokens are never saved.
    providerId: {
        type: String,
        default: null
    },

    // Login is blocked until this becomes true for local accounts.
    isEmailVerified: {
        type: Boolean,
        default: false
    },

    // Verification links are matched by hash so raw tokens are never saved.
    emailVerificationTokenHash: {
        type: String,
        default: null
    },

    emailVerificationExpires: {
        type: Date,
        default: null
    },

    lastVerificationSentAt: {
        type: Date,
        default: null
    },

    passwordResetTokenHash: {
        type: String,
        default: null
    },

    passwordResetExpires: {
        type: Date,
        default: null
    },

    notificationPreferences: {
        // User-level opt-in for due-soon reminder emails.
        rentalReminder: {
            type: Boolean,
            default: true
        }
    },
    
    StudentIdNumber:{
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true
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