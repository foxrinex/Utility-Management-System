// Turan: Transaction Auditor - Mongoose Model (bKash only)
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // --- SUBSCRIBER IDENTITY ---
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    username: { type: String, required: true },
    phone: { type: String, required: true },

    // --- PAYMENT DETAILS ---
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    paymentMethod: { type: String, default: 'bkash' },

    // bKash 10-char alphanumeric TrxID (e.g. 8N7A6W5X9Y)
    paymentIdentifier: { type: String, required: true, unique: true },

    // --- SUBSCRIPTION INFO ---
    subscriptionPlan: {
      type: String,
      default: 'Premium Utility Outage Alerts (SMS & Push)',
    },

    // --- AUDIT STATUS WORKFLOW ---
    // PENDING_AUDIT -> VERIFIED or FLAGGED
    status: {
      type: String,
      enum: ['PENDING_AUDIT', 'VERIFIED', 'FLAGGED', 'FAILED'],
      default: 'PENDING_AUDIT',
    },

    // --- AUDITOR METADATA (filled by Control Manager) ---
    auditedBy: { type: String, default: null },
    auditedAt: { type: Date, default: null },
    auditNotes: { type: String, default: '' },

    // --- DEMO / SANDBOX FLAG ---
    isSandbox: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Turan End
module.exports = mongoose.model('Transaction', transactionSchema);
