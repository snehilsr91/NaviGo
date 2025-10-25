import Review from "../models/Review.js";

// Get reviews for a place
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ placeId: req.params.placeId });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a review
export const createReview = async (req, res) => {
  try {
    const newReview = new Review(req.body);
    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
