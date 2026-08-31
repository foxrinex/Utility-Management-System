// Turan: Transaction Auditor Controller - Control Manager (Stripe & bKash Payment Verification)

const Transaction = require('../models/Transaction');

// --- BKASH TrxID REGEX VALIDATOR ---
// bKash TrxIDs are 10-character alphanumeric strings (e.g. 8N7A6W5X9Y)
const BKASH_TRXID_REGEX = /^[A-Z0-9]{10}$/;

// =============================================================================
// POST /api/transactions/bkash
// Resident submits a bKash TrxID after manual mobile payment
// =============================================================================
const submitBkashPayment = async (req, res) => {
  try {
    const { userId, username, phone, amount, trxId, isSandbox } = req.body;

    if (!username || !phone || !amount || !trxId) {
      return res.status(400).json({ error: 'Missing required fields: username, phone, amount, trxId' });
    }

    // Validate bKash TrxID format
    const normalizedTrxId = String(trxId).toUpperCase().trim();
    if (!isSandbox && !BKASH_TRXID_REGEX.test(normalizedTrxId)) {
      return res.status(400).json({
        error: 'Invalid bKash Transaction ID format. Must be 10 alphanumeric characters (e.g. 8N7A6W5X9Y).',
      });
    }

    // Prevent duplicate TrxID reuse (anti-fraud check)
    const duplicate = await Transaction.findOne({ paymentIdentifier: normalizedTrxId });
    if (duplicate) {
      return res.status(409).json({
        error: 'This bKash Transaction ID has already been submitted. Duplicate payments are not accepted.',
      });
    }

    const transaction = await Transaction.create({
      userId: userId || null,
      username,
      phone,
      amount: parseFloat(amount),
      currency: 'BDT',
      paymentMethod: 'bkash',
      paymentIdentifier: normalizedTrxId,
      status: 'PENDING_AUDIT',
      isSandbox: !!isSandbox,
    });

    res.status(201).json({
      message: 'bKash payment submitted successfully. Pending audit verification.',
      transactionId: transaction._id,
      trxId: normalizedTrxId,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'This Transaction ID is already recorded in the system.' });
    }
    res.status(500).json({ error: error.message });
  }
};


// =============================================================================
// GET /api/transactions/auditor/all
// Control Manager: fetch all transactions with search, filter, pagination
// =============================================================================
const getAuditorTransactions = async (req, res) => {
  try {
    const { search, status, gateway, page = 1, limit = 20 } = req.query;

    const query = {};

    // Gateway filter (bkash / stripe)
    if (gateway && gateway !== 'ALL') {
      query.paymentMethod = gateway.toLowerCase();
    }

    // Status filter
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Search by phone, username, or paymentIdentifier
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { phone: { $regex: s, $options: 'i' } },
        { username: { $regex: s, $options: 'i' } },
        { paymentIdentifier: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Summary stats for KPI cards
    const allTx = await Transaction.find({});
    const totalRevenueBDT = allTx
      .filter((t) => t.status === 'VERIFIED')
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingCount = allTx.filter((t) => t.status === 'PENDING_AUDIT').length;
    const verifiedCount = allTx.filter((t) => t.status === 'VERIFIED').length;
    const flaggedCount = allTx.filter((t) => t.status === 'FLAGGED').length;
    res.json({
      transactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      stats: { totalRevenueBDT, pendingCount, verifiedCount, flaggedCount },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// PATCH /api/transactions/auditor/verify/:id
// Control Manager stamps a transaction as VERIFIED or FLAGGED
// =============================================================================
const verifyTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, auditedBy, auditNotes } = req.body;

    if (!['VERIFIED', 'FLAGGED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be VERIFIED or FLAGGED.' });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      {
        status,
        auditedBy: auditedBy || 'Control Manager',
        auditedAt: new Date(),
        auditNotes: auditNotes || '',
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    res.json({ message: `Transaction stamped as ${status}.`, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// GET /api/transactions/auditor/export
// Generates a CSV stream for accounting audit export
// =============================================================================
const exportTransactionsCSV = async (req, res) => {
  try {
    const transactions = await Transaction.find({}).sort({ createdAt: -1 });

    const headers = [
      'Transaction ID',
      'Username',
      'Phone',
      'Amount',
      'Currency',
      'Payment Method',
      'Payment Identifier (TrxID)',
      'Subscription Plan',
      'Status',
      'Audited By',
      'Audited At',
      'Audit Notes',
      'Sandbox',
      'Created At',
    ];

    const rows = transactions.map((t) => [
      t._id,
      t.username,
      t.phone,
      t.amount,
      t.currency,
      t.paymentMethod,
      t.paymentIdentifier,
      t.subscriptionPlan,
      t.status,
      t.auditedBy || '',
      t.auditedAt ? t.auditedAt.toISOString() : '',
      `"${(t.auditNotes || '').replace(/"/g, "'")}"`,
      t.isSandbox ? 'YES' : 'NO',
      t.createdAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="utilix_audit_${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================================================
// GET /api/transactions/resident/:userId
// Resident checks their own active subscription status
// =============================================================================
const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const mongoose = require('mongoose');

    // Build a flexible query to match userId stored as ObjectId OR as string
    const idQuery = [];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      idQuery.push({ userId: new mongoose.Types.ObjectId(userId) });
    }
    idQuery.push({ userId: userId });

    const subscriptions = await Transaction.find({
      $or: idQuery,
      status: 'VERIFIED',
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (subscriptions.length === 0) {
      return res.json({ hasActiveSubscription: false });
    }

    res.json({ hasActiveSubscription: true, subscription: subscriptions[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Turan End

module.exports = {
  submitBkashPayment,
  getAuditorTransactions,
  verifyTransaction,
  exportTransactionsCSV,
  getUserSubscription,
};
