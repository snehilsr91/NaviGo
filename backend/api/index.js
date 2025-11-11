// Vercel serverless function entry point
import mongoose from 'mongoose';
import app from '../src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('💡 Please set MONGODB_URI in Vercel environment variables');
  console.error('💡 Go to: Vercel Dashboard → Project → Settings → Environment Variables');
}

// MongoDB connection handler for serverless functions
// In serverless, we connect on first request (lazy connection)
let connectionPromise = null;

async function connectDB() {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If no MongoDB URI, throw error
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // If connection is in progress, return the existing promise
  if (mongoose.connection.readyState === 2) {
    if (connectionPromise) {
      return connectionPromise;
    }
    // Wait for existing connection
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve(mongoose.connection));
      mongoose.connection.once('error', reject);
      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
  }

  // Create new connection promise
  connectionPromise = (async () => {
    try {
      console.log('🔄 Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 second timeout
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        maxPoolSize: 1, // Maintain up to 1 socket connection for serverless
        minPoolSize: 0, // Allow connection pool to close when idle
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      });
      console.log('✅ MongoDB connected (serverless)');
      return mongoose.connection;
    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
      console.error('💡 Check:');
      console.error('   1. MONGODB_URI is set correctly in Vercel');
      console.error('   2. MongoDB Atlas IP whitelist includes 0.0.0.0/0 (or Vercel IPs)');
      console.error('   3. MongoDB username/password are correct');
      connectionPromise = null; // Reset promise on error
      throw err;
    }
  })();

  return connectionPromise;
}

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
  // Skip DB connection for health check endpoints
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ DB connection failed in middleware:', err.message);
    // Don't block the request, but log the error
    // The controller will handle the connection check
    next();
  }
});

// Export the Express app as a serverless function
export default app;

