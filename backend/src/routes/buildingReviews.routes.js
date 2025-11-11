import express from "express";
import {
  getBuildingReviews,
  createBuildingReview,
} from "../controllers/buildingReviews.controller.js";

const router = express.Router();

// Get all reviews for a building
router.get("/:buildingId/reviews", getBuildingReviews);

// Add a review with an optional photo
router.post("/:buildingId/reviews", createBuildingReview);

export default router;

