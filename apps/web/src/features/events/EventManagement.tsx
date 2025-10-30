import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, BarChart3, Settings, Search, Filter, Download,
  Edit, Trash2, Eye, EyeOff, CheckCircle, XCircle, Clock, 
  AlertTriangle, RefreshCw, FileText, Send, Mail
} from 'lucide-react';
import { Event, EventRegistration, EventFilter, EventStatus } from '@issb/types';
import { useEventStore } from './EventStore';
import EventList from './EventList';
import EventCard from './EventCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';

interface EventManagementProps {
  onEventSelect?: (event: Event) => void;
  onEventCreate?: () => void;
  className?: string;
}

interface EventMetrics {
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
  averageAttendance: number;
  capacityUtilization: number;
}

interface BulkAction {
  selectedEventIds: string[];
  action: 'publish' | 'unpublish' | 'cancel' | 'delete';
  reason?: string;
  notifyAttendees: boolean;
}

export const EventManagement: React.FC<EventManagementProps> = ({
  onEventSelect,
  onEventCreate,
  className
}) => {
  const {
    events,
    isLoading,
    error,
    filters,
    pagination,
    fetchEvents,
    updateEvent,
    deleteEvent,
    setFilters,
    clearFilters
  } = useEventStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction>({
    selectedEventIds: [],
    action: 'publish',
    notifyAttendees: true
  });
  const [showMetrics, setShowMetrics] = useState(false);
  const [eventMetrics, setEventMetrics] = useState<EventMetrics | null>(null);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const [analytics, setAnalytics] = useState({
    registrationsByMonth: [] as any[],
    eventsByType: [] as any[],
    attendanceTrends: [] as any[],
    capacityUtilization: [] as any[]
  });

  useEffect(() => {
    fetchEvents();
    fetchMetrics();
    fetchAnalytics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // This would typically be an API call to fetch event metrics
      const mockMetrics: EventMetrics = {
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === EventStatus.PUBLISHED).length,
        upcomingEvents: events.filter(e => new Date(e.startDate) > new Date()).length,
        completedEvents: events.filter(e => e.status === EventStatus.COMPLETED).length,
        cancelledEvents: events.filter(e => e.status === EventStatus.CANCELLED).length,
        totalRegistrations: events.reduce((sum, e) => sum + e.registeredCount, 0),
        averageAttendance: 85, // Mock data
        capacityUtilization: 72 // Mock data
      };
      setEventMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // This would typically be API calls to fetch analytics data
      setAnalytics({
        registrationsByMonth: [
          { month: 'Jan', registrations: 45 },
          { month: 'Feb', registrations: 52 },
          { month: 'Mar', registrations: 61 },
          { month: 'Apr', registrations: 48 },
          { month: 'May', registrations: 73 },
          { month: 'Jun', registrations: 69 }
        ],
        eventsByType: [
          { type: 'Workshop', count: 12, color: '#3B82F6' },
          { type: 'Conference', count: 8, color: '#8B5CF6' },
          { type: 'Webinar', count: 15, color: '#10B981' },
          { type: 'Meeting', count: 6, color: '#F59E0B' },
          { type: 'Social', count: 9, color: '#EF4444' }
        ],
        attendanceTrends: [
          { date: '2024-01', attendance: 78 },
          { date: '2024-02', attendance: 82 },
          { date: '2024-03', attendance: 85 },
          { date: '2024-04', attendance: 79 },
          { date: '2024-05', attendance: 88 },
          { date: '2024-06', attendance: 91 }
        ],
        capacityUtilization: [
          { event: 'Workshop A', utilization: 95 },
          { event: 'Conference B', utilization: 87 },
          { event: 'Webinar C', utilization: 76 },
          { event: 'Meeting D', utilization: 92 },
          { event: 'Social E', utilization: 68 }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters({ ...filters, search: term });
    fetchEvents({ ...filters, search: term });
  };

  const handleStatusChange = (eventId: string, newStatus: EventStatus) => {
    updateEvent(eventId, { status: newStatus });
  };

  const handleBulkAction = async () => {
    if (bulkAction.selectedEventIds.length === 0) return;

    try {
      // Implement bulk actions
      console.log('Executing bulk action:', bulkAction);
      setSelectedEvents([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleSelectEvent = (eventId: string, selected: boolean) => {
    setSelectedEvents(prev => 
      selected 
        ? [...prev, eventId]
        : prev.filter(id => id !== eventId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedEvents(selected ? events.map(e => e.id) : []);
  };

  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
      const success = await deleteEvent(eventToDelete.id);
      if (success) {
        setEventToDelete(null);
        setShowDeleteModal(false);
        fetchMetrics(); // Refresh metrics
      }
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    const styles = {
      [EventStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [EventStatus.PUBLISHED]: 'bg-green-100 text-green-800',
      [EventStatus.ONGOING]: 'bg-blue-100 text-blue-800',
      [EventStatus.COMPLETED]: 'bg-gray-100 text-gray-600',
      [EventStatus.CANCELLED]: 'bg-red-100 text-red-800'
    };

    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[status])}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const renderMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{eventMetrics?.totalEvents || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Events</p>
              <p className="text-2xl font-bold text-green-600">{eventMetrics?.activeEvents || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-purple-600">{eventMetrics?.totalRegistrations || 0}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
              <p className="text-2xl font-bold text-orange-600">{eventMetrics?.capacityUtilization || 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Events by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.eventsByType.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.type}</span>
                </div>
                <span className="text-sm text-gray-600">{item.count} events</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capacity Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.capacityUtilization.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.event}</span>
                  <span>{item.utilization}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      'h-2 rounded-full',
                      item.utilization >= 90 ? 'bg-green-500' :
                      item.utilization >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${item.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBulkActions = () => (
    <div className="mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedEvents.length === events.length && events.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">
                  {selectedEvents.length} of {events.length} events selected
                </span>
              </div>
              
              {selectedEvents.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Select
                    value={bulkAction.action}
                    onChange={(value) => setBulkAction(prev => ({ ...prev, action: value as any }))}
                  >
                    <option value="publish">Publish</option>
                    <option value="unpublish">Unpublish</option>
                    <option value="cancel">Cancel</option>
                    <option value="delete">Delete</option>
                  </Select>
                  
                  <Checkbox
                    checked={bulkAction.notifyAttendees}
                    onChange={(checked) => setBulkAction(prev => ({ ...prev, notifyAttendees: checked }))}
                  />
                  <span className="text-sm text-gray-600">Notify attendees</span>
                  
                  <Button
                    onClick={handleBulkAction}
                    variant="danger"
                    size="sm"
                  >
                    Execute
                  </Button>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showBulkActions ? 'Hide' : 'Show'} Bulk Actions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEventsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Event Management</CardTitle>
        <div className="flex items-center space-x-3">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={onEventCreate}>
            Create Event
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowMetrics(!showMetrics)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {showMetrics && (
          <div className="mb-6">
            {renderMetrics()}
            {renderAnalytics()}
          </div>
        )}

        {renderBulkActions()}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedEvents.length === events.length && events.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={(e) => handleSelectEvent(event.id, e.target.checked)}
                      className="rounded"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500">{event.location}</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="capitalize text-sm">{event.type}</span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {new Date(event.startDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {event.registeredCount}
                      {event.capacity && (
                        <span className="text-gray-500"> / {event.capacity}</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={event.status}
                      onChange={(value) => handleStatusChange(event.id, value as EventStatus)}
                    >
                      {Object.values(EventStatus).map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEventSelect && onEventSelect(event)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEventForEdit(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first event.
            </p>
            <Button onClick={onEventCreate}>
              Create Event
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={cn('w-full', className)}>
      {renderEventsTable()}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Event"
          size="md"
        >
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
              <Button variant="danger" onClick={confirmDelete}>
                Delete Event
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EventManagement;