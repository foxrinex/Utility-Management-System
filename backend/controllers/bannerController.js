const Banner = require('../models/Banner');

// Post a new banner (Manager only)
const postBanner = async (req, res) => {
  const { message } = req.body;
  try {
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Deactivate all previous banners
    await Banner.updateMany({}, { isActive: false });

    // Create new active banner
    const banner = await Banner.create({ message });
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get the current active banner (Public)
const getActiveBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate/delete banner (Manager only)
const deactivateBanner = async (req, res) => {
  try {
    await Banner.updateMany({}, { isActive: false });
    res.json({ message: 'Banner deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { postBanner, getActiveBanner, deactivateBanner };