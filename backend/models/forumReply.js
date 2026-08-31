const mongoose = require('mongoose');

// --- DEFINE FORUM REPLY SCHEMA ---
const forumReplySchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Forum', required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// --- COMPILE AND EXPORT INSTANCE ---
module.exports = mongoose.model('ForumReply', forumReplySchema);