import Detection from '../models/detection.model.js';

// Get all detections
export const getAllDetections = async (req, res) => {
  try {
    const detections = await Detection.find().sort({ timestamp: -1 });
    res.status(200).json(detections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new detection
export const createDetection = async (req, res) => {
  try {
    const { detections } = req.body;
    
    if (!detections || !Array.isArray(detections)) {
      return res.status(400).json({ message: 'Invalid detection data' });
    }
    
    const newDetection = new Detection({
      objects: detections
    });
    
    const savedDetection = await newDetection.save();
    res.status(201).json(savedDetection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset all detections
export const resetDetections = async (req, res) => {
  try {
    await Detection.deleteMany({});
    res.status(200).json({ message: 'All detections have been reset' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get the latest detection
export const getLatestDetection = async (req, res) => {
  try {
    const latestDetection = await Detection.findOne().sort({ timestamp: -1 });
    
    if (!latestDetection) {
      return res.status(404).json({ message: 'No detections found' });
    }
    
    res.status(200).json(latestDetection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};