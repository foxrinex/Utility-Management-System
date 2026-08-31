const mongoose = require('mongoose');

// --- DEFINE CORE OUTAGE TRACKING SCHEMA ---
const outageSchema = new mongoose.Schema({
  utilityType: { type: String, required: true },
  locationName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  description: { type: String, required: true },
  status: { type: String, required: true, default: 'PENDING' },
  estimatedRestoration: { type: String, required: true, default: 'Pending' },
  reporterId: { type: String, required: true },
  reporterName: { type: String, required: true },
  assignedTo: { type: String, default: '' },        
  assignedToName: { type: String, default: '' },  
  upvotes: { type: Number, default: 0 },
  upvotedBy: { type: [String], default: [] },

  // --- Resident review left by reporter after outage is resolved ---
  userRating: { type: Number, default: 0, min: 0, max: 5 },
  userComment: { type: String, default: '' },

  // Turan: Live Technician Location Tracking (Location Feature)
  technicianLocation: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  },
  // Turan End

  createdAt: { type: Date, default: Date.now }
});

// --- COMPILE AND EXPORT INSTANCE ---
module.exports = mongoose.model('Outage', outageSchema);