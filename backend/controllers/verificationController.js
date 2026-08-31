const VerificationId = require('../models/VerificationId');
const User = require('../models/User');

// --- GENERATE A NEW VERIFICATION ID ---
const generateVerificationId = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !['technician', 'warehouse'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "technician" or "warehouse".' });
    }

    const prefix = type === 'technician' ? 'TECH' : 'DEPOT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `${prefix}-${timestamp}-${random}`;

    const newId = new VerificationId({ code, type });
    await newId.save();

    return res.status(201).json({ message: 'Verification ID generated.', verificationId: newId });
  } catch (error) {
    console.error('Generate verification ID error:', error);
    return res.status(500).json({ error: 'Internal error generating verification ID.' });
  }
};

// --- LIST ALL VERIFICATION IDs (for admin dashboard) ---
const listVerificationIds = async (req, res) => {
  try {
    const ids = await VerificationId.find().sort({ createdAt: -1 });
    return res.status(200).json(ids);
  } catch (error) {
    console.error('List verification IDs error:', error);
    return res.status(500).json({ error: 'Internal error fetching verification IDs.' });
  }
};

// --- REVOKE / DELETE A VERIFICATION ID ---
const revokeVerificationId = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await VerificationId.findById(id);

    if (!record) {
      return res.status(404).json({ error: 'Verification ID not found.' });
    }

    // If the ID was already claimed, delete the associated user account too
    if (record.used && record.usedBy) {
      await User.findOneAndDelete({ username: record.usedBy });
    }

    await VerificationId.findByIdAndDelete(id);

    return res.status(200).json({
      message: record.used && record.usedBy
        ? `Verification ID revoked and user account "${record.usedBy}" deleted.`
        : 'Verification ID revoked and removed.',
    });
  } catch (error) {
    console.error('Revoke verification ID error:', error);
    return res.status(500).json({ error: 'Internal error revoking verification ID.' });
  }
};

module.exports = { generateVerificationId, listVerificationIds, revokeVerificationId };
