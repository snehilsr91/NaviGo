import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  getBuildingReviews,
  createBuildingReview,
  getBuildingPhotos,
} from "../controllers/buildingReviews.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "../../uploads");
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `building-${req.params.buildingId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const router = express.Router();

// Get all reviews for a building
router.get("/:buildingId/reviews", getBuildingReviews);

// Get all photos for a building
router.get("/:buildingId/photos", getBuildingPhotos);

// Add a review with optional photos
router.post(
  "/:buildingId/reviews",
  upload.array("photos", 5), // Allow up to 5 photos per review
  createBuildingReview
);

export default router;

