import express from "express";
import {
  getPlaces,
  getNearbyPlaces,
  createPlace,
} from "../controllers/places.controller.js";

const router = express.Router();

router.get("/", getPlaces);
router.get("/nearby", getNearbyPlaces);
router.post("/", createPlace);

export default router;
