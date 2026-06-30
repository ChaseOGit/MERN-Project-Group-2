const mongoose = require('mongoose');

const devicesSchema = new mongoose.Schema({ 
  name: {type: String, required: true}, 
  category: {type: String, required: true}, 
  serialNumber: {type: String, unique: true}, 
  RentRate: {type: Number, required: true}, 
  isAvailable: {type: Boolean, default: true}, 
  currentRenter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  }, 
  rentalHistory: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId,ref: 'User' }, 
    rentedAt: { type: Date }, 
    returnedAt: { type: Date } 
  }] 
}); 

// Export JUST the Device model
module.exports = mongoose.model('Device', devicesSchema);