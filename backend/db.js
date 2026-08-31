const mongoose = require('mongoose');

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) {
    return;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    const db = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 20000, // give Atlas more time on cold starts
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = connectDatabase;