// Turan: Resident-Technician Chat Controller - GET & POST Message Endpoints (Chat Feature)
const ChatMessage = require('../models/ChatMessage');

// --- GET MESSAGES FOR AN OUTAGE ---
// Returns all chat messages for a given outage, ordered oldest-first
// GET /api/chat/:outageId
const getMessages = async (req, res) => {
  try {
    const { outageId } = req.params;
    const messages = await ChatMessage.find({ outageId })
      .sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

// --- SEND A MESSAGE FOR AN OUTAGE ---
// Creates a new message record linked to the outage
// POST /api/chat/:outageId
const sendMessage = async (req, res) => {
  try {
    const { outageId } = req.params;
    const { senderId, senderName, senderRole, message } = req.body;

    if (!senderId || !senderName || !senderRole || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!['resident', 'technician'].includes(senderRole)) {
      return res.status(400).json({ error: 'Invalid senderRole. Must be resident or technician.' });
    }

    const newMessage = await ChatMessage.create({
      outageId,
      senderId,
      senderName,
      senderRole,
      message: message.trim(),
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
};

module.exports = { getMessages, sendMessage };
// Turan End
