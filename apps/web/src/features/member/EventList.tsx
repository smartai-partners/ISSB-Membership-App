import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MemberEvent, EventRegistrationData } from './types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Tag, 
  UserPlus, 
  UserMinus,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Star,
  Heart,
  Share2,
  ExternalLink
} from 'lucide-react';

const EventList: React.FC = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<MemberEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'registered' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockEvents: MemberEvent[] = [
        {
          id: 'event-001',
          title: 'Annual Community Picnic',
          description: 'Join us for a fun-filled day with games, food, and networking opportunities.',
          date: '2024-03-15',
          time: '10:00 AM',
          location: 'Central Park Pavilion',
          category: 'social',
          status: 'upcoming',
          registrationRequired: true,
          registrationDeadline: '2024-03-10',
          capacity: 150,
          registeredCount: 87,
          tags: ['family-friendly', 'outdoor', 'networking'],
          isRegistered: true
        },
        {
          id: 'event-002',
          title: 'Professional Development Workshop',
          description: 'Learn essential skills for career advancement in a collaborative environment.',
          date: '2024-03-22',
          time: '2:00 PM',
          location: 'Community Center Hall A',
          category: 'educational',
          status: 'upcoming',
          registrationRequired: true,
          registrationDeadline: '2024-03-18',
          capacity: 50,
          registeredCount: 32,
          tags: ['professional', 'skills', 'career'],
          isRegistered: false
        },
        {
          id: 'event-003',
          title: 'Tech Innovation Meetup',
          description: 'Connect with fellow tech enthusiasts and discuss the latest industry trends.',
          date: '2024-04-05',
          time: '6:30 PM',
          location: 'Innovation Hub',
          category: 'networking',
          status: 'upcoming',
          registrationRequired: false,
          capacity: 100,
          registeredCount: 64,
          tags: ['technology', 'innovation', 'networking'],
          isRegistered: true
        },
        {
          id: 'event-004',
          title: 'Community Cleanup Day',
          description: 'Give back to our community by participating in this environmental initiative.',
          date: '2024-04-12',
          time: '9:00 AM',
          location: 'Various Locations',
          category: 'community',
          status: 'upcoming',
          registrationRequired: true,
          registrationDeadline: '2024-04-08',
          capacity: 200,
          registeredCount: 156,
          tags: ['environment', 'volunteer', 'community'],
          isRegistered: false
        },
        {
          id: 'event-005',
          title: 'Past Event: New Year Kickoff',
          description: 'Thank you for making our New Year celebration a huge success!',
          date: '2024-01-15',
          time: '7:00 PM',
          location: 'Grand Ballroom',
          category: 'social',
          status: 'completed',
          registrationRequired: false,
          capacity: 300,
          registeredCount: 245,
          tags: ['social', 'celebration', 'networking'],
          isRegistered: true
        }
      ];

      // Filter events based on current filter
      let filteredEvents = mockEvents;
      
      switch (filter) {
        case 'upcoming':
          filteredEvents = mockEvents.filter(event => event.status === 'upcoming');
          break;
        case 'registered':
          filteredEvents = mockEvents.filter(event => event.isRegistered);
          break;
        case 'past':
          filteredEvents = mockEvents.filter(event => event.status === 'completed');
          break;
        default:
          filteredEvents = mockEvents;
      }

      // Apply search filter
      if (searchTerm) {
        filteredEvents = filteredEvents.filter(event =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      if (loadMore) {
        setEvents(prev => [...prev, ...filteredEvents.slice(0, 3)]);
      } else {
        setEvents(filteredEvents);
      }
      
      setHasMore(filteredEvents.length > 5);
    } catch (error) {
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRegister = async (eventId: string): Promise<boolean> => {
    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, isRegistered: true, registeredCount: event.registeredCount + 1 }
          : event
      ));
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleUnregister = async (eventId: string): Promise<boolean> => {
    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, isRegistered: false, registeredCount: Math.max(0, event.registeredCount - 1) }
          : event
      ));
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleLoadMore = () => {
    fetchEvents(true);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      social: 'bg-pink-100 text-pink-700',
      educational: 'bg-blue-100 text-blue-700',
      networking: 'bg-purple-100 text-purple-700',
      community: 'bg-green-100 text-green-700',
      workshop: 'bg-orange-100 text-orange-700',
      conference: 'bg-indigo-100 text-indigo-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const isRegistrationOpen = (event: MemberEvent) => {
    if (!event.registrationRequired || event.status !== 'upcoming') return false;
    if (!event.registrationDeadline) return true;
    return new Date(event.registrationDeadline) > new Date();
  };

  const isEventFull = (event: MemberEvent) => {
    return event.capacity && event.registeredCount >= event.capacity;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <Filter size={16} />
              Filters
            </button>
            <button
              onClick={() => fetchEvents()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="registered">My Events</option>
              <option value="past">Past Events</option>
            </select>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No events match your current filter.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} variant="elevated" hover interactive className="overflow-hidden">
                {/* Event Image/Header */}
                <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                      {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
                      <Heart size={16} />
                    </button>
                    <button className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
                      <Share2 size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span className="text-sm font-medium">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span className="text-sm">{event.time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      <span className="truncate">{event.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span>
                        {event.registeredCount}
                        {event.capacity && ` / ${event.capacity}`} registered
                      </span>
                      {event.registeredCount >= (event.capacity || 0) * 0.9 && event.capacity && (
                        <span className="text-orange-600 font-medium">Filling up!</span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {event.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Registration Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {event.isRegistered ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Registered</span>
                        </div>
                      ) : event.status === 'completed' ? (
                        <span className="text-sm text-gray-500">Event Completed</span>
                      ) : isRegistrationOpen(event) ? (
                        <span className="text-sm text-blue-600 font-medium">
                          {isEventFull(event) ? 'Waitlist Available' : 'Registration Open'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Registration Closed</span>
                      )}
                    </div>

                    {/* Action Button */}
                    {event.status === 'upcoming' && (
                      <Button
                        size="sm"
                        variant={event.isRegistered ? "outline" : "primary"}
                        onClick={() => event.isRegistered ? handleUnregister(event.id) : handleRegister(event.id)}
                        icon={event.isRegistered ? <UserMinus size={14} /> : <UserPlus size={14} />}
                        disabled={!event.isRegistered && (!isRegistrationOpen(event) || isEventFull(event))}
                      >
                        {event.isRegistered ? 'Leave' : 'Join'}
                      </Button>
                    )}
                  </div>

                  {/* Additional Info */}
                  {event.registrationDeadline && isRegistrationOpen(event) && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <strong>Registration deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && events.length > 0 && (
          <div className="text-center">
            <Button
              onClick={handleLoadMore}
              loading={loadingMore}
              variant="outline"
              size="lg"
            >
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;