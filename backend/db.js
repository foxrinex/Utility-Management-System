const mongoose = require('mongoose');

let cached = global._mongooseConnection;

if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDatabase = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 20000,
    }).then((mongooseInstance) => {
      console.log('MongoDB connected successfully.');
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDatabase;