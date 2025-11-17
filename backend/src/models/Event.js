import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: true, // Building name or venue
  },
  locationCoordinates: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    enum: ['Academic', 'Cultural', 'Sports', 'Technical', 'Workshop', 'Seminar', 'Other'],
    default: 'Other',
  },
  organizer: {
    type: String,
    required: false,
  },
  contactEmail: {
    type: String,
    required: false,
  },
  maxParticipants: {
    type: Number,
    required: false,
  },
  registeredParticipants: [{
    name: String,
    email: String,
    registeredAt: { type: Date, default: Date.now },
  }],
  requiresAuditorium: {
    type: Boolean,
    default: false,
  },
  auditoriumBooked: {
    type: Boolean,
    default: false,
  },
  auditoriumName: {
    type: String,
    required: false,
  },
  image: {
    type: String, // Base64 or URL
    required: false,
  },
  registrationFormUrl: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ location: 1 });
eventSchema.index({ category: 1 });

// Update the updatedAt field before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Event", eventSchema);

