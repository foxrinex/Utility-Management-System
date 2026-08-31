const mongoose = require('mongoose');

// --- DEFINE SHIPMENT AUDIT LOG SCHEMA ---
const shipmentLogSchema = new mongoose.Schema({
  supplyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supply', required: true },
  supplyName: { type: String, required: true },
  supplySku: { type: String, required: true },
  quantityReceived: { type: Number, required: true, min: 1 },
  supplier: { type: String, required: true, trim: true },
  invoiceRef: { type: String, default: '', trim: true },
  receivedBy: { type: String, required: true },
  receivedById: { type: String, required: true },
  notes: { type: String, default: '', trim: true },
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ShipmentLog', shipmentLogSchema);
