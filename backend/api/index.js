// Vercel serverless function entry point
import mongoose from 'mongoose';
import app from '../src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/navigo";

// MongoDB connection handler for serverless functions
// Mongoose handles connection pooling and reconnection automatically
async function connectDB() {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Check if connection is in progress
  if (mongoose.connection.readyState === 2) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log('✅ MongoDB connected (serverless)');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    // Don't throw - allow the app to run and retry on next request
  }
}

// Connect to MongoDB (Mongoose will reuse connections automatically)
connectDB().catch(console.error);

// Export the Express app as a serverless function
export default app;

