const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Reaching into the Node runtime environment memory for our connection URL
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1); // Force shut down the backend engine if the pipeline fails
  }
};

module.exports = connectDB;