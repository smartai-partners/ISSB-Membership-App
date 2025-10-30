import React, { useEffect, useState } from 'react';
import { 
  Calendar, Clock, MapPin, Users, Tag, ExternalLink, Share2, 
  Heart, Download, User, Shield, AlertCircle, CheckCircle,
  Edit, Trash2, Eye, EyeOff
} from 'lucide-react';
import { Event, EventRegistration } from '@issb/types';
import { useEventStore } from './EventStore';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import EventRegistrationForm from './EventRegistration';
import { cn } from '../../utils/cn';

interface EventDetailsProps {
  eventId: string;
  onBack?: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onRegister?: (event: Event) => void;
  onCancelRegistration?: (registrationId: string) => void;
  className?: string;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }).format(new Date(date));
};

const formatDuration = (startDate: Date, endDate: Date): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return diffMinutes > 0 
      ? `${diffHours}h ${diffMinutes}m` 
      : `${diffHours}h`;
  }
  return `${diffMinutes}m`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'PUBLISHED':
      return 'bg-green-100 text-green-800';
    case 'ONGOING':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-600';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'conference':
      return 'bg-purple-100 text-purple-800';
    case 'workshop':
      return 'bg-blue-100 text-blue-800';
    case 'webinar':
      return 'bg-green-100 text-green-800';
    case 'meeting':
      return 'bg-yellow-100 text-yellow-800';
    case 'social':
      return 'bg-pink-100 text-pink-800';
    case 'training':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const EventDetails: React.FC<EventDetailsProps> = ({
  eventId,
  onBack,
  onEdit,
  onDelete,
  onRegister,
  onCancelRegistration,
  className
}) => {
  const {
    currentEvent,
    userRegistrations,
    isLoading,
    error,
    fetchEventById,
    registerForEvent,
    cancelRegistration,
    fetchUserRegistrations,
    clearError
  } = useEventStore();

  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventById(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    // Check if user is already registered for this event
    const existingRegistration = userRegistrations.find(reg => reg.eventId === eventId);
    if (existingRegistration) {
      setRegistration(existingRegistration);
      setIsRegistered(true);
    }
  }, [userRegistrations, eventId]);

  const isPastEvent = currentEvent ? new Date(currentEvent.endDate) < new Date() : false;
  const isOngoingEvent = currentEvent ? 
    new Date() >= new Date(currentEvent.startDate) && new Date() <= new Date(currentEvent.endDate) : false;
  const isUpcomingEvent = currentEvent ? new Date() < new Date(currentEvent.startDate) : false;

  const capacityPercentage = currentEvent?.capacity ? 
    (currentEvent.registeredCount / currentEvent.capacity) * 100 : 0;
  const isNearCapacity = capacityPercentage >= 80;
  const isAtCapacity = currentEvent?.capacity && currentEvent.registeredCount >= currentEvent.capacity;

  const handleRegistrationSuccess = (newRegistration: EventRegistration) => {
    setRegistration(newRegistration);
    setIsRegistered(true);
    setShowRegistrationForm(false);
    
    // Refresh user registrations
    // This would typically need userId from auth context
  };

  const handleCancelRegistration = async () => {
    if (registration) {
      const success = await cancelRegistration(registration.id);
      if (success) {
        setRegistration(null);
        setIsRegistered(false);
      }
    }
  };

  const handleDelete = () => {
    if (currentEvent && onDelete) {
      onDelete(currentEvent);
      setShowDeleteModal(false);
    }
  };

  const shareEvent = async () => {
    if (navigator.share && currentEvent) {
      try {
        await navigator.share({
          title: currentEvent.title,
          text: currentEvent.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You might want to show a toast notification here
    }
  };

  const addToCalendar = () => {
    if (!currentEvent) return;

    const startDate = new Date(currentEvent.startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(currentEvent.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(currentEvent.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(currentEvent.description)}&location=${encodeURIComponent(currentEvent.isVirtual ? 'Virtual Event' : currentEvent.location)}`;
    
    window.open(calendarUrl, '_blank');
  };

  const getRegistrationStatus = () => {
    if (!currentEvent) return { status: 'unknown', message: 'Loading...' };

    if (isPastEvent) {
      return { status: 'past', message: 'Event has ended' };
    }

    if (isOngoingEvent) {
      return { status: 'ongoing', message: 'Event is live' };
    }

    if (isAtCapacity) {
      return { status: 'full', message: 'Event is full' };
    }

    if (isRegistered) {
      return { status: 'registered', message: 'You are registered' };
    }

    if (currentEvent.registrationDeadline && new Date(currentEvent.registrationDeadline) < new Date()) {
      return { status: 'closed', message: 'Registration closed' };
    }

    return { status: 'open', message: 'Registration open' };
  };

  const registrationStatus = getRegistrationStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading event details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Event</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex justify-center space-x-3">
          <Button onClick={() => { clearError(); fetchEventById(eventId); }}>
            Try Again
          </Button>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Go Back
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (!currentEvent) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
        <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            ← Back to Events
          </Button>
        )}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={shareEvent}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={addToCalendar}>
            <Calendar className="w-4 h-4 mr-2" />
            Add to Calendar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      getStatusColor(currentEvent.status)
                    )}>
                      {currentEvent.status}
                    </span>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      getTypeColor(currentEvent.type)
                    )}>
                      {currentEvent.type}
                    </span>
                    {currentEvent.isVirtual && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        Virtual
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentEvent.title}</h1>
                </div>
              </div>

              {/* Event Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium">Date</div>
                    <div className="text-sm">
                      {formatDate(currentEvent.startDate)}
                      {new Date(currentEvent.startDate).toDateString() !== new Date(currentEvent.endDate).toDateString() && (
                        <span> - {formatDate(currentEvent.endDate)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div className="text-sm">
                      {formatTime(currentEvent.startDate)} - {formatTime(currentEvent.endDate)}
                      <span className="text-gray-500 ml-1">
                        ({formatDuration(currentEvent.startDate, currentEvent.endDate)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm">
                      {currentEvent.isVirtual ? (
                        <a 
                          href={currentEvent.virtualLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          Virtual Event
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        currentEvent.location
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium">Capacity</div>
                    <div className="text-sm">
                      {currentEvent.registeredCount} / {currentEvent.capacity || 'Unlimited'} registered
                    </div>
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              {currentEvent.capacity && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Registration Progress</span>
                    <span>{Math.round(capacityPercentage)}% Full</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={cn(
                        'h-3 rounded-full transition-all duration-300',
                        isAtCapacity ? 'bg-red-500' : 
                        isNearCapacity ? 'bg-orange-500' : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Event</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{currentEvent.description}</p>
                </div>
              </div>

              {/* Tags */}
              {currentEvent.tags && currentEvent.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex items-center flex-wrap gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    {currentEvent.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {currentEvent.attachments && currentEvent.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {currentEvent.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-blue-600 hover:text-blue-800">Download Attachment {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Registration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className={cn(
                  'text-lg font-medium',
                  registrationStatus.status === 'open' ? 'text-green-600' :
                  registrationStatus.status === 'full' ? 'text-red-600' :
                  registrationStatus.status === 'closed' ? 'text-gray-600' :
                  registrationStatus.status === 'registered' ? 'text-blue-600' :
                  'text-gray-600'
                )}>
                  {registrationStatus.message}
                </div>
              </div>

              <div className="space-y-3">
                {isRegistered ? (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center text-blue-800">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="font-medium">You're registered!</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      fullWidth 
                      onClick={handleCancelRegistration}
                    >
                      Cancel Registration
                    </Button>
                  </>
                ) : (
                  <Button 
                    fullWidth 
                    onClick={() => setShowRegistrationForm(true)}
                    disabled={
                      isAtCapacity || 
                      isPastEvent || 
                      (currentEvent.registrationDeadline && new Date(currentEvent.registrationDeadline) < new Date())
                    }
                  >
                    {isAtCapacity ? 'Join Waitlist' : 'Register Now'}
                  </Button>
                )}
              </div>

              {currentEvent.registrationDeadline && (
                <div className="mt-3 text-sm text-gray-600">
                  Registration deadline: {formatDate(currentEvent.registrationDeadline)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Organizer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Event Organizer</div>
                  <div className="text-sm text-gray-600">Organization</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {onEdit && (
                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={() => onEdit(currentEvent)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </Button>
                )}
                {onDelete && (
                  <Button 
                    variant="danger" 
                    fullWidth 
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationForm && (
        <Modal
          isOpen={showRegistrationForm}
          onClose={() => setShowRegistrationForm(false)}
          title="Register for Event"
          size="lg"
        >
          <EventRegistrationForm
            event={currentEvent}
            onSuccess={handleRegistrationSuccess}
            onCancel={() => setShowRegistrationForm(false)}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Event"
          size="md"
        >
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this event?
            </h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. All registered users will be notified of the cancellation.
            </p>
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete Event
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EventDetails;