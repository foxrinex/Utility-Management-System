// Turan: Resident-Technician Chat - ChatMessage Model (Chat Feature)
const mongoose = require('mongoose');

// --- CHAT MESSAGE SCHEMA ---
// Stores each message exchanged between a resident and a technician
// for a specific outage/task. Messages are linked by outageId.
const chatMessageSchema = new mongoose.Schema(
  {
    outageId:   { type: String, required: true, index: true },
    senderId:   { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['resident', 'technician'], required: true },
    message:    { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
// Turan End
