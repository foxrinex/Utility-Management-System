const Complaint = require('../models/Complaint');

// Generate unique tracking ID
const generateTrackingId = () => {
  const prefix = 'UTIL';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
};

// Resident submits a complaint
const submitComplaint = async (req, res) => {
  const { residentName, phone, area, utilityType, billAmount, complaintReason } = req.body;
  try {
    if (!residentName || !phone || !area || !utilityType || !billAmount || !complaintReason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const trackingId = generateTrackingId();

    const complaint = await Complaint.create({
      trackingId,
      residentName,
      phone,
      area,
      utilityType,
      billAmount,
      complaintReason
    });

    res.status(201).json({
      message: 'Complaint submitted successfully!',
      trackingId: complaint.trackingId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resident tracks complaint by tracking ID
const trackComplaint = async (req, res) => {
  const { trackingId } = req.params;
  try {
    const complaint = await Complaint.findOne({ trackingId });
    if (!complaint) {
      return res.status(404).json({ message: 'No complaint found with this tracking ID' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manager views all complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manager updates complaint status and reply
const updateComplaint = async (req, res) => {
  const { trackingId } = req.params;
  const { status, managerReply } = req.body;
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { trackingId },
      { status, managerReply },
      { new: true }
    );
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ message: 'Complaint updated successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitComplaint, trackComplaint, getAllComplaints, updateComplaint };