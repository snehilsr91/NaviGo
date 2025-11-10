import BuildingReview from "../models/BuildingReview.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all reviews for a building
export const getBuildingReviews = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    // Exclude main-gate
    if (buildingId === "main-gate") {
      return res.status(403).json({ error: "Reviews not available for main gate" });
    }

    const reviews = await BuildingReview.find({ buildingId })
      .sort({ createdAt: -1 })
      .exec();
    
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a review/comment for a building
export const createBuildingReview = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { comment } = req.body;

    // Exclude main-gate
    if (buildingId === "main-gate") {
      return res.status(403).json({ error: "Reviews not available for main gate" });
    }

    const photos = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        photos.push({
          url: `/uploads/${file.filename}`,
          filename: file.filename,
        });
      });
    }

    const newReview = new BuildingReview({
      buildingId,
      comment: comment || "",
      photos,
    });

    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all photos for a building
export const getBuildingPhotos = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    // Exclude main-gate
    if (buildingId === "main-gate") {
      return res.status(403).json({ error: "Photos not available for main gate" });
    }

    const reviews = await BuildingReview.find({ 
      buildingId,
      photos: { $exists: true, $ne: [] }
    })
      .select("photos createdAt")
      .sort({ createdAt: -1 })
      .exec();
    
    // Flatten all photos from all reviews
    const allPhotos = [];
    reviews.forEach((review) => {
      review.photos.forEach((photo) => {
        allPhotos.push({
          ...photo.toObject(),
          createdAt: review.createdAt,
        });
      });
    });
    
    res.json(allPhotos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

