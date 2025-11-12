import express from "express";
import { 
  getShankaracharyaBhavanPhotos, 
  getPhotoFile,
  getAllBuildingsWithPhotos 
} from "../controllers/buildingPhotos.controller.js";

const router = express.Router();

// GET /api/buildings/shankaracharya-bhavan/photos - Get list of photos
router.get("/shankaracharya-bhavan/photos", getShankaracharyaBhavanPhotos);

// GET /api/buildings/photos/shankaracharya-bhavan/:filename - Get specific photo file
router.get("/photos/shankaracharya-bhavan/:filename", getPhotoFile);

// GET /api/buildings/all-with-photos - Get all buildings with photo counts
router.get("/all-with-photos", getAllBuildingsWithPhotos);

export default router;

