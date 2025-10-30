import React from 'react';
import { Calendar, Clock, MapPin, Users, ExternalLink, Tag } from 'lucide-react';
import { Event } from '@issb/types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'featured' | 'compact' | 'minimal';
  showRegistrationButton?: boolean;
  showCapacity?: boolean;
  showTags?: boolean;
  registrationStatus?: 'registered' | 'waitlist' | 'full' | 'closed' | 'not_started';
  onRegister?: (event: Event) => void;
  onViewDetails?: (event: Event) => void;
  onCancelRegistration?: (event: Event) => void;
  className?: string;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(date));
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

export const EventCard: React.FC<EventCardProps> = ({
  event,
  variant = 'default',
  showRegistrationButton = true,
  showCapacity = true,
  showTags = true,
  registrationStatus,
  onRegister,
  onViewDetails,
  onCancelRegistration,
  className
}) => {
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';
  const isMinimal = variant === 'minimal';

  const isPastEvent = new Date(event.endDate) < new Date();
  const isOngoingEvent = new Date() >= new Date(event.startDate) && new Date() <= new Date(event.endDate);
  const isUpcomingEvent = new Date() < new Date(event.startDate);
  
  const capacityPercentage = event.capacity ? (event.registeredCount / event.capacity) * 100 : 0;
  const isNearCapacity = capacityPercentage >= 80;
  const isAtCapacity = event.capacity && event.registeredCount >= event.capacity;

  const handleRegisterClick = () => {
    if (onRegister) {
      onRegister(event);
    }
  };

  const handleCancelRegistration = () => {
    if (onCancelRegistration) {
      onCancelRegistration(event);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(event);
    }
  };

  const getRegistrationButtonConfig = () => {
    if (!showRegistrationButton) return null;

    const config = {
      disabled: false,
      loading: false,
      text: 'Register',
      variant: 'primary' as const,
      onClick: handleRegisterClick
    };

    // Handle registration status
    switch (registrationStatus) {
      case 'registered':
        return {
          ...config,
          text: 'Registered',
          variant: 'secondary' as const,
          onClick: handleViewDetails
        };
      case 'waitlist':
        return {
          ...config,
          text: 'Waitlist',
          variant: 'outline' as const
        };
      case 'full':
        return {
          ...config,
          text: 'Full',
          disabled: true,
          variant: 'secondary' as const
        };
      case 'closed':
        return {
          ...config,
          text: 'Registration Closed',
          disabled: true,
          variant: 'secondary' as const
        };
      default:
        // Determine status based on event data
        if (isPastEvent) {
          return {
            ...config,
            text: 'Event Ended',
            disabled: true,
            variant: 'secondary' as const
          };
        }
        if (isOngoingEvent) {
          return {
            ...config,
            text: 'Join Event',
            variant: 'primary' as const
          };
        }
        if (isAtCapacity) {
          return {
            ...config,
            text: 'Join Waitlist',
            variant: 'outline' as const
          };
        }
        return config;
    }
  };

  const registrationConfig = getRegistrationButtonConfig();

  if (isMinimal) {
    return (
      <div className={cn('p-3 border rounded-lg hover:bg-gray-50 transition-colors', className)}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{event.title}</h3>
            <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
              <span>{formatDate(event.startDate)}</span>
              <span>•</span>
              <span className="capitalize">{event.type}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              getStatusColor(event.status)
            )}>
              {event.status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200',
          isFeatured && 'ring-2 ring-blue-200 bg-blue-50/50',
          className
        )}
        hover
        onClick={handleViewDetails}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
            {isFeatured && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Featured
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{event.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formatTime(event.startDate)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                getTypeColor(event.type)
              )}>
                {event.type}
              </span>
              {event.isVirtual && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Virtual
                </span>
              )}
            </div>
            
            {registrationConfig && (
              <Button
                variant={registrationConfig.variant}
                size="sm"
                disabled={registrationConfig.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  registrationConfig.onClick();
                }}
              >
                {registrationConfig.text}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'overflow-hidden',
        isFeatured && 'ring-2 ring-blue-200 bg-blue-50/50',
        className
      )}
      hover={!isPastEvent}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                getStatusColor(event.status)
              )}>
                {event.status}
              </span>
              {isFeatured && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Featured
                </span>
              )}
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                getTypeColor(event.type)
              )}>
                {event.type}
              </span>
              {event.isVirtual && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Virtual
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Date:</span>
            <span className="ml-2">{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Time:</span>
            <span className="ml-2">
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">Location:</span>
            <span className="ml-2">
              {event.isVirtual ? (
                <a 
                  href={event.virtualLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  Virtual Event
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              ) : (
                event.location
              )}
            </span>
          </div>
          
          {showCapacity && event.capacity && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium">Capacity:</span>
              <span className={cn(
                'ml-2',
                isNearCapacity && !isAtCapacity ? 'text-orange-600' : '',
                isAtCapacity ? 'text-red-600' : ''
              )}>
                {event.registeredCount} / {event.capacity} registered
              </span>
            </div>
          )}
        </div>

        {/* Capacity Bar */}
        {showCapacity && event.capacity && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Registration Progress</span>
              <span>{Math.round(capacityPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  isAtCapacity ? 'bg-red-500' : 
                  isNearCapacity ? 'bg-orange-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {showTags && event.tags && event.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center flex-wrap gap-1">
              <Tag className="w-3 h-3 text-gray-400" />
              {event.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Registration Status & Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {isOngoingEvent && (
              <span className="text-green-600 font-medium">🔴 Live Now</span>
            )}
            {isPastEvent && (
              <span className="text-gray-500">Event ended</span>
            )}
            {isUpcomingEvent && registrationConfig?.text === 'Register' && (
              <span className="text-blue-600">Registration open</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
            >
              View Details
            </Button>
            
            {registrationConfig && (
              <Button
                variant={registrationConfig.variant}
                size="sm"
                disabled={registrationConfig.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (registrationStatus === 'registered' && onCancelRegistration) {
                    onCancelRegistration(event);
                  } else {
                    registrationConfig.onClick();
                  }
                }}
              >
                {registrationConfig.text}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EventCard;