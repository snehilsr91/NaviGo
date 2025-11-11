// Middleware to ensure MongoDB connection before handling requests
import mongoose from 'mongoose';

export const ensureDBConnection = async (req, res, next) => {
  // Check if MongoDB is connected
  if (mongoose.connection.readyState === 1) {
    // Already connected
    return next();
  }

  // Check if connection is in progress
  if (mongoose.connection.readyState === 2) {
    // Wait for connection to complete
    return new Promise((resolve) => {
      mongoose.connection.once('connected', () => {
        next();
        resolve();
      });
      mongoose.connection.once('error', () => {
        res.status(503).json({
          error: 'Database connection unavailable',
          message: 'Unable to connect to database. Please try again later.',
        });
        resolve();
      });
      // Timeout after 5 seconds
      setTimeout(() => {
        if (mongoose.connection.readyState !== 1) {
          res.status(503).json({
            error: 'Database connection timeout',
            message: 'Database connection is taking too long. Please try again.',
          });
          resolve();
        }
      }, 5000);
    });
  }

  // Not connected and not connecting - return error
  res.status(503).json({
    error: 'Database not connected',
    message: 'Database connection is not available. Please check server configuration.',
  });
};

