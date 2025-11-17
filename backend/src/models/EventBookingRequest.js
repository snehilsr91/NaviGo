import mongoose from "mongoose";

const eventBookingRequestSchema = new mongoose.Schema({
  // Event Details
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    enum: ['Academic', 'Cultural', 'Sports', 'Technical', 'Workshop', 'Seminar', 'Other'],
    default: 'Other',
  },
  
  // Organization Details
  organizationName: {
    type: String,
    required: true,
  },
  organizerEmail: {
    type: String,
    required: true,
  },
  organizerName: {
    type: String,
    required: true,
  },
  
  // Time and Location
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  auditoriumName: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: false, // Will be auto-set from auditoriumName if not provided
  },
  locationCoordinates: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },
  
  // Additional Details
  registrationFormUrl: {
    type: String, // Google Forms URL or other registration form
    required: false,
  },
  announcementContent: {
    type: String, // Content for announcements
    required: false,
  },
  maxParticipants: {
    type: Number,
    required: false,
  },
  image: {
    type: String, // Base64 string or URL
    required: false,
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String, // Admin can add notes when approving/rejecting
    required: false,
  },
  
  // Timestamps
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
    required: false,
  },
  reviewedBy: {
    type: String, // Admin username/email
    required: false,
  },
});

// Indexes for faster queries
eventBookingRequestSchema.index({ status: 1, requestedAt: -1 });
eventBookingRequestSchema.index({ auditoriumName: 1, startTime: 1, endTime: 1 });

export default mongoose.model("EventBookingRequest", eventBookingRequestSchema);

