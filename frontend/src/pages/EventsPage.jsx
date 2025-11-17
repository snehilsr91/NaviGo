import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import { eventsApi, eventBookingRequestApi } from "../services/api";
import { BUILDINGS } from "../data/buildings";
import Carousel from "../components/UI/Carousel";
import DatePicker from "../components/DatePicker";

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all"); // all, upcoming, ongoing, completed
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationData, setRegistrationData] = useState({ name: "", email: "" });
  const [registering, setRegistering] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    title: "",
    description: "",
    organizationName: "",
    organizerName: "",
    organizerEmail: "",
    category: "Other",
    auditoriumName: "",
    location: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    registrationFormUrl: "",
    announcementContent: "",
    maxParticipants: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const categories = ["All", "Academic", "Cultural", "Sports", "Technical", "Workshop", "Seminar", "Other"];
  const eventCategories = ["Academic", "Cultural", "Sports", "Technical", "Workshop", "Seminar", "Other"];
  
  // Allowed locations for booking events
  const auditoriums = [
    "Auditorium (North Campus)",
    "Ground (North Campus)",
    "Sir MV Hall (South Campus)",
    "Azeez Sait Hall (South Campus)",
    "Diamond Jubilee Complex (South Campus)",
    "Dr. RK Hall (South Campus)",
  ];

  // Generate time options in 24-hour format with 30-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Handle image upload - convert to base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setBookingError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setBookingError('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setBookingFormData({ ...bookingFormData, image: base64String });
      setImagePreview(base64String);
      setBookingError('');
    };
    reader.onerror = () => {
      setBookingError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    setBookingFormData({ ...bookingFormData, image: null });
    setImagePreview(null);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, selectedStatus, selectedCategory]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await eventsApi.getAll();
      setEvents(data);
    } catch (err) {
      console.error("Error loading events:", err);
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (selectedStatus !== "all") {
      filtered = filtered.filter((e) => e.status === selectedStatus);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((e) => e.category === selectedCategory);
    }

    // Sort by start date
    filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    setFilteredEvents(filtered);
  };

  const handleRegister = async () => {
    if (!registrationData.name || !registrationData.email) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setRegistering(true);
      setError("");
      await eventsApi.register(selectedEvent._id, registrationData);
      setShowRegisterModal(false);
      setRegistrationData({ name: "", email: "" });
      await loadEvents(); // Reload to get updated participant count
      alert("Successfully registered for the event!");
    } catch (err) {
      setError(err.message || "Failed to register for event");
    } finally {
      setRegistering(false);
    }
  };

  // Combine date and time into Date object
  const combineDateAndTime = (date, time) => {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(':');
    // Parse date string (YYYY-MM-DD) as local date
    const [year, month, day] = date.split('-').map(Number);
    const dateTime = new Date(year, month - 1, day);
    dateTime.setHours(parseInt(hours, 10));
    dateTime.setMinutes(parseInt(minutes, 10));
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
    return dateTime;
  };

  const handleCheckAvailability = async () => {
    if (!bookingFormData.auditoriumName || !bookingFormData.eventDate || !bookingFormData.startTime || !bookingFormData.endTime) {
      setBookingError("Please select auditorium, date, and time slots");
      return;
    }

    try {
      setCheckingAvailability(true);
      setBookingError("");
      
      const startDateTime = combineDateAndTime(bookingFormData.eventDate, bookingFormData.startTime);
      const endDateTime = combineDateAndTime(bookingFormData.eventDate, bookingFormData.endTime);
      
      const result = await eventBookingRequestApi.checkAvailability(
        bookingFormData.auditoriumName,
        startDateTime.toISOString(),
        endDateTime.toISOString()
      );
      if (result.available) {
        setBookingError("");
        alert(`✅ Auditorium "${bookingFormData.auditoriumName}" is available for the selected time slot!`);
      } else {
        setBookingError(`❌ Auditorium is not available. Conflicting events found.`);
      }
    } catch (err) {
      setBookingError(err.message || "Failed to check availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!bookingFormData.title || !bookingFormData.organizationName || 
        !bookingFormData.organizerName || !bookingFormData.organizerEmail ||
        !bookingFormData.auditoriumName || !bookingFormData.eventDate || 
        !bookingFormData.startTime || !bookingFormData.endTime) {
      setBookingError("Please fill in all required fields");
      return;
    }

    // Combine date and time
    const startTime = combineDateAndTime(bookingFormData.eventDate, bookingFormData.startTime);
    const endTime = combineDateAndTime(bookingFormData.eventDate, bookingFormData.endTime);
    
    if (!startTime || !endTime) {
      setBookingError("Please select both date and time slots");
      return;
    }

    // Validate times
    if (startTime >= endTime) {
      setBookingError("End time must be after start time");
      return;
    }

    if (startTime < new Date()) {
      setBookingError("Event date and time cannot be in the past");
      return;
    }

    try {
      setSubmittingBooking(true);
      setBookingError("");
      
      const requestData = {
        ...bookingFormData,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: bookingFormData.location || bookingFormData.auditoriumName,
        maxParticipants: bookingFormData.maxParticipants ? parseInt(bookingFormData.maxParticipants) : undefined,
      };
      
      // Remove eventDate from requestData as it's not needed in the API
      delete requestData.eventDate;
      
      await eventBookingRequestApi.create(requestData);
      
      // Reset form
      setBookingFormData({
        title: "",
        description: "",
        organizationName: "",
        organizerName: "",
        organizerEmail: "",
        category: "Other",
        auditoriumName: "",
        location: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        registrationFormUrl: "",
        announcementContent: "",
        maxParticipants: "",
        image: null,
      });
      setImagePreview(null);
      setShowBookingModal(false);
      alert("✅ Booking request submitted successfully! Please wait for admin approval.");
    } catch (err) {
      setBookingError(err.message || "Failed to submit booking request");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "upcoming":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openMapWithLocation = (event) => {
    if (event.locationCoordinates?.lat && event.locationCoordinates?.lng) {
      const url = `/map?label=${encodeURIComponent(event.location)}&directions=true`;
      window.open(url, "_blank");
    } else {
      // Find building by name
      const building = BUILDINGS.find(
        (b) => b.name.toLowerCase() === event.location.toLowerCase()
      );
      if (building) {
        const url = `/map?label=${encodeURIComponent(building.name)}&directions=true`;
        window.open(url, "_blank");
      } else {
        alert(`Location "${event.location}" not found on map`);
      }
    }
  };

  const renderEventCard = (event) => {
    return (
      <>
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span
            className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getStatusColor(
              event.status
            )}`}
          >
            {event.status.toUpperCase()}
          </span>
          {event.category && (
            <span className="text-[10px] sm:text-xs text-gray-400">{event.category}</span>
          )}
        </div>

        {/* Event Image */}
        {event.image && (
          <div className="mb-3 sm:mb-4 rounded-lg overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-40 sm:h-48 object-cover rounded-lg border border-purple-500/20"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Event Title */}
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{event.title}</h3>

        {/* Description */}
        {event.description && (
          <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Date & Time */}
        <div className="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
            <span className="text-sm sm:text-base">📅</span>
            <span className="leading-tight">{formatDate(event.startDate)}</span>
          </div>
          {event.endDate && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
              <span className="text-sm sm:text-base">⏰</span>
              <span className="leading-tight">Until: {formatDate(event.endDate)}</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-400 mb-1.5 sm:mb-2">
            <span className="text-sm sm:text-base">📍</span>
            <span className="font-semibold leading-tight">{event.location}</span>
          </div>
          {event.auditoriumBooked && event.auditoriumName && (
            <div className="text-[10px] sm:text-xs text-gray-400 ml-5 sm:ml-6 leading-tight">
              Auditorium: {event.auditoriumName}
            </div>
          )}
        </div>

        {/* Participants Count */}
        {event.maxParticipants && (
          <div className="text-[10px] sm:text-xs text-gray-400 mb-3 sm:mb-4">
            {event.registeredParticipants?.length || 0} / {event.maxParticipants}{" "}
            participants
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:gap-2.5 mt-3 sm:mt-4">
          <button
            onClick={() => openMapWithLocation(event)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 bg-black/60 active:bg-black/80 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-lg transition-all duration-200 border border-purple-500/30 active:border-purple-500/50 touch-manipulation min-h-[44px]"
          >
            📍 View Location
          </button>
          {event.status === "upcoming" || event.status === "ongoing" ? (
            <button
              onClick={() => {
                setSelectedEvent(event);
                setShowRegisterModal(true);
                setError("");
              }}
              disabled={
                event.maxParticipants &&
                event.registeredParticipants?.length >= event.maxParticipants
              }
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 bg-gradient-to-r from-purple-600 to-purple-700 active:from-purple-500 active:to-purple-600 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
            >
              {event.maxParticipants &&
              event.registeredParticipants?.length >= event.maxParticipants
                ? "Event Full"
                : "Register"}
            </button>
          ) : null}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Purple accent lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        <div className="absolute top-60 left-10 w-px h-64 bg-gradient-to-b from-purple-500/20 to-transparent"></div>
        <div className="absolute bottom-40 right-20 w-px h-80 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 border border-purple-500/15 rotate-45"></div>
      </div>

      <Navbar />

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-28 px-4 sm:px-6 pb-8 sm:pb-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent px-2">
              Campus Events
            </h1>
            <p className="text-gray-300 text-base sm:text-lg px-2 mb-4">
              Discover ongoing and upcoming events on campus
            </p>
                <button
                  onClick={() => {
                    setShowBookingModal(true);
                    setBookingError("");
                    setImagePreview(null);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                >
                  🎯 Book Auditorium/Hall for Event
                </button>
          </div>

          {/* Filters */}
          <div className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-purple-500/30 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 bg-black/60 border border-purple-500/30 rounded-lg sm:rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 bg-black/60 border border-purple-500/30 rounded-lg sm:rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat === "All" ? "all" : cat.toLowerCase()}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/40 rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-4 text-gray-300">Loading events...</p>
            </div>
          )}

          {/* Events Grid */}
          {!loading && (
            <>
              {filteredEvents.length === 0 ? (
                <div className="bg-black/60 backdrop-blur-lg rounded-xl p-8 border border-purple-500/20 text-center">
                  <p className="text-gray-400 text-lg">No events found matching your filters.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Grid */}
                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                      <div
                        key={event._id}
                        className="bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                      >
                        {renderEventCard(event)}
                      </div>
                    ))}
                  </div>

                  {/* Mobile Carousel */}
                  <div className="md:hidden -mx-4 px-4">
                    <Carousel>
                      {filteredEvents.map((event) => (
                        <div
                          key={event._id}
                          className="bg-black/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-purple-500/30 active:border-purple-500/50 transition-all duration-300 touch-manipulation"
                        >
                          {renderEventCard(event)}
                        </div>
                      ))}
                    </Carousel>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-purple-500/30 max-w-md w-full">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Register for Event</h2>
            <p className="text-gray-300 mb-6">{selectedEvent.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={registrationData.name}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, name: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 bg-black/60 border border-purple-500/30 rounded-lg sm:rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={registrationData.email}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, email: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 bg-black/60 border border-purple-500/30 rounded-lg sm:rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setRegistrationData({ name: "", email: "" });
                  setError("");
                }}
                className="flex-1 px-4 py-2 bg-black/60 hover:bg-black/80 text-white font-semibold rounded-lg transition-all duration-200 border border-purple-500/30 hover:border-purple-500/50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={registering || !registrationData.name || !registrationData.email}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? "Registering..." : "Register"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-purple-500/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-400">Book Auditorium/Hall</h2>
              <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingError("");
                    setImagePreview(null);
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
            </div>

            {bookingError && (
              <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/40 rounded-xl p-4 mb-6">
                <p className="text-red-300">{bookingError}</p>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Event Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={bookingFormData.title}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="Enter event title"
                  required
                />
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Organization Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={bookingFormData.organizationName}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, organizationName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="Enter organization name"
                  required
                />
              </div>

              {/* Organizer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">
                    Organizer Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingFormData.organizerName}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, organizerName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={bookingFormData.organizerEmail}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, organizerEmail: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Category
                </label>
                <select
                  value={bookingFormData.category}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                >
                  {eventCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auditorium Selection */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Select Auditorium/Hall <span className="text-red-400">*</span>
                </label>
                <select
                  value={bookingFormData.auditoriumName}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, auditoriumName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  required
                >
                  <option value="">Select an auditorium/hall</option>
                  {auditoriums.map((aud) => (
                    <option key={aud} value={aud}>
                      {aud}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Event Date <span className="text-red-400">*</span>
                </label>
                <DatePicker
                  value={bookingFormData.eventDate}
                  onChange={(date) => setBookingFormData({ ...bookingFormData, eventDate: date })}
                  minDate={new Date().toISOString().split('T')[0]}
                  placeholder="Select event date"
                  required
                />
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">
                    Start Time (24-hour format) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={bookingFormData.startTime}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                    required
                  >
                    <option value="">Select start time</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">
                    End Time (24-hour format) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={bookingFormData.endTime}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                    required
                  >
                    <option value="">Select end time</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Check Availability Button */}
              {bookingFormData.auditoriumName && bookingFormData.eventDate && bookingFormData.startTime && bookingFormData.endTime && (
                <button
                  type="button"
                  onClick={handleCheckAvailability}
                  disabled={checkingAvailability}
                  className="w-full px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-300 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingAvailability ? "Checking..." : "🔍 Check Availability"}
                </button>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={bookingFormData.location}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="Building name or additional location details"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Event Description
                </label>
                <textarea
                  value={bookingFormData.description}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="Describe your event..."
                />
              </div>

              {/* Registration Form URL */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Registration Form URL (Google Forms, etc.)
                </label>
                <input
                  type="url"
                  value={bookingFormData.registrationFormUrl}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, registrationFormUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="https://forms.google.com/..."
                />
              </div>

              {/* Announcement Content */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Announcement Content
                </label>
                <textarea
                  value={bookingFormData.announcementContent}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, announcementContent: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="Content for campus announcements..."
                />
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Maximum Participants (optional)
                </label>
                <input
                  type="number"
                  value={bookingFormData.maxParticipants}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, maxParticipants: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50"
                  placeholder="Enter maximum number of participants"
                  min="1"
                />
              </div>

              {/* Event Image */}
              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">
                  Event Image (optional)
                </label>
                {!imagePreview ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="event-image-upload"
                    />
                    <label
                      htmlFor="event-image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-purple-500/30 border-dashed rounded-lg cursor-pointer bg-black/40 hover:bg-black/60 hover:border-purple-500/50 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className="w-full h-48 object-cover rounded-lg border border-purple-500/30"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBookingModal(false);
                        setBookingError("");
                        setImagePreview(null);
                      }}
                      className="flex-1 px-4 py-2.5 bg-black/60 hover:bg-black/80 text-white font-semibold rounded-lg transition-all duration-200 border border-purple-500/30 hover:border-purple-500/50"
                    >
                      Cancel
                    </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingBooking ? "Submitting..." : "Submit Booking Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;

