const mongoose = require('mongoose');

const verificationIdSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['technician', 'warehouse'] },
  used: { type: Boolean, default: false },
  usedBy: { type: String, default: '' }, // username that claimed it
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VerificationId', verificationIdSchema);
