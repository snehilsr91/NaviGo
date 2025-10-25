import express from "express";
import { getReviews, createReview } from "../controllers/reviews.controller.js";

const router = express.Router();

router.get("/:placeId", getReviews);
router.post("/", createReview);

export default router;
