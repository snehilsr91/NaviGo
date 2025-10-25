import express from 'express';
import { getAllDetections, createDetection, resetDetections, getLatestDetection } from '../controllers/detections.controller.js';

const router = express.Router();

// GET all detections
router.get('/', getAllDetections);

// GET latest detection
router.get('/latest', getLatestDetection);

// POST new detection
router.post('/', createDetection);

// DELETE all detections
router.delete('/reset', resetDetections);

export default router;