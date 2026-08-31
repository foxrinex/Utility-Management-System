const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  message: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  postedBy: { type: String, default: 'Control Manager' }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);