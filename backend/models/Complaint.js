const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true },
  residentName: { type: String, required: true },
  phone: { type: String, required: true },
  area: { type: String, required: true },
  utilityType: { type: String, enum: ['DESCO', 'WASA', 'TITAS'], required: true },
  billAmount: { type: Number, required: true },
  complaintReason: { type: String, required: true },
  status: { type: String, enum: ['SUBMITTED', 'UNDER_REVIEW', 'RESOLVED'], default: 'SUBMITTED' },
  managerReply: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);