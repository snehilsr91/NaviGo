import mongoose from "mongoose";

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  images: [{ url: String, caption: String }],
  createdAt: { type: Date, default: Date.now },
});

placeSchema.index({ location: "2dsphere" });

export default mongoose.model("Place", placeSchema);
