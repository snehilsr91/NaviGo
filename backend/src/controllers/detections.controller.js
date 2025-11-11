import Detection from '../models/detection.model.js';
import { connectDB, isConnected } from '../utils/connectDB.js';

// Get all detections
export const getAllDetections = async (req, res) => {
  try {
    // Ensure MongoDB is connected
    if (!isConnected()) {
      await connectDB();
    }
    
    const detections = await Detection.find().sort({ timestamp: -1 });
    res.status(200).json(detections);
  } catch (error) {
    console.error('❌ Error fetching detections:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new detection
export const createDetection = async (req, res) => {
  try {
    // Ensure MongoDB is connected
    if (!isConnected()) {
      await connectDB();
    }
    
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
    console.error('❌ Error creating detection:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reset all detections
export const resetDetections = async (req, res) => {
  try {
    // Ensure MongoDB is connected
    if (!isConnected()) {
      await connectDB();
    }
    
    await Detection.deleteMany({});
    res.status(200).json({ message: 'All detections have been reset' });
  } catch (error) {
    console.error('❌ Error resetting detections:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get the latest detection
export const getLatestDetection = async (req, res) => {
  try {
    // Ensure MongoDB is connected
    if (!isConnected()) {
      await connectDB();
    }
    
    const latestDetection = await Detection.findOne().sort({ timestamp: -1 });
    
    if (!latestDetection) {
      return res.status(404).json({ message: 'No detections found' });
    }
    
    res.status(200).json(latestDetection);
  } catch (error) {
    console.error('❌ Error fetching latest detection:', error);
    res.status(500).json({ message: error.message });
  }
};