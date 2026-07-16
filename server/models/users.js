const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        // OAuth doesn't require a password, but local auth does. 
        // This is why required is left out.
        type: String, 
    },
    // Identifies how this account authenticates (local credentials or OAuth).
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    // Stores provider-specific user id (e.g., Google sub) for account linking.
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
    StudentIdNumber: {
        type: String,
        required: false,
        unique: true,
        sparse: true, // This allows multiple Google users to have a "null" Student ID without crashing MongoDB!
        trim: true
    },
    role: {
        type: String,
        enum: ['Student', 'Faculty', 'Admin'], // Capitalized to match the Device schema
        default: 'Student'
    },
    activeRentals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device'
    }]
}, { timestamps: true });

// Export the model
module.exports = mongoose.model('User', userSchema);