import mongoose from "mongoose";

const buildingReviewSchema = new mongoose.Schema({
  buildingId: {
    type: String,
    required: true,
    index: true,
  },
  comment: {
    type: String,
    required: false,
  },
  photo: {
    type: String, // To store Base64 string
    required: false,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Index for faster queries
buildingReviewSchema.index({ buildingId: 1, createdAt: -1 });

export default mongoose.model("BuildingReview", buildingReviewSchema);

