import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Place",
    required: true,
  },
  text: String,
  rating: Number,
  media: [{ url: String, type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Review", reviewSchema);
