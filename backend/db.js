const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

module.exports = connectDatabase;