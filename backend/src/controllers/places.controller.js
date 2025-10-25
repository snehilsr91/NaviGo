import Place from "../models/Place.js";

// Get all places
export const getPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get nearby places by lat/lng and radius (in meters)
export const getNearbyPlaces = async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng)
    return res.status(400).json({ error: "lat & lng required" });

  try {
    const places = await Place.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            (parseFloat(radius) || 1000) / 6378100, // convert meters to radians
          ],
        },
      },
    });
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new place
export const createPlace = async (req, res) => {
  try {
    const newPlace = new Place(req.body);
    await newPlace.save();
    res.status(201).json(newPlace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
