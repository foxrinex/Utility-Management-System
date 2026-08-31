const mongoose = require('mongoose');

const preAuthorizedEmployeeSchema = new mongoose.Schema({
  companyProvidedId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  assignedRole: {
    type: String,
    required: true // 'technician' or 'warehouse'
  },
  
  isClaimed: {
    type: Boolean,
    required: true,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PreAuthorizedEmployee', preAuthorizedEmployeeSchema);