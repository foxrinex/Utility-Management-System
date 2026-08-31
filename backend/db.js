const mongoose = require('mongoose');
 
// Cache the connection (and any in-flight connection promise) on the global
// object so it survives across function invocations in the same warm
// serverless instance, and so concurrent requests don't each try to open
// their own separate connection.
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
    cached.promise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 20000, // give Atlas more time on cold starts
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully.');
        return mongooseInstance;
      })
      .catch((error) => {
        // Reset promise so the next request can retry instead of being
        // stuck with a permanently rejected cached promise.
        cached.promise = null;
        console.error('Database connection failed:', error);
        throw error;
      });
  }
 
  cached.conn = await cached.promise;
  return cached.conn;
};
 
module.exports = connectDatabase;