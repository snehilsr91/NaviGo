import { useState, useEffect } from 'react';
import { eventBookingRequestApi } from '../services/api';

function EventApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventBookingRequestApi.getAll(filter === 'all' ? null : filter);
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this booking request? An event will be created.')) {
      return;
    }

    try {
      setProcessing(id);
      await eventBookingRequestApi.approve(id, adminNotes || undefined, reviewedBy || undefined);
      setSelectedRequest(null);
      setAdminNotes('');
      setReviewedBy('');
      await loadRequests();
      alert('✅ Booking request approved and event created successfully!');
    } catch (err) {
      alert(`❌ Failed to approve: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this booking request?')) {
      return;
    }

    try {
      setProcessing(id);
      await eventBookingRequestApi.reject(id, adminNotes || undefined, reviewedBy || undefined);
      setSelectedRequest(null);
      setAdminNotes('');
      setReviewedBy('');
      await loadRequests();
      alert('✅ Booking request rejected successfully!');
    } catch (err) {
      alert(`❌ Failed to reject: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-400 mb-2">Event Approval</h1>
        <p className="text-gray-300">Review and approve booking requests for auditoriums and halls</p>
      </div>

      {/* Filters */}
      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'bg-black/60 text-gray-300 hover:bg-purple-500/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              filter === 'pending' ? 'bg-purple-600 text-white' : 'bg-black/60 text-gray-300 hover:bg-purple-500/20'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              filter === 'approved' ? 'bg-purple-600 text-white' : 'bg-black/60 text-gray-300 hover:bg-purple-500/20'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              filter === 'rejected' ? 'bg-purple-600 text-white' : 'bg-black/60 text-gray-300 hover:bg-purple-500/20'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-4 text-gray-300">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-black/60 border border-purple-500/20 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-lg">No booking requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-black/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                  {request.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">{formatDate(request.requestedAt)}</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">{request.title}</h3>
              <p className="text-gray-300 text-sm mb-4">{request.organizationName}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <span>📅</span>
                  <span>{formatDate(request.startTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span>⏰</span>
                  <span>Until: {formatDate(request.endTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <span>📍</span>
                  <span>{request.auditoriumName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span>👤</span>
                  <span>{request.organizerName} ({request.organizerEmail})</span>
                </div>
              </div>

              {request.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{request.description}</p>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-400">Review Booking Request</h2>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNotes('');
                  setReviewedBy('');
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Event Image Preview */}
              {selectedRequest.image && (
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">Event Image</label>
                  <div className="rounded-lg overflow-hidden border border-purple-500/30">
                    <img
                      src={selectedRequest.image}
                      alt={selectedRequest.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">Event Title</label>
                <p className="text-white">{selectedRequest.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">Organization</label>
                <p className="text-white">{selectedRequest.organizationName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">Start Time</label>
                  <p className="text-white">{formatDate(selectedRequest.startTime)}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">End Time</label>
                  <p className="text-white">{formatDate(selectedRequest.endTime)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">Location/Auditorium</label>
                <p className="text-white font-semibold mb-2">{selectedRequest.auditoriumName}</p>
                {/* Availability Check */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        const response = await fetch(
                          `${API_URL}/api/event-booking-requests/check-availability?` +
                          `auditoriumName=${encodeURIComponent(selectedRequest.auditoriumName)}&` +
                          `startTime=${encodeURIComponent(selectedRequest.startTime)}&` +
                          `endTime=${encodeURIComponent(selectedRequest.endTime)}&` +
                          `excludeRequestId=${selectedRequest._id}`
                        );
                        const result = await response.json();
                        
                        if (result.available) {
                          alert(`✅ Location "${selectedRequest.auditoriumName}" is AVAILABLE for the requested time slot!\n\nNo overlapping events found.`);
                        } else {
                          let conflictMsg = `❌ Location "${selectedRequest.auditoriumName}" is NOT AVAILABLE.\n\n`;
                          conflictMsg += `Reason: Another event is already scheduled during this time.\n\n`;
                          if (result.conflicts?.events?.length > 0) {
                            conflictMsg += `Conflicting Approved Events:\n`;
                            result.conflicts.events.forEach(e => {
                              conflictMsg += `- ${e.title}\n  ${new Date(e.startDate).toLocaleString()} → ${new Date(e.endDate).toLocaleString()}\n`;
                            });
                          }
                          if (result.conflicts?.requests?.length > 0) {
                            conflictMsg += `\nConflicting Pending/Approved Requests:\n`;
                            result.conflicts.requests.forEach(r => {
                              conflictMsg += `- ${r.title} [${r.status.toUpperCase()}]\n  ${new Date(r.startTime).toLocaleString()} → ${new Date(r.endTime).toLocaleString()}\n`;
                            });
                          }
                          alert(conflictMsg);
                        }
                      } catch (err) {
                        alert(`Error checking availability: ${err.message}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="mt-2 px-4 py-2 text-sm bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-300 font-semibold transition-all duration-200"
                  >
                    🔍 Check Availability Now
                  </button>
                  <p className="text-xs text-gray-400 mt-2">
                    Note: Only one event can be scheduled at a time for each location. This checks for any overlapping times.
                  </p>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">Description</label>
                  <p className="text-white">{selectedRequest.description}</p>
                </div>
              )}

              {selectedRequest.registrationFormUrl && (
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">Registration Form</label>
                  <a href={selectedRequest.registrationFormUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    {selectedRequest.registrationFormUrl}
                  </a>
                </div>
              )}

              {selectedRequest.announcementContent && (
                <div>
                  <label className="block text-sm font-semibold text-purple-400 mb-2">Announcement Content</label>
                  <p className="text-white">{selectedRequest.announcementContent}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">Contact</label>
                <p className="text-white">{selectedRequest.organizerName} ({selectedRequest.organizerEmail})</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">Admin Notes (optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Add notes for approval/rejection..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-400 mb-2">Reviewed By (optional)</label>
                <input
                  type="text"
                  value={reviewedBy}
                  onChange={(e) => setReviewedBy(e.target.value)}
                  className="w-full px-4 py-2 bg-black/60 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your name/email"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedRequest._id)}
                disabled={processing === selectedRequest._id}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === selectedRequest._id ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleApprove(selectedRequest._id)}
                disabled={processing === selectedRequest._id}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === selectedRequest._id ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventApproval;

