import BuildingReview from "../models/BuildingReview.js";
import { connectDB, isConnected } from "../utils/connectDB.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all reviews for moderation (admin only)
export const getAllReviewsForModeration = async (req, res) => {
  try {
    console.log(`📥 GET /admin/reviews`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const reviews = await BuildingReview.find({})
      .sort({ createdAt: -1 })
      .exec();
    
    console.log(`✅ Found ${reviews.length} reviews for moderation`);
    res.json(reviews);
  } catch (err) {
    console.error(`❌ Error fetching reviews:`, err);
    res.status(500).json({
      error: 'Failed to fetch reviews',
      message: err.message,
    });
  }
};

// Delete a review (admin only)
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 DELETE /admin/reviews/${id}`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const review = await BuildingReview.findByIdAndDelete(id).exec();
    
    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: `Review with ID ${id} does not exist`,
      });
    }
    
    console.log(`✅ Deleted review for building: ${review.buildingId}`);
    res.json({ 
      message: 'Review deleted successfully',
      review: review,
    });
  } catch (err) {
    console.error(`❌ Error deleting review:`, err);
    res.status(500).json({
      error: 'Failed to delete review',
      message: err.message,
    });
  }
};

// Get all building photos for moderation (admin only)
export const getAllPhotosForModeration = async (req, res) => {
  try {
    console.log(`📥 GET /admin/photos`);
    
    const photosDir = path.join(__dirname, "../../assets/Photos");
    const buildings = await fs.readdir(photosDir);
    
    const photos = [];
    
    for (const building of buildings) {
      const buildingPath = path.join(photosDir, building);
      const stat = await fs.stat(buildingPath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(buildingPath);
        for (const file of files) {
          if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            photos.push({
              buildingName: building,
              filename: file,
              path: `/api/buildings/photos/${building}/${file}`,
              url: `/uploads/Photos/${building}/${file}`,
            });
          }
        }
      }
    }
    
    console.log(`✅ Found ${photos.length} photos for moderation`);
    res.json(photos);
  } catch (err) {
    console.error(`❌ Error fetching photos:`, err);
    res.status(500).json({
      error: 'Failed to fetch photos',
      message: err.message,
    });
  }
};

// Delete a photo (admin only)
export const deletePhoto = async (req, res) => {
  try {
    const { buildingName, filename } = req.params;
    
    console.log(`📥 DELETE /admin/photos/${buildingName}/${filename}`);
    
    const photoPath = path.join(__dirname, "../../assets/Photos", buildingName, filename);
    
    try {
      await fs.access(photoPath);
      await fs.unlink(photoPath);
      
      console.log(`✅ Deleted photo: ${buildingName}/${filename}`);
      res.json({ 
        message: 'Photo deleted successfully',
        buildingName,
        filename,
      });
    } catch (fileErr) {
      if (fileErr.code === 'ENOENT') {
        return res.status(404).json({
          error: 'Photo not found',
          message: `Photo ${buildingName}/${filename} does not exist`,
        });
      }
      throw fileErr;
    }
  } catch (err) {
    console.error(`❌ Error deleting photo:`, err);
    res.status(500).json({
      error: 'Failed to delete photo',
      message: err.message,
    });
  }
};

