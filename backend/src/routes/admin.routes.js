import express from "express";
import {
  getAllReviewsForModeration,
  deleteReview,
  getAllPhotosForModeration,
  deletePhoto,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Get all reviews for moderation
router.get("/reviews", getAllReviewsForModeration);

// Delete a review
router.delete("/reviews/:id", deleteReview);

// Get all photos for moderation
router.get("/photos", getAllPhotosForModeration);

// Delete a photo
router.delete("/photos/:buildingName/:filename", deletePhoto);

export default router;

