import BuildingReview from "../models/BuildingReview.js";
import { connectDB, isConnected, getConnectionState } from "../utils/connectDB.js";

// Get all reviews for a building
export const getBuildingReviews = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    console.log(`📥 GET /buildings/${buildingId}/reviews`);
    
    // Ensure MongoDB is connected before querying
    // The middleware should have already connected, but we double-check here
    if (!isConnected()) {
      console.log(`🔄 MongoDB not connected, attempting to connect...`);
      await connectDB();
    }
    
    console.log(`🔌 MongoDB connection state: ${getConnectionState()} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    
    // Final check - if still not connected after attempt, return error
    if (!isConnected()) {
      console.error(`❌ MongoDB not connected after connection attempt. State: ${getConnectionState()}`);
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Database connection is not available. Please try again later.',
        connectionState: getConnectionState(),
      });
    }
    
    // Exclude main-gate
    if (buildingId === "main-gate") {
      console.log(`ℹ️ Main gate requested, returning empty array`);
      return res.json([]);
    }

    const reviews = await BuildingReview.find({ buildingId })
      .sort({ createdAt: -1 })
      .exec();
    
    console.log(`✅ Found ${reviews.length} reviews for building: ${buildingId}`);
    res.json(reviews);
  } catch (err) {
    console.error(`❌ Error fetching reviews for ${req.params.buildingId}:`, err);
    
    // Check if it's a connection error
    if (err.name === 'MongooseError' && (err.message.includes('buffering') || err.message.includes('timeout'))) {
      return res.status(503).json({
        error: 'Database connection timeout',
        message: 'Database is not responding. Please check your MongoDB connection and network settings.',
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch reviews', 
      details: err.message 
    });
  }
};

// Add a review/comment for a building
export const createBuildingReview = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { comment, photo } = req.body; // Expect comment and Base64 photo string

    console.log("--- New Review Request ---");
    console.log("Building ID (from params):", buildingId);
    console.log("Has Comment:", !!comment);
    console.log("Has Photo:", !!photo, "(Photo length:", photo ? photo.length : 0, ")");
    console.log("--------------------------");

    // Ensure MongoDB is connected before querying
    // The middleware should have already connected, but we double-check here
    if (!isConnected()) {
      console.log(`🔄 MongoDB not connected, attempting to connect...`);
      await connectDB();
    }
    
    console.log(`🔌 MongoDB connection state: ${getConnectionState()}`);

    // Final check - if still not connected after attempt, return error
    if (!isConnected()) {
      console.error(`❌ MongoDB not connected after connection attempt. State: ${getConnectionState()}`);
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Database connection is not available. Please try again later.',
        connectionState: getConnectionState(),
      });
    }

    // Exclude main-gate
    if (buildingId === "main-gate") {
      return res.status(403).json({ error: "Reviews not available for main gate" });
    }

    // Basic validation
    if (!comment && !photo) {
      return res.status(400).json({ error: "A comment or a photo is required." });
    }

    const newReview = new BuildingReview({
      buildingId,
      comment: comment || "",
      photo: photo || null,
    });

    await newReview.save();
    console.log(`✅ Review created successfully for building: ${buildingId}`);
    res.status(201).json(newReview);
  } catch (err) {
    console.error("Error creating building review:", err);
    
    // Check if it's a connection error
    if (err.name === 'MongooseError' && (err.message.includes('buffering') || err.message.includes('timeout'))) {
      return res.status(503).json({
        error: 'Database connection timeout',
        message: 'Database is not responding. Please check your MongoDB connection and network settings.',
      });
    }
    
    res.status(500).json({ error: "Failed to create review.", details: err.message });
  }
};

