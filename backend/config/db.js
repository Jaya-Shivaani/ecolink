const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  // Reuse existing connection if active (crucial for Serverless / Vercel lambdas)
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }

  const connStr = process.env.MONGODB_URI;
  if (!connStr) {
    console.error('Database connection failed: MONGODB_URI environment variable is not defined.');
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    return null;
  }

  try {
    const conn = await mongoose.connect(connStr, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
