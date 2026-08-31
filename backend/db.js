const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    // Force the exact address and standard MongoDB port
    const mongoUri = 'mongodb://127.0.0.1:27017/utilix';
    
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully via Compass local service.');
    
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

module.exports = connectDatabase;