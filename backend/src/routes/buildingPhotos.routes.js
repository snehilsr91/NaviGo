import express from "express";
import { 
  getShankaracharyaBhavanPhotos, 
  getPlacePhotos,
  getPhotoFile,
  getAllBuildingsWithPhotos 
} from "../controllers/buildingPhotos.controller.js";

const router = express.Router();

// GET /api/buildings/all-with-photos - Get all places with photo counts (must be before dynamic routes)
router.get("/all-with-photos", getAllBuildingsWithPhotos);

// GET /api/buildings/photos/:placeName/:filename - Get specific photo file for any place (must be before /:placeName/photos)
router.get("/photos/:placeName/:filename", getPhotoFile);

// GET /api/buildings/shankaracharya-bhavan/photos - Get list of photos (backward compatibility)
router.get("/shankaracharya-bhavan/photos", getShankaracharyaBhavanPhotos);

// GET /api/buildings/:placeName/photos - Get photos for any place (dynamic route - must be last)
router.get("/:placeName/photos", getPlacePhotos);

export default router;

