// MongoDB connection utility for serverless environments (Vercel)
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('💡 Please set MONGODB_URI in Vercel environment variables');
  console.error('💡 Go to: Vercel Dashboard → Project → Settings → Environment Variables');
  throw new Error('MONGODB_URI environment variable is required');
}

// Cache the connection promise to prevent multiple simultaneous connection attempts
let connectionPromise = null;

// Connection options optimized for serverless environments
const connectionOptions = {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxPoolSize: 1, // Maintain up to 1 socket connection for serverless
  minPoolSize: 0, // Allow connection pool to close when idle
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  // Removed deprecated options: useNewUrlParser, useUnifiedTopology
};

/**
 * Connect to MongoDB with connection reuse for serverless environments
 * This function ensures connections are reused across serverless invocations
 * @returns {Promise<mongoose.Connection>} Mongoose connection instance
 */
export async function connectDB() {
  // State 1 = connected - return immediately
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Using existing MongoDB connection (reused from previous invocation)');
    return mongoose.connection;
  }

  // State 2 = connecting - wait for the existing connection attempt
  if (mongoose.connection.readyState === 2) {
    console.log('⏳ MongoDB connection in progress, waiting for existing attempt...');
    if (connectionPromise) {
      return connectionPromise;
    }
    // If no promise exists but state is 2, wait for connection event
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MongoDB connection timeout after 10 seconds'));
      }, 10000);

      mongoose.connection.once('connected', () => {
        clearTimeout(timeout);
        console.log('✅ MongoDB connected (waited for in-progress connection)');
        resolve(mongoose.connection);
      });

      mongoose.connection.once('error', (err) => {
        clearTimeout(timeout);
        connectionPromise = null; // Reset promise on error
        reject(err);
      });
    });
  }

  // State 0 = disconnected - create new connection
  // State 3 = disconnecting - wait for disconnect, then connect
  if (mongoose.connection.readyState === 3) {
    console.log('⏳ MongoDB is disconnecting, waiting before reconnecting...');
    await new Promise((resolve) => {
      mongoose.connection.once('disconnected', resolve);
    });
  }

  // Create new connection (state is now 0)
  if (connectionPromise) {
    // If a promise already exists, return it (prevents multiple simultaneous attempts)
    return connectionPromise;
  }

  // Create new connection promise
  connectionPromise = (async () => {
    try {
      console.log('🔄 Connecting to MongoDB...');
      console.log(`🔌 Connection state before connect: ${mongoose.connection.readyState}`);
      
      await mongoose.connect(MONGODB_URI, connectionOptions);
      
      // Set up event listeners (only once)
      if (!mongoose.connection.listenerCount('connected')) {
        mongoose.connection.on('connected', () => {
          console.log('✅ MongoDB connected (serverless)');
        });

        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err.message);
          connectionPromise = null; // Reset promise on error so we can retry
        });

        mongoose.connection.on('disconnected', () => {
          console.warn('⚠️ MongoDB disconnected');
          connectionPromise = null; // Reset promise so we can reconnect
        });
      }

      // Log connection details
      console.log(`✅ MongoDB connected successfully`);
      console.log(`🔌 Connection state: ${mongoose.connection.readyState}`);
      console.log(`📍 Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
      
      return mongoose.connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      console.error('💡 Check:');
      console.error('   1. MONGODB_URI is set correctly in Vercel environment variables');
      console.error('   2. MongoDB Atlas IP whitelist includes 0.0.0.0/0 (allows all IPs)');
      console.error('   3. MongoDB username/password are correct');
      console.error('   4. Network connectivity to MongoDB Atlas');
      console.error('   5. MongoDB Atlas cluster is running and accessible');
      
      connectionPromise = null; // Reset promise on error so we can retry
      throw error;
    }
  })();

  return connectionPromise;
}

/**
 * Check if MongoDB is connected
 * @returns {boolean} True if connected, false otherwise
 */
export function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get current connection state
 * @returns {number} Connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
 */
export function getConnectionState() {
  return mongoose.connection.readyState;
}

export default connectDB;

