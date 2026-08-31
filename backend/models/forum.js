const mongoose = require('mongoose');

// --- DEFINE CORE TECHNICIAN FORUM SCHEMA ---
const forumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  questionContent: { type: String, required: true },
  askedById: { type: String, required: true },
  askedByName: { type: String, required: true },
  
  // Optional reference to an existing outage instance
  outageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outage', default: null },
  
  createdAt: { type: Date, default: Date.now }
});

// --- COMPILE AND EXPORT INSTANCE ---
module.exports = mongoose.model('Forum', forumSchema);