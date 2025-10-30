import React, { useEffect, useState } from 'react';
import { Search, Filter, Grid, List, Calendar, MapPin, SortAsc, SortDesc } from 'lucide-react';
import { Event, EventFilter, EventType, EventStatus, MembershipTier } from '@issb/types';
import { useEventStore } from './EventStore';
import EventCard from './EventCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

interface EventListProps {
  title?: string;
  subtitle?: string;
  variant?: 'grid' | 'list' | 'compact';
  showFilters?: boolean;
  showSearch?: boolean;
  showViewToggle?: boolean;
  showPagination?: boolean;
  featuredOnly?: boolean;
  upcomingOnly?: boolean;
  myEventsOnly?: boolean;
  userId?: string;
  filters?: Partial<EventFilter>;
  onEventSelect?: (event: Event) => void;
  onCreateEvent?: () => void;
  className?: string;
}

export const EventList: React.FC<EventListProps> = ({
  title,
  subtitle,
  variant = 'grid',
  showFilters = true,
  showSearch = true,
  showViewToggle = false,
  showPagination = true,
  featuredOnly = false,
  upcomingOnly = false,
  myEventsOnly = false,
  userId,
  filters = {},
  onEventSelect,
  onCreateEvent,
  className
}) => {
  const {
    events,
    featuredEvents,
    upcomingEvents,
    myEvents,
    isLoading,
    error,
    pagination,
    filters: storeFilters,
    fetchEvents,
    fetchFeaturedEvents,
    fetchUpcomingEvents,
    fetchMyEvents,
    setFilters,
    clearFilters,
    setPage,
    clearError
  } = useEventStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(variant === 'list' ? 'list' : 'grid');
  const [localFilters, setLocalFilters] = useState<Partial<EventFilter>>(filters);

  const displayedEvents = featuredOnly 
    ? featuredEvents 
    : upcomingOnly 
    ? upcomingEvents 
    : myEventsOnly 
    ? myEvents 
    : events;

  useEffect(() => {
    if (featuredOnly) {
      fetchFeaturedEvents();
    } else if (upcomingOnly) {
      fetchUpcomingEvents();
    } else if (myEventsOnly && userId) {
      fetchMyEvents(userId);
    } else {
      fetchEvents({ ...storeFilters, ...filters });
    }
  }, [featuredOnly, upcomingOnly, myEventsOnly, userId, storeFilters, filters]);

  const handleSearch = (searchTerm: string) => {
    const newFilters = { ...localFilters, search: searchTerm || undefined };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    fetchEvents(newFilters);
  };

  const handleFilterChange = (key: keyof EventFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    fetchEvents(newFilters);
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const newFilters = { ...localFilters, sortBy, sortOrder };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    fetchEvents(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchEvents({ ...localFilters });
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    clearFilters();
    fetchEvents({});
  };

  const getRegistrationStatus = (event: Event): 'registered' | 'waitlist' | 'full' | 'closed' | 'not_started' => {
    // This would typically come from user registration data
    // For now, we'll implement basic logic based on event data
    if (event.registeredCount >= (event.capacity || 0)) {
      return 'full';
    }
    if (new Date(event.registrationDeadline || event.startDate) < new Date()) {
      return 'closed';
    }
    return 'not_started';
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Event Type"
            value={localFilters.type?.toString() || ''}
            onChange={(value) => handleFilterChange('type', value ? [value] : undefined)}
          >
            <option value="">All Types</option>
            {Object.values(EventType).map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Select>

          <Select
            label="Membership Tier"
            value={localFilters.tier?.toString() || ''}
            onChange={(value) => handleFilterChange('tier', value ? [value] : undefined)}
          >
            <option value="">All Tiers</option>
            {Object.values(MembershipTier).map(tier => (
              <option key={tier} value={tier}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </option>
            ))}
          </Select>

          <Select
            label="Status"
            value={localFilters.status?.toString() || ''}
            onChange={(value) => handleFilterChange('status', value ? [value] : undefined)}
          >
            <option value="">All Statuses</option>
            {Object.values(EventStatus).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </option>
            ))}
          </Select>

          <Select
            label="Sort By"
            value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
            onChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              handleSortChange(sortBy, sortOrder as 'asc' | 'desc');
            }}
          >
            <option value="startDate-asc">Date (Earliest First)</option>
            <option value="startDate-desc">Date (Latest First)</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="registeredCount-desc">Most Popular</option>
            <option value="createdAt-desc">Recently Created</option>
          </Select>
        </div>
      </Card>
    );
  };

  const renderEventCard = (event: Event) => {
    const cardProps = {
      event,
      variant: viewMode === 'grid' ? (featuredOnly ? 'featured' : 'default') : 'compact',
      registrationStatus: getRegistrationStatus(event),
      onViewDetails: onEventSelect,
      showCapacity: true,
      showTags: viewMode === 'grid'
    };

    return (
      <div key={event.id} className={cn(
        viewMode === 'grid' 
          ? 'w-full' 
          : 'w-full'
      )}>
        <EventCard {...cardProps} />
      </div>
    );
  };

  const renderEventList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading events...</span>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-2">Error loading events</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => { clearError(); fetchEvents(localFilters); }}>
            Try Again
          </Button>
        </Card>
      );
    }

    if (displayedEvents.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">
            {Object.keys(localFilters).length > 0 
              ? 'Try adjusting your filters to see more events.'
              : 'There are no events available at the moment.'
            }
          </p>
          {Object.keys(localFilters).length > 0 && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )}
        </Card>
      );
    }

    return (
      <>
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          {displayedEvents.map(renderEventCard)}
        </div>

        {showPagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    pagination.page - 2 + i,
                    pagination.totalPages - 4 + i
                  ));
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      {(title || showSearch || showViewToggle || onCreateEvent) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          
          <div className="flex items-center space-x-3">
            {showViewToggle && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {onCreateEvent && (
              <Button onClick={onCreateEvent}>
                Create Event
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-6">
          <Input
            placeholder="Search events..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-md"
          />
        </div>
      )}

      {/* Filters */}
      {renderFilters()}

      {/* Event List */}
      {renderEventList()}
    </div>
  );
};

export default EventList;