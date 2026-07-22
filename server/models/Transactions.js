const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ItemID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true
    },
    CheckoutDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    DueDate: {
      type: Date,
      required: true
    },
    Status: {
      type: String,
      enum: ['reserved', 'active', 'returned', 'overdue', 'cancelled'],
      default: 'active'
    },
    FineAmount: {
      type: Number,
      default: 0
    },
    ConditionAtCheckout: { 
      type: String, 
      required: true 
    },
    ConditionAtReturn: { 
      type: String 
    }
  }, { timestamps: true });
  
  module.exports = mongoose.model('Transaction', transactionSchema);