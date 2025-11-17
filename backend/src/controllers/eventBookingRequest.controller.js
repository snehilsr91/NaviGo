import EventBookingRequest from "../models/EventBookingRequest.js";
import Event from "../models/Event.js";
import { connectDB, isConnected } from "../utils/connectDB.js";
import { sendApprovalEmail, sendRejectionEmail } from "../utils/emailService.js";

// Create a new booking request
export const createBookingRequest = async (req, res) => {
  try {
    console.log(`📥 POST /event-booking-requests`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const requestData = req.body;
    
    // Validate required fields
    if (!requestData.title || !requestData.startTime || !requestData.endTime || 
        !requestData.auditoriumName || !requestData.organizationName || 
        !requestData.organizerEmail || !requestData.organizerName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, startTime, endTime, auditoriumName, organizationName, organizerEmail, and organizerName are required',
      });
    }
    
    // Validate dates
    const startTime = new Date(requestData.startTime);
    const endTime = new Date(requestData.endTime);
    
    if (startTime >= endTime) {
      return res.status(400).json({
        error: 'Invalid dates',
        message: 'End time must be after start time',
      });
    }
    
    if (startTime < new Date()) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'Start time cannot be in the past',
      });
    }
    
    // Check auditorium availability
    // Only one event at a time at every location - check for any overlapping times
    // Overlap occurs when: existing event starts before requested end AND ends after requested start
    const conflictingEvents = await Event.find({
      auditoriumBooked: true,
      auditoriumName: requestData.auditoriumName,
      status: { $in: ['upcoming', 'ongoing'] },
      startDate: { $lt: endTime }, // Event starts before requested end
      endDate: { $gt: startTime }, // Event ends after requested start
    }).exec();
    
    // Also check pending/approved booking requests
    const conflictingRequests = await EventBookingRequest.find({
      auditoriumName: requestData.auditoriumName,
      status: { $in: ['pending', 'approved'] },
      startTime: { $lt: endTime }, // Request starts before requested end
      endTime: { $gt: startTime }, // Request ends after requested start
    }).exec();
    
    if (conflictingEvents.length > 0 || conflictingRequests.length > 0) {
      return res.status(400).json({
        error: 'Auditorium unavailable',
        message: `The auditorium "${requestData.auditoriumName}" is already booked for the requested time slot`,
        available: false,
      });
    }
    
    // Create booking request
    const bookingRequest = new EventBookingRequest({
      ...requestData,
      startTime,
      endTime,
      status: 'pending',
    });
    
    await bookingRequest.save();
    
    console.log(`✅ Created booking request: ${bookingRequest.title}`);
    res.status(201).json({
      message: 'Booking request submitted successfully. Please wait for admin approval.',
      request: bookingRequest,
    });
  } catch (err) {
    console.error(`❌ Error creating booking request:`, err);
    res.status(500).json({
      error: 'Failed to create booking request',
      message: err.message,
    });
  }
};

// Get all booking requests (admin only)
export const getAllBookingRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log(`📥 GET /event-booking-requests`, { status });
    
    if (!isConnected()) {
      await connectDB();
    }

    let query = {};
    if (status) {
      query.status = status;
    }

    const requests = await EventBookingRequest.find(query)
      .sort({ requestedAt: -1 })
      .exec();
    
    console.log(`✅ Found ${requests.length} booking requests`);
    res.json(requests);
  } catch (err) {
    console.error(`❌ Error fetching booking requests:`, err);
    res.status(500).json({
      error: 'Failed to fetch booking requests',
      message: err.message,
    });
  }
};

// Get a single booking request
export const getBookingRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 GET /event-booking-requests/${id}`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const request = await EventBookingRequest.findById(id).exec();
    
    if (!request) {
      return res.status(404).json({
        error: 'Booking request not found',
        message: `Booking request with ID ${id} does not exist`,
      });
    }
    
    console.log(`✅ Found booking request: ${request.title}`);
    res.json(request);
  } catch (err) {
    console.error(`❌ Error fetching booking request:`, err);
    res.status(500).json({
      error: 'Failed to fetch booking request',
      message: err.message,
    });
  }
};

// Approve a booking request (admin only)
export const approveBookingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes, reviewedBy } = req.body;
    
    console.log(`📥 POST /event-booking-requests/${id}/approve`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const bookingRequest = await EventBookingRequest.findById(id).exec();
    
    if (!bookingRequest) {
      return res.status(404).json({
        error: 'Booking request not found',
        message: `Booking request with ID ${id} does not exist`,
      });
    }
    
    if (bookingRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Booking request has already been ${bookingRequest.status}`,
      });
    }
    
    // Double-check availability before approving
    // Only one event at a time at every location - check for any overlapping times
    const conflictingEvents = await Event.find({
      auditoriumBooked: true,
      auditoriumName: bookingRequest.auditoriumName,
      status: { $in: ['upcoming', 'ongoing'] },
      startDate: { $lt: bookingRequest.endTime }, // Event starts before requested end
      endDate: { $gt: bookingRequest.startTime }, // Event ends after requested start
    }).exec();
    
    const conflictingRequests = await EventBookingRequest.find({
      _id: { $ne: id },
      auditoriumName: bookingRequest.auditoriumName,
      status: { $in: ['pending', 'approved'] },
      startTime: { $lt: bookingRequest.endTime }, // Request starts before requested end
      endTime: { $gt: bookingRequest.startTime }, // Request ends after requested start
    }).exec();
    
    if (conflictingEvents.length > 0 || conflictingRequests.length > 0) {
      // Reject instead
      bookingRequest.status = 'rejected';
      bookingRequest.adminNotes = adminNotes || 'Auditorium no longer available';
      bookingRequest.reviewedAt = new Date();
      bookingRequest.reviewedBy = reviewedBy || 'system';
      await bookingRequest.save();
      
      return res.status(400).json({
        error: 'Auditorium unavailable',
        message: `The auditorium "${bookingRequest.auditoriumName}" is no longer available for the requested time slot`,
        request: bookingRequest,
      });
    }
    
    // Create the approved event
    const eventData = {
      title: bookingRequest.title,
      description: bookingRequest.description || bookingRequest.announcementContent,
      location: bookingRequest.location || bookingRequest.auditoriumName,
      locationCoordinates: bookingRequest.locationCoordinates,
      startDate: bookingRequest.startTime,
      endDate: bookingRequest.endTime,
      category: bookingRequest.category,
      organizer: bookingRequest.organizationName,
      contactEmail: bookingRequest.organizerEmail,
      maxParticipants: bookingRequest.maxParticipants,
      requiresAuditorium: true,
      auditoriumBooked: true,
      auditoriumName: bookingRequest.auditoriumName,
      image: bookingRequest.image || null, // Include image from booking request
      status: new Date(bookingRequest.startTime) <= new Date() && new Date(bookingRequest.endTime) >= new Date() ? 'ongoing' : 'upcoming',
    };
    
    const event = new Event(eventData);
    await event.save();
    
    // Update booking request
    bookingRequest.status = 'approved';
    bookingRequest.adminNotes = adminNotes;
    bookingRequest.reviewedAt = new Date();
    bookingRequest.reviewedBy = reviewedBy || 'admin';
    await bookingRequest.save();
    
    // Send approval email to organizer
    try {
      const emailResult = await sendApprovalEmail(bookingRequest, event);
      if (!emailResult.success) {
        console.error('⚠️ Email sending failed:', emailResult.message || emailResult.error);
      }
    } catch (emailError) {
      console.error('⚠️ Exception during email sending (but event was created):', emailError);
      console.error('   Error details:', emailError.message, emailError.stack);
      // Don't fail the request if email fails
    }
    
    console.log(`✅ Approved booking request and created event: ${event.title}`);
    res.json({
      message: 'Booking request approved and event created',
      request: bookingRequest,
      event: event,
    });
  } catch (err) {
    console.error(`❌ Error approving booking request:`, err);
    res.status(500).json({
      error: 'Failed to approve booking request',
      message: err.message,
    });
  }
};

// Reject a booking request (admin only)
export const rejectBookingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes, reviewedBy } = req.body;
    
    console.log(`📥 POST /event-booking-requests/${id}/reject`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const bookingRequest = await EventBookingRequest.findById(id).exec();
    
    if (!bookingRequest) {
      return res.status(404).json({
        error: 'Booking request not found',
        message: `Booking request with ID ${id} does not exist`,
      });
    }
    
    if (bookingRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Booking request has already been ${bookingRequest.status}`,
      });
    }
    
    bookingRequest.status = 'rejected';
    bookingRequest.adminNotes = adminNotes;
    bookingRequest.reviewedAt = new Date();
    bookingRequest.reviewedBy = reviewedBy || 'admin';
    await bookingRequest.save();
    
    // Send rejection email to organizer (optional)
    try {
      await sendRejectionEmail(bookingRequest);
    } catch (emailError) {
      console.error('⚠️ Failed to send rejection email (but request was rejected):', emailError);
      // Don't fail the request if email fails
    }
    
    console.log(`✅ Rejected booking request: ${bookingRequest.title}`);
    res.json({
      message: 'Booking request rejected',
      request: bookingRequest,
    });
  } catch (err) {
    console.error(`❌ Error rejecting booking request:`, err);
    res.status(500).json({
      error: 'Failed to reject booking request',
      message: err.message,
    });
  }
};

// Check auditorium availability
export const checkAuditoriumAvailability = async (req, res) => {
  try {
    const { auditoriumName, startTime, endTime, excludeRequestId } = req.query;
    
    console.log(`📥 GET /event-booking-requests/check-availability`);
    
    if (!isConnected()) {
      await connectDB();
    }

    if (!auditoriumName || !startTime || !endTime) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'auditoriumName, startTime, and endTime are required',
      });
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validate date range
    if (start >= end) {
      return res.status(400).json({
        error: 'Invalid time range',
        message: 'End time must be after start time',
      });
    }
    
    // Check existing events for overlapping times
    // Overlap occurs when:
    // 1. Event starts before requested end AND ends after requested start
    // 2. This ensures we catch any overlapping time periods
    const conflictingEvents = await Event.find({
      auditoriumBooked: true,
      auditoriumName: auditoriumName,
      status: { $in: ['upcoming', 'ongoing'] },
      startDate: { $lt: end }, // Event starts before requested end
      endDate: { $gt: start }, // Event ends after requested start
    }).exec();
    
    // Check pending/approved requests for overlapping times
    let requestQuery = {
      auditoriumName: auditoriumName,
      status: { $in: ['pending', 'approved'] },
      startTime: { $lt: end }, // Request starts before requested end
      endTime: { $gt: start }, // Request ends after requested start
    };
    
    if (excludeRequestId) {
      requestQuery._id = { $ne: excludeRequestId };
    }
    
    const conflictingRequests = await EventBookingRequest.find(requestQuery).exec();
    
    const isAvailable = conflictingEvents.length === 0 && conflictingRequests.length === 0;
    
    res.json({
      available: isAvailable,
      conflicts: {
        events: conflictingEvents.map(e => ({
          title: e.title,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
        requests: conflictingRequests.map(r => ({
          title: r.title,
          startTime: r.startTime,
          endTime: r.endTime,
          status: r.status,
        })),
      },
    });
  } catch (err) {
    console.error(`❌ Error checking availability:`, err);
    res.status(500).json({
      error: 'Failed to check availability',
      message: err.message,
    });
  }
};

