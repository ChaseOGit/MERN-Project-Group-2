const mongoose = require('mongoose');

const devicesSchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  description: { type: String, default: "No description provided." }, 
  category: { type: String, required: true }, 
  serialNumber: { type: String, unique: true, required: true }, 
  
  location: { type: String, required: true }, 
  loanPeriod: { type: String, required: true },
  image: { type: String, default: 'https://via.placeholder.com/300x200?text=Tech+Device' },
  
  overdueFeeRate: { type: Number, required: true }, 
  
  isAvailable: { type: Boolean, default: true }, 
  currentRenter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  }, 
  rentalHistory: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    rentedAt: { type: Date }, 
    returnedAt: { type: Date } 
  }] 
}, { timestamps: true }); 

module.exports = mongoose.model('Device', devicesSchema);