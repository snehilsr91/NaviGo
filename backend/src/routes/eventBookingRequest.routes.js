import express from "express";
import {
  createBookingRequest,
  getAllBookingRequests,
  getBookingRequestById,
  approveBookingRequest,
  rejectBookingRequest,
  checkAuditoriumAvailability,
} from "../controllers/eventBookingRequest.controller.js";

const router = express.Router();

// Create a new booking request
router.post("/", createBookingRequest);

// Check auditorium availability
router.get("/check-availability", checkAuditoriumAvailability);

// Get all booking requests (admin)
router.get("/", getAllBookingRequests);

// Get a single booking request
router.get("/:id", getBookingRequestById);

// Approve a booking request (admin)
router.post("/:id/approve", approveBookingRequest);

// Reject a booking request (admin)
router.post("/:id/reject", rejectBookingRequest);

export default router;

