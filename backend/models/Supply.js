const mongoose = require('mongoose');

// --- DEFINE SUPPLY INVENTORY ITEM SCHEMA ---
const supplySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Transformers', 'Cabling', 'Substation Parts', 'Safety Gear', 'Smart Meters', 'Circuit Breakers', 'Tools', 'Other'],
    default: 'Other'
  },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  unit: { type: String, required: true, default: 'units', trim: true },
  minThreshold: { type: Number, default: 10, min: 0 },
  lastSupplier: { type: String, default: '', trim: true },
  lastShipmentAmount: { type: Number, default: 0 },
  updatedBy: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supply', supplySchema);
