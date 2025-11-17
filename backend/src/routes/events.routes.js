import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  bookAuditorium,
} from "../controllers/events.controller.js";

const router = express.Router();

// Get all events (with optional filters: ?status=ongoing&category=Technical)
router.get("/", getAllEvents);

// Get a single event by ID
router.get("/:id", getEventById);

// Create a new event
router.post("/", createEvent);

// Update an event
router.put("/:id", updateEvent);

// Delete an event
router.delete("/:id", deleteEvent);

// Register for an event
router.post("/:id/register", registerForEvent);

// Book auditorium for an event
router.post("/:id/book-auditorium", bookAuditorium);

export default router;

