import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Heart,
  Share2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useListEventsQuery,
  useRegisterForEventMutation,
  useCancelEventRegistrationMutation
} from '@/store/api/membershipApi';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    notes: '',
    guest_count: 0,
    dietary_restrictions: '',
    emergency_contact: ''
  });

  // Fetch events (in a real app, we'd have a getEventById endpoint)
  const { data: eventsData, isLoading } = useListEventsQuery({ status: 'published' });
  const [registerForEvent, { isLoading: isRegistering }] = useRegisterForEventMutation();
  const [cancelRegistration, { isLoading: isCancelling }] = useCancelEventRegistrationMutation();

  // Find the specific event
  const event = eventsData?.events?.find(e => e.id === id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/events')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await registerForEvent({
        event_id: event.id,
        ...registrationData
      }).unwrap();

      alert(result.message);
      setShowRegistrationForm(false);
      setRegistrationData({
        notes: '',
        guest_count: 0,
        dietary_restrictions: '',
        emergency_contact: ''
      });
    } catch (error: any) {
      alert(error.data?.error || 'Failed to register for event');
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    try {
      const result = await cancelRegistration({
        event_id: event.id
      }).unwrap();

      alert(result.message);
    } catch (error: any) {
      alert(error.data?.error || 'Failed to cancel registration');
    }
  };

  const eventDate = new Date(event.event_date);
  const isCapacityFull = event.capacity && event.current_registrations >= event.capacity;
  const spotsRemaining = event.capacity ? event.capacity - (event.current_registrations || 0) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-96 bg-gradient-to-r from-green-600 to-green-500">
        {event.featured_image_url ? (
          <img
            src={event.featured_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-32 w-32 text-white opacity-50" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="absolute top-6 left-6 flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Events
        </button>

        {/* Event Title */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
            <div className="flex items-center space-x-4 text-white/90">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {eventDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {eventDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Location */}
            {event.location && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-green-600 mr-3 mt-1" />
                  <div>
                    <p className="text-gray-700">{event.location}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Event Registration</h3>

              {/* Capacity Info */}
              {event.capacity && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-medium">
                      {event.current_registrations || 0} / {event.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isCapacityFull ? 'bg-red-500' : 'bg-green-600'
                      }`}
                      style={{
                        width: `${Math.min(
                          ((event.current_registrations || 0) / event.capacity) * 100,
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                  {spotsRemaining !== null && spotsRemaining > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} remaining
                    </p>
                  )}
                </div>
              )}

              {/* Registration Button */}
              {user ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowRegistrationForm(true)}
                    disabled={isRegistering}
                    className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Register Now
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCancelRegistration}
                    disabled={isCancelling}
                    className="w-full px-6 py-3 border-2 border-red-600 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isCancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 mr-2" />
                        Cancel Registration
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Sign In to Register
                </button>
              )}

              {/* Share Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Share this event</p>
                <div className="flex space-x-2">
                  <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Complete Registration</h3>
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Guests (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={registrationData.guest_count}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, guest_count: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dietary Restrictions (Optional)
                </label>
                <input
                  type="text"
                  value={registrationData.dietary_restrictions}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, dietary_restrictions: e.target.value })
                  }
                  placeholder="e.g., Vegetarian, No nuts"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact (Optional)
                </label>
                <input
                  type="text"
                  value={registrationData.emergency_contact}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, emergency_contact: e.target.value })
                  }
                  placeholder="Name and phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={registrationData.notes}
                  onChange={(e) =>
                    setRegistrationData({ ...registrationData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Any special requirements or notes"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {isRegistering ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
