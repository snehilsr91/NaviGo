// Vercel serverless function entry point
// The app already has MongoDB connection middleware in app.js
// This file just exports the app for Vercel's serverless function
import app from '../src/app.js';

export default app;

