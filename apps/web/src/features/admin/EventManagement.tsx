import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { Event, EventStatus, EventType, MembershipTier, RegistrationStatus } from '@issb/types';
import Card, { CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Table, { TableColumn } from '../../components/ui/Table';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  Video,
  Map,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Copy,
  Share
} from 'lucide-react';

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  tier: MembershipTier;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  capacity?: number;
  registrationDeadline?: string;
  tags: string[];
  organizerId: string;
}

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalAttendees: number;
  averageAttendance: number;
}

const EventManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const permissions = usePermissionStore();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalAttendees: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: '',
    description: '',
    type: EventType.WORKSHOP,
    tier: MembershipTier.REGULAR,
    status: EventStatus.DRAFT,
    startDate: '',
    endDate: '',
    location: '',
    isVirtual: false,
    virtualLink: '',
    capacity: undefined,
    registrationDeadline: '',
    tags: [],
    organizerId: currentUser?.id || ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Winter Workshop 2024',
          description: 'Annual winter workshop focusing on advanced techniques and networking.',
          type: EventType.WORKSHOP,
          tier: MembershipTier.REGULAR,
          status: EventStatus.PUBLISHED,
          startDate: new Date('2024-02-15'),
          endDate: new Date('2024-02-16'),
          location: 'Community Center, Main Street',
          isVirtual: false,
          capacity: 50,
          registeredCount: 35,
          registrationDeadline: new Date('2024-02-10'),
          organizerId: 'admin-1',
          tags: ['workshop', 'networking', 'education'],
          attachments: [],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20')
        },
        {
          id: '2',
          title: 'Board Meeting Q1 2024',
          description: 'Quarterly board meeting to discuss strategic initiatives.',
          type: EventType.MEETING,
          tier: MembershipTier.BOARD,
          status: EventStatus.PUBLISHED,
          startDate: new Date('2024-01-20'),
          endDate: new Date('2024-01-20'),
          location: 'Conference Room A',
          isVirtual: false,
          capacity: 15,
          registeredCount: 12,
          registrationDeadline: new Date('2024-01-18'),
          organizerId: 'admin-1',
          tags: ['meeting', 'board', 'quarterly'],
          attachments: [],
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-12')
        },
        {
          id: '3',
          title: 'Virtual Training Session: Advanced Skills',
          description: 'Online training session covering advanced topics and best practices.',
          type: EventType.TRAINING,
          tier: MembershipTier.REGULAR,
          status: EventStatus.ONGOING,
          startDate: new Date('2024-01-25'),
          endDate: new Date('2024-01-25'),
          location: 'Online',
          isVirtual: true,
          virtualLink: 'https://zoom.us/j/123456789',
          capacity: 100,
          registeredCount: 67,
          organizerId: 'admin-2',
          tags: ['training', 'virtual', 'skills'],
          attachments: [],
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-25')
        },
        {
          id: '4',
          title: 'Annual Conference 2024',
          description: 'Our biggest annual event featuring keynote speakers and networking.',
          type: EventType.CONFERENCE,
          tier: MembershipTier.REGULAR,
          status: EventStatus.DRAFT,
          startDate: new Date('2024-06-15'),
          endDate: new Date('2024-06-17'),
          location: 'Grand Convention Center',
          isVirtual: false,
          capacity: 500,
          registeredCount: 0,
          organizerId: 'admin-1',
          tags: ['conference', 'annual', 'networking'],
          attachments: [],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-08')
        }
      ];
      
      setEvents(mockEvents);
      
      // Calculate stats
      const now = new Date();
      const totalEvents = mockEvents.length;
      const activeEvents = mockEvents.filter(e => e.status === EventStatus.PUBLISHED).length;
      const upcomingEvents = mockEvents.filter(e => new Date(e.startDate) > now && e.status !== EventStatus.CANCELLED).length;
      const completedEvents = mockEvents.filter(e => e.status === EventStatus.COMPLETED).length;
      const totalAttendees = mockEvents.reduce((sum, e) => sum + e.registeredCount, 0);
      const averageAttendance = totalEvents > 0 ? Math.round(totalAttendees / totalEvents) : 0;
      
      setStats({
        totalEvents,
        activeEvents,
        upcomingEvents,
        completedEvents,
        totalAttendees,
        averageAttendance
      });
      
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];
    
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredEvents(filtered);
  };

  const handleCreateEvent = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newEvent: Event = {
        id: String(events.length + 1),
        ...eventForm,
        startDate: new Date(eventForm.startDate),
        endDate: new Date(eventForm.endDate),
        registrationDeadline: eventForm.registrationDeadline ? new Date(eventForm.registrationDeadline) : undefined,
        registeredCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setEvents([...events, newEvent]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleEditEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedEvents = events.map(event =>
        event.id === selectedEvent.id 
          ? { 
              ...event, 
              ...eventForm,
              startDate: new Date(eventForm.startDate),
              endDate: new Date(eventForm.endDate),
              registrationDeadline: eventForm.registrationDeadline ? new Date(eventForm.registrationDeadline) : undefined,
              updatedAt: new Date() 
            }
          : event
      );
      
      setEvents(updatedEvents);
      setShowEditModal(false);
      setSelectedEvent(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedEvents = events.filter(event => event.id !== selectedEvent.id);
      setEvents(updatedEvents);
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedEvents.length === 0) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let updatedEvents = [...events];
      
      selectedEvents.forEach(eventId => {
        const eventIndex = updatedEvents.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
          switch (action) {
            case 'publish':
              updatedEvents[eventIndex] = { ...updatedEvents[eventIndex], status: EventStatus.PUBLISHED };
              break;
            case 'cancel':
              updatedEvents[eventIndex] = { ...updatedEvents[eventIndex], status: EventStatus.CANCELLED };
              break;
            case 'delete':
              updatedEvents = updatedEvents.filter(e => e.id !== eventId);
              break;
          }
        }
      });
      
      setEvents(updatedEvents);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      type: EventType.WORKSHOP,
      tier: MembershipTier.REGULAR,
      status: EventStatus.DRAFT,
      startDate: '',
      endDate: '',
      location: '',
      isVirtual: false,
      virtualLink: '',
      capacity: undefined,
      registrationDeadline: '',
      tags: [],
      organizerId: currentUser?.id || ''
    });
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      type: event.type,
      tier: event.tier,
      status: event.status,
      startDate: event.startDate.toISOString().split('T')[0],
      endDate: event.endDate.toISOString().split('T')[0],
      location: event.location,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink || '',
      capacity: event.capacity,
      registrationDeadline: event.registrationDeadline?.toISOString().split('T')[0] || '',
      tags: event.tags,
      organizerId: event.organizerId
    });
    setShowEditModal(true);
  };

  const openViewModal = (event: Event) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  const openDeleteModal = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status: EventStatus) => {
    const styles = {
      [EventStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [EventStatus.PUBLISHED]: 'bg-blue-100 text-blue-800',
      [EventStatus.ONGOING]: 'bg-green-100 text-green-800',
      [EventStatus.COMPLETED]: 'bg-purple-100 text-purple-800',
      [EventStatus.CANCELLED]: 'bg-red-100 text-red-800'
    };

    const icons = {
      [EventStatus.DRAFT]: <Edit className="w-3 h-3" />,
      [EventStatus.PUBLISHED]: <CheckCircle className="w-3 h-3" />,
      [EventStatus.ONGOING]: <Clock className="w-3 h-3" />,
      [EventStatus.COMPLETED]: <CheckCircle className="w-3 h-3" />,
      [EventStatus.CANCELLED]: <XCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const getTypeBadge = (type: EventType) => {
    const styles = {
      [EventType.CONFERENCE]: 'bg-purple-100 text-purple-800',
      [EventType.WORKSHOP]: 'bg-blue-100 text-blue-800',
      [EventType.WEBINAR]: 'bg-green-100 text-green-800',
      [EventType.MEETING]: 'bg-orange-100 text-orange-800',
      [EventType.SOCIAL]: 'bg-pink-100 text-pink-800',
      [EventType.TRAINING]: 'bg-indigo-100 text-indigo-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {type}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getAttendancePercentage = (event: Event) => {
    if (!event.capacity || event.capacity === 0) return 0;
    return Math.round((event.registeredCount / event.capacity) * 100);
  };

  const eventColumns: TableColumn<Event>[] = [
    {
      key: 'title',
      title: 'Event',
      render: (_, event) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">{event.title}</div>
          <div className="text-sm text-gray-500">{getTypeBadge(event.type)}</div>
        </div>
      )
    },
    {
      key: 'date',
      title: 'Date & Time',
      render: (_, event) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{formatDate(event.startDate)}</div>
          <div className="text-gray-500">
            {formatDateTime(event.startDate)} - {formatDateTime(event.endDate)}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      title: 'Location',
      render: (_, event) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          {event.isVirtual ? (
            <>
              <Video className="w-3 h-3" />
              <span>Virtual</span>
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-32">{event.location}</span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'attendees',
      title: 'Attendance',
      render: (_, event) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {event.registeredCount}{event.capacity ? `/${event.capacity}` : ''}
          </div>
          {event.capacity && (
            <div className="text-xs text-gray-500">
              {getAttendancePercentage(event)}% full
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: getStatusBadge,
      width: '120px'
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      render: (_, event) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => openViewModal(event)}
          />
          {permissions.canManageEvents(currentUser!) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit className="w-4 h-4" />}
                onClick={() => openEditModal(event)}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => openDeleteModal(event)}
                className="text-red-600 hover:text-red-700"
              />
            </>
          )}
        </div>
      )
    }
  ];

  const hasManagePermission = permissions.canManageEvents(currentUser!);
  const hasWritePermission = permissions.hasPermission(currentUser!, 'event:write');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 mt-1">
            Create, manage, and monitor events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="outline" icon={<Upload className="w-4 h-4" />}>
            Import
          </Button>
          {hasWritePermission && (
            <Button 
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Event
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
              <p className="text-sm text-green-600 mt-1">
                {stats.upcomingEvents} upcoming
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Events</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeEvents}</p>
              <p className="text-sm text-green-600 mt-1">
                Published and ongoing
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attendees</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAttendees}</p>
              <p className="text-sm text-purple-600 mt-1">
                Avg: {stats.averageAttendance} per event
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedEvents}</p>
              <p className="text-sm text-orange-600 mt-1">
                All-time events
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
              Filters
            </Button>
          </div>
          
          {selectedEvents.length > 0 && hasManagePermission && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedEvents.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => handleBulkAction('publish')}
              >
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => handleBulkAction('cancel')}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleBulkAction('delete')}
                className="text-red-600"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            columns={eventColumns}
            data={filteredEvents}
            loading={loading}
            selection={{
              selectedRowKeys: selectedEvents,
              onChange: setSelectedEvents
            }}
            pagination={{
              pageSize: 25,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: true
            }}
          />
        </CardContent>
      </Card>

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Event"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              value={eventForm.title}
              onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              placeholder="Enter event title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
              placeholder="Enter event description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={eventForm.type}
                onChange={(e) => setEventForm({...eventForm, type: e.target.value as EventType})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={EventType.CONFERENCE}>Conference</option>
                <option value={EventType.WORKSHOP}>Workshop</option>
                <option value={EventType.WEBINAR}>Webinar</option>
                <option value={EventType.MEETING}>Meeting</option>
                <option value={EventType.SOCIAL}>Social</option>
                <option value={EventType.TRAINING}>Training</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={eventForm.tier}
                onChange={(e) => setEventForm({...eventForm, tier: e.target.value as MembershipTier})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={MembershipTier.REGULAR}>Regular</option>
                <option value={MembershipTier.BOARD}>Board</option>
                <option value={MembershipTier.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
              <Input
                type="datetime-local"
                value={eventForm.startDate}
                onChange={(e) => setEventForm({...eventForm, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
              <Input
                type="datetime-local"
                value={eventForm.endDate}
                onChange={(e) => setEventForm({...eventForm, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={eventForm.isVirtual}
                onChange={(e) => setEventForm({...eventForm, isVirtual: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Virtual Event</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {eventForm.isVirtual ? 'Virtual Link' : 'Location'}
            </label>
            <Input
              value={eventForm.isVirtual ? eventForm.virtualLink || '' : eventForm.location}
              onChange={(e) => setEventForm({
                ...eventForm, 
                [eventForm.isVirtual ? 'virtualLink' : 'location']: e.target.value
              })}
              placeholder={eventForm.isVirtual ? 'Enter meeting link' : 'Enter location'}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <Input
                type="number"
                value={eventForm.capacity || ''}
                onChange={(e) => setEventForm({...eventForm, capacity: e.target.value ? parseInt(e.target.value) : undefined})}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
              <Input
                type="date"
                value={eventForm.registrationDeadline}
                onChange={(e) => setEventForm({...eventForm, registrationDeadline: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={eventForm.status}
              onChange={(e) => setEventForm({...eventForm, status: e.target.value as EventStatus})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={EventStatus.DRAFT}>Draft</option>
              <option value={EventStatus.PUBLISHED}>Published</option>
            </select>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEvent}>
              Create Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Event Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedEvent(null);
        }}
        title="Event Details"
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Event Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Title:</span>
                    <span className="text-sm font-medium">{selectedEvent.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    {getTypeBadge(selectedEvent.type)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    {getStatusBadge(selectedEvent.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tier:</span>
                    <span className="text-sm font-medium capitalize">{selectedEvent.tier}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Date & Location</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Start:</span>
                    <span className="text-sm font-medium">{formatDateTime(selectedEvent.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">End:</span>
                    <span className="text-sm font-medium">{formatDateTime(selectedEvent.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <div className="flex items-center space-x-1 text-sm">
                      {selectedEvent.isVirtual ? (
                        <>
                          <Video className="w-3 h-3" />
                          <span>Virtual</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span>{selectedEvent.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedEvent.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Description</h4>
                <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Attendance</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedEvent.registeredCount}</div>
                  <div className="text-sm text-gray-600">Registered</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedEvent.capacity || '∞'}
                  </div>
                  <div className="text-sm text-gray-600">Capacity</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {getAttendancePercentage(selectedEvent)}%
                  </div>
                  <div className="text-sm text-gray-600">Full</div>
                </div>
              </div>
            </div>
            
            {selectedEvent.tags && selectedEvent.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
              {hasManagePermission && (
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedEvent);
                  }}
                >
                  Edit Event
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEvent(null);
        }}
        title="Delete Event"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
              <p className="text-gray-600 mt-1">
                This action cannot be undone. This will permanently delete the event
                and remove all associated data from our servers.
              </p>
              {selectedEvent && (
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {selectedEvent.title}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteEvent}
            >
              Delete Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventManagement;