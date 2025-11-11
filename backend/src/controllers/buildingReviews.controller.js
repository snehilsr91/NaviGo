import BuildingReview from "../models/BuildingReview.js";

// Get all reviews for a building
export const getBuildingReviews = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    console.log(`📥 GET /buildings/${buildingId}/reviews`);
    
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

    // --- DEBUGGING LOG ---
    console.log("--- New Review Request ---");
    console.log("Building ID (from params):", buildingId);
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    console.log("Has Comment:", !!comment);
    console.log("Has Photo:", !!photo, "(Photo length:", photo ? photo.length : 0, ")");
    console.log("--------------------------");

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
    res.status(201).json(newReview);
  } catch (err) {
    console.error("Error creating building review:", err);
    res.status(500).json({ error: "Failed to create review.", details: err.message });
  }
};

