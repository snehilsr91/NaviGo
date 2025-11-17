import Event from "../models/Event.js";
import { connectDB, isConnected } from "../utils/connectDB.js";

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const { status, category } = req.query;
    
    console.log(`📥 GET /events`, { status, category });
    
    if (!isConnected()) {
      await connectDB();
    }

    let query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .exec();
    
    // Update event statuses based on current time
    const now = new Date();
    const updatedEvents = events.map(event => {
      if (event.status === 'cancelled' || event.status === 'completed') {
        return event;
      }
      
      if (now >= new Date(event.startDate) && now <= new Date(event.endDate)) {
        if (event.status !== 'ongoing') {
          event.status = 'ongoing';
          event.save();
        }
      } else if (now > new Date(event.endDate)) {
        if (event.status !== 'completed') {
          event.status = 'completed';
          event.save();
        }
      }
      
      return event;
    });
    
    console.log(`✅ Found ${events.length} events`);
    res.json(updatedEvents);
  } catch (err) {
    console.error(`❌ Error fetching events:`, err);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: err.message,
    });
  }
};

// Get a single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 GET /events/${id}`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const event = await Event.findById(id).exec();
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: `Event with ID ${id} does not exist`,
      });
    }
    
    console.log(`✅ Found event: ${event.title}`);
    res.json(event);
  } catch (err) {
    console.error(`❌ Error fetching event:`, err);
    res.status(500).json({
      error: 'Failed to fetch event',
      message: err.message,
    });
  }
};

// Create a new event
export const createEvent = async (req, res) => {
  try {
    console.log(`📥 POST /events`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const eventData = req.body;
    
    // Validate required fields
    if (!eventData.title || !eventData.startDate || !eventData.endDate || !eventData.location) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, startDate, endDate, and location are required',
      });
    }
    
    // Validate dates
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Invalid dates',
        message: 'End date must be after start date',
      });
    }
    
    // Set initial status based on dates
    const now = new Date();
    if (now >= startDate && now <= endDate) {
      eventData.status = 'ongoing';
    } else if (now > endDate) {
      eventData.status = 'completed';
    } else {
      eventData.status = 'upcoming';
    }
    
    const event = new Event(eventData);
    await event.save();
    
    console.log(`✅ Created event: ${event.title}`);
    res.status(201).json(event);
  } catch (err) {
    console.error(`❌ Error creating event:`, err);
    res.status(500).json({
      error: 'Failed to create event',
      message: err.message,
    });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 PUT /events/${id}`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const event = await Event.findById(id).exec();
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: `Event with ID ${id} does not exist`,
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdAt') {
        event[key] = req.body[key];
      }
    });
    
    // Recalculate status if dates changed
    if (req.body.startDate || req.body.endDate) {
      const now = new Date();
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      if (now >= startDate && now <= endDate) {
        event.status = 'ongoing';
      } else if (now > endDate) {
        event.status = 'completed';
      } else if (event.status !== 'cancelled') {
        event.status = 'upcoming';
      }
    }
    
    event.updatedAt = Date.now();
    await event.save();
    
    console.log(`✅ Updated event: ${event.title}`);
    res.json(event);
  } catch (err) {
    console.error(`❌ Error updating event:`, err);
    res.status(500).json({
      error: 'Failed to update event',
      message: err.message,
    });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 DELETE /events/${id}`);
    
    if (!isConnected()) {
      await connectDB();
    }

    const event = await Event.findByIdAndDelete(id).exec();
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: `Event with ID ${id} does not exist`,
      });
    }
    
    console.log(`✅ Deleted event: ${event.title}`);
    res.json({ message: 'Event deleted successfully', event });
  } catch (err) {
    console.error(`❌ Error deleting event:`, err);
    res.status(500).json({
      error: 'Failed to delete event',
      message: err.message,
    });
  }
};

// Register for an event
export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    console.log(`📥 POST /events/${id}/register`);
    
    if (!isConnected()) {
      await connectDB();
    }

    if (!name || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name and email are required',
      });
    }

    const event = await Event.findById(id).exec();
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: `Event with ID ${id} does not exist`,
      });
    }
    
    // Check if already registered
    const alreadyRegistered = event.registeredParticipants.some(
      p => p.email.toLowerCase() === email.toLowerCase()
    );
    
    if (alreadyRegistered) {
      return res.status(400).json({
        error: 'Already registered',
        message: 'You are already registered for this event',
      });
    }
    
    // Check if event is full
    if (event.maxParticipants && event.registeredParticipants.length >= event.maxParticipants) {
      return res.status(400).json({
        error: 'Event full',
        message: 'This event has reached maximum capacity',
      });
    }
    
    // Check if event is still open for registration
    if (event.status === 'completed' || event.status === 'cancelled') {
      return res.status(400).json({
        error: 'Registration closed',
        message: 'This event is no longer accepting registrations',
      });
    }
    
    // Add participant
    event.registeredParticipants.push({
      name,
      email,
      registeredAt: new Date(),
    });
    
    await event.save();
    
    console.log(`✅ Registered ${name} for event: ${event.title}`);
    res.json({
      message: 'Successfully registered for event',
      event,
      participantCount: event.registeredParticipants.length,
    });
  } catch (err) {
    console.error(`❌ Error registering for event:`, err);
    res.status(500).json({
      error: 'Failed to register for event',
      message: err.message,
    });
  }
};

// Book auditorium for an event
export const bookAuditorium = async (req, res) => {
  try {
    const { id } = req.params;
    const { auditoriumName } = req.body;
    
    console.log(`📥 POST /events/${id}/book-auditorium`);
    
    if (!isConnected()) {
      await connectDB();
    }

    if (!auditoriumName) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Auditorium name is required',
      });
    }

    const event = await Event.findById(id).exec();
    
    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: `Event with ID ${id} does not exist`,
      });
    }
    
    // Check if auditorium is already booked for overlapping time
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const conflictingEvents = await Event.find({
      _id: { $ne: id },
      auditoriumBooked: true,
      auditoriumName: auditoriumName,
      status: { $in: ['upcoming', 'ongoing'] },
      $or: [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $lte: endDate, $gte: startDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
    }).exec();
    
    if (conflictingEvents.length > 0) {
      return res.status(400).json({
        error: 'Auditorium unavailable',
        message: `The auditorium "${auditoriumName}" is already booked for the requested time slot`,
        conflictingEvents: conflictingEvents.map(e => ({
          title: e.title,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
      });
    }
    
    // Book the auditorium
    event.auditoriumBooked = true;
    event.auditoriumName = auditoriumName;
    event.requiresAuditorium = true;
    
    await event.save();
    
    console.log(`✅ Booked auditorium ${auditoriumName} for event: ${event.title}`);
    res.json({
      message: 'Auditorium booked successfully',
      event,
    });
  } catch (err) {
    console.error(`❌ Error booking auditorium:`, err);
    res.status(500).json({
      error: 'Failed to book auditorium',
      message: err.message,
    });
  }
};

