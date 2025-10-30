/**
 * Event API Service Tests
 * 
 * This file contains test cases for the Event API service.
 * Run tests with: npm test eventApi.test.ts
 */

import api from '../../services/api';
import {
  Event,
  EventRegistration,
  EventFilter,
  EventType,
  EventStatus,
  RegistrationStatus,
  MembershipTier
} from '@issb/types';
import eventApi, {
  fetchEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  checkEventCapacity,
  subscribeToEventUpdates,
  validateEventData,
  canUserRegister
} from './eventApi';

// Mock the API service
jest.mock('../../services/api');

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

describe('Event API Service', () => {
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event CRUD Operations', () => {
    const mockEvent: Event = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Event',
      description: 'This is a test event',
      type: EventType.CONFERENCE,
      tier: MembershipTier.REGULAR,
      status: EventStatus.PUBLISHED,
      startDate: new Date('2025-06-15T09:00:00Z'),
      endDate: new Date('2025-06-15T17:00:00Z'),
      location: 'Test Location',
      isVirtual: false,
      capacity: 100,
      registeredCount: 50,
      registrationDeadline: new Date('2025-06-01T23:59:59Z'),
      organizerId: '456e7890-e89b-12d3-a456-426614174001',
      tags: ['test', 'conference'],
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    describe('fetchEvents', () => {
      it('should fetch events with filters', async () => {
        const mockResponse = {
          success: true,
          data: {
            data: [mockEvent],
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
              hasNext: false,
              hasPrev: false
            }
          }
        };

        (api.get as jest.Mock).mockResolvedValue(mockResponse);

        const result = await fetchEvents({
          status: [EventStatus.PUBLISHED],
          type: [EventType.CONFERENCE]
        });

        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('/events'),
          expect.any(Object)
        );
        expect(result.data).toEqual([mockEvent]);
        expect(result.pagination.total).toBe(1);
      });

      it('should handle API errors gracefully', async () => {
        (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

        await expect(fetchEvents()).rejects.toThrow('Failed to fetch events');
      });

      it('should pass all filter parameters to API', async () => {
        const mockResponse = {
          success: true,
          data: {
            data: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        };

        (api.get as jest.Mock).mockResolvedValue(mockResponse);

        const filters: EventFilter = {
          type: [EventType.CONFERENCE, EventType.WORKSHOP],
          status: [EventStatus.PUBLISHED],
          location: 'New York',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          search: 'test event',
          sortBy: 'startDate',
          sortOrder: 'desc',
          page: 1,
          limit: 10
        };

        await fetchEvents(filters);

        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('/events'),
          expect.any(Object)
        );
      });
    });

    describe('fetchEventById', () => {
      it('should fetch single event by ID', async () => {
        const mockResponse = {
          success: true,
          data: mockEvent
        };

        (api.get as jest.Mock).mockResolvedValue(mockResponse);

        const result = await fetchEventById(mockEvent.id);

        expect(api.get).toHaveBeenCalledWith(`/events/${mockEvent.id}`);
        expect(result).toEqual(mockEvent);
      });

      it('should throw error when event not found', async () => {
        const mockResponse = {
          success: false,
          message: 'Event not found'
        };

        (api.get as jest.Mock).mockResolvedValue(mockResponse);

        await expect(fetchEventById('non-existent-id')).rejects.toThrow(
          'Failed to fetch event'
        );
      });
    });

    describe('createEvent', () => {
      it('should create new event successfully', async () => {
        const eventData = {
          title: 'New Event',
          description: 'New event description',
          type: EventType.CONFERENCE,
          tier: MembershipTier.REGULAR,
          startDate: new Date('2025-07-01T09:00:00Z'),
          endDate: new Date('2025-07-01T17:00:00Z'),
          location: 'New Location',
          isVirtual: false,
          capacity: 200
        };

        const mockResponse = {
          success: true,
          data: { ...mockEvent, ...eventData }
        };

        (api.post as jest.Mock).mockResolvedValue(mockResponse);

        const result = await createEvent(eventData);

        expect(api.post).toHaveBeenCalledWith('/events', eventData);
        expect(result.title).toBe('New Event');
      });

      it('should handle validation errors', async () => {
        const invalidData = {
          title: 'AB', // Too short
          description: 'Short' // Too short
        };

        (api.post as jest.Mock).mockRejectedValue({
          response: {
            data: {
              message: 'Validation failed',
              errors: [
                { field: 'title', message: 'Title too short' },
                { field: 'description', message: 'Description too short' }
              ]
            }
          }
        });

        await expect(createEvent(invalidData)).rejects.toThrow('Validation failed');
      });
    });

    describe('updateEvent', () => {
      it('should update existing event', async () => {
        const updateData = {
          title: 'Updated Event Title',
          capacity: 150
        };

        const mockResponse = {
          success: true,
          data: { ...mockEvent, ...updateData }
        };

        (api.put as jest.Mock).mockResolvedValue(mockResponse);

        const result = await updateEvent(mockEvent.id, updateData);

        expect(api.put).toHaveBeenCalledWith(`/events/${mockEvent.id}`, updateData);
        expect(result.title).toBe('Updated Event Title');
        expect(result.capacity).toBe(150);
      });

      it('should prevent updating protected fields', async () => {
        const invalidUpdate = {
          id: 'different-id',
          registeredCount: 999,
          createdAt: new Date()
        };

        (api.put as jest.Mock).mockRejectedValue(new Error('Cannot update protected fields'));

        await expect(updateEvent(mockEvent.id, invalidUpdate)).rejects.toThrow();
      });
    });

    describe('deleteEvent', () => {
      it('should delete event successfully', async () => {
        const mockResponse = {
          success: true
        };

        (api.delete as jest.Mock).mockResolvedValue(mockResponse);

        const result = await deleteEvent(mockEvent.id);

        expect(api.delete).toHaveBeenCalledWith(`/events/${mockEvent.id}`);
        expect(result).toBe(true);
      });

      it('should prevent deletion of events with registrations', async () => {
        (api.delete as jest.Mock).mockRejectedValue({
          response: {
            data: {
              message: 'Cannot delete event with active registrations'
            }
          }
        });

        await expect(deleteEvent(mockEvent.id)).rejects.toThrow();
      });
    });
  });

  describe('Registration Management', () => {
    const mockRegistration: EventRegistration = {
      id: 'reg-123',
      eventId: 'event-456',
      userId: 'user-789',
      status: RegistrationStatus.REGISTERED,
      registeredAt: new Date(),
      attendance: {
        attended: false
      }
    };

    describe('registerForEvent', () => {
      it('should register user for event', async () => {
        const registrationData = {
          specialRequirements: 'Wheelchair access needed',
          dietaryRestrictions: ['vegetarian']
        };

        const mockResponse = {
          success: true,
          data: mockRegistration
        };

        (api.post as jest.Mock).mockResolvedValue(mockResponse);

        const result = await registerForEvent('event-456', registrationData);

        expect(api.post).toHaveBeenCalledWith(
          '/events/event-456/register',
          registrationData
        );
        expect(result.status).toBe(RegistrationStatus.REGISTERED);
      });

      it('should handle capacity constraints', async () => {
        (api.post as jest.Mock).mockRejectedValue({
          response: {
            data: {
              message: 'Event is at full capacity'
            }
          }
        });

        await expect(registerForEvent('full-event-id')).rejects.toThrow(
          'Event is at full capacity'
        );
      });

      it('should handle tier restrictions', async () => {
        (api.post as jest.Mock).mockRejectedValue({
          response: {
            data: {
              message: 'Your membership tier does not allow registration'
            }
          }
        });

        await expect(registerForEvent('admin-event-id')).rejects.toThrow(
          'Your membership tier does not allow registration'
        );
      });
    });
  });

  describe('Capacity Management', () => {
    describe('checkEventCapacity', () => {
      it('should check event capacity correctly', async () => {
        const capacityData = {
          hasCapacity: true,
          availableSpots: 25,
          totalCapacity: 100,
          currentRegistrations: 75
        };

        const mockResponse = {
          success: true,
          data: capacityData
        };

        (api.get as jest.Mock).mockResolvedValue(mockResponse);

        const result = await checkEventCapacity('event-123');

        expect(api.get).toHaveBeenCalledWith('/events/event-123/capacity');
        expect(result.hasCapacity).toBe(true);
        expect(result.availableSpots).toBe(25);
      });

      it('should return correct data when event is full', async () => {
        const fullEventData = {
          hasCapacity: false,
          availableSpots: 0,
          totalCapacity: 50,
          currentRegistrations: 50
        };

        const mockResponse = {
          success: true,
          data: fullEventData
        };

        (api.get as jest.Mock).mockResolvedValue(mockResponse);

        const result = await checkEventCapacity('full-event-id');

        expect(result.hasCapacity).toBe(false);
        expect(result.availableSpots).toBe(0);
      });
    });
  });

  describe('Real-time Updates', () => {
    describe('subscribeToEventUpdates', () => {
      it('should establish WebSocket connection', () => {
        const mockWs = {
          close: jest.fn(),
          send: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          onmessage: null,
          onerror: null
        };

        (WebSocket as jest.Mock).mockImplementation(() => mockWs);

        const callbacks = {
          onRegistrationUpdate: jest.fn(),
          onCapacityUpdate: jest.fn(),
          onEventUpdate: jest.fn()
        };

        const unsubscribe = subscribeToEventUpdates('event-123', callbacks);

        expect(WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('/events/event-123/updates')
        );

        // Simulate a message
        const mockMessage = {
          data: JSON.stringify({
            type: 'registration_update',
            payload: { id: 'reg-123', status: 'registered' }
          })
        };

        // Trigger message handler
        const messageHandler = (mockWs.addEventListener as jest.Mock).mock.calls.find(
          call => call[0] === 'message'
        )[1];
        messageHandler(mockMessage);

        expect(callbacks.onRegistrationUpdate).toHaveBeenCalledWith({
          id: 'reg-123',
          status: 'registered'
        });

        // Cleanup
        unsubscribe();
        expect(mockWs.close).toHaveBeenCalled();
      });

      it('should handle WebSocket errors', () => {
        const mockWs = {
          close: jest.fn(),
          addEventListener: jest.fn(),
          onerror: null
        };

        (WebSocket as jest.Mock).mockImplementation(() => mockWs);

        const callbacks = {
          onError: jest.fn()
        };

        subscribeToEventUpdates('event-123', callbacks);

        // Simulate error
        const errorHandler = (mockWs.addEventListener as jest.Mock).mock.calls.find(
          call => call[0] === 'error'
        )[1];
        errorHandler(new Error('WebSocket error'));

        // The onerror callback should be triggered by the WebSocket implementation
      });
    });
  });

  describe('Utility Functions', () => {
    describe('validateEventData', () => {
      it('should validate correct event data', () => {
        const validData = {
          title: 'Valid Event Title',
          description: 'This is a valid event description with enough characters',
          startDate: new Date('2025-07-01T09:00:00Z'),
          endDate: new Date('2025-07-01T17:00:00Z'),
          capacity: 100
        };

        const result = validateEventData(validData);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should identify invalid event data', () => {
        const invalidData = {
          title: 'AB', // Too short
          description: 'Short', // Too short
          capacity: 0 // Invalid capacity
        };

        const result = validateEventData(invalidData);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors).toContain(
          expect.stringContaining('Event title must be at least 3 characters')
        );
      });
    });

    describe('canUserRegister', () => {
      const mockEvent: Event = {
        id: 'event-123',
        title: 'Test Event',
        description: 'Test Description',
        type: EventType.CONFERENCE,
        tier: MembershipTier.BOARD,
        status: EventStatus.PUBLISHED,
        startDate: new Date('2025-07-01T09:00:00Z'),
        endDate: new Date('2025-07-01T17:00:00Z'),
        location: 'Test Location',
        isVirtual: false,
        capacity: 100,
        registeredCount: 50,
        organizerId: 'org-123',
        tags: [],
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      it('should allow registration when user meets all requirements', () => {
        const result = canUserRegister(mockEvent, 'board', 50);

        expect(result.canRegister).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should prevent registration for wrong membership tier', () => {
        const result = canUserRegister(mockEvent, 'regular', 50);

        expect(result.canRegister).toBe(false);
        expect(result.reason).toContain('membership tier does not allow');
      });

      it('should warn when capacity is low', () => {
        const result = canUserRegister(mockEvent, 'board', 97);

        expect(result.canRegister).toBe(true);
        expect(result.warnings).toContain(
          expect.stringContaining('spots remaining')
        );
      });

      it('should prevent registration when event is full', () => {
        const result = canUserRegister(mockEvent, 'board', 100);

        expect(result.canRegister).toBe(false);
        expect(result.reason).toContain('Event is full');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(fetchEvents()).rejects.toThrow();
    });

    it('should handle server errors with proper messages', async () => {
      (api.get as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: 'Internal server error'
          }
        }
      });

      await expect(fetchEvents()).rejects.toThrow('Internal server error');
    });

    it('should handle timeout errors', async () => {
      (api.get as jest.Mock).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Request timeout'
      });

      await expect(fetchEvents()).rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      const mockEvents = Array.from({ length: 1000 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        description: `Description for event ${i}`,
        type: EventType.CONFERENCE,
        tier: MembershipTier.REGULAR,
        status: EventStatus.PUBLISHED,
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test Location',
        isVirtual: false,
        capacity: 100,
        registeredCount: 0,
        organizerId: 'org-123',
        tags: [],
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const mockResponse = {
        success: true,
        data: {
          data: mockEvents,
          pagination: {
            page: 1,
            limit: 1000,
            total: 1000,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const result = await fetchEvents({ limit: 1000 });
      const endTime = performance.now();

      expect(result.data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Event API Integration Tests', () => {
  it('should complete full event lifecycle', async () => {
    // Create event
    const eventData = {
      title: 'Integration Test Event',
      description: 'Testing full event lifecycle',
      type: EventType.WORKSHOP,
      tier: MembershipTier.REGULAR,
      startDate: new Date('2025-08-01T09:00:00Z'),
      endDate: new Date('2025-08-01T17:00:00Z'),
      location: 'Integration Test Location',
      isVirtual: false,
      capacity: 50
    };

    const createMockResponse = {
      success: true,
      data: { id: 'new-event-id', ...eventData, registeredCount: 0 }
    };

    (api.post as jest.Mock).mockResolvedValue(createMockResponse);

    const newEvent = await createEvent(eventData);
    expect(newEvent.id).toBe('new-event-id');

    // Update event
    const updateMockResponse = {
      success: true,
      data: { ...newEvent, title: 'Updated Integration Test Event' }
    };

    (api.put as jest.Mock).mockResolvedValue(updateMockResponse);

    const updatedEvent = await updateEvent('new-event-id', {
      title: 'Updated Integration Test Event'
    });
    expect(updatedEvent.title).toBe('Updated Integration Test Event');

    // Register for event
    const registrationMockResponse = {
      success: true,
      data: {
        id: 'reg-id',
        eventId: 'new-event-id',
        userId: 'user-id',
        status: RegistrationStatus.REGISTERED,
        registeredAt: new Date()
      }
    };

    (api.post as jest.Mock).mockResolvedValue(registrationMockResponse);

    const registration = await registerForEvent('new-event-id');
    expect(registration.status).toBe(RegistrationStatus.REGISTERED);

    // Check capacity
    const capacityMockResponse = {
      success: true,
      data: {
        hasCapacity: true,
        availableSpots: 49,
        totalCapacity: 50,
        currentRegistrations: 1
      }
    };

    (api.get as jest.Mock).mockResolvedValue(capacityMockResponse);

    const capacity = await checkEventCapacity('new-event-id');
    expect(capacity.availableSpots).toBe(49);

    // Delete event
    const deleteMockResponse = {
      success: true
    };

    (api.delete as jest.Mock).mockResolvedValue(deleteMockResponse);

    const deleted = await deleteEvent('new-event-id');
    expect(deleted).toBe(true);
  });
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Helper function to create mock event
 */
export const createMockEvent = (overrides: Partial<Event> = {}): Event => {
  const defaultEvent: Event = {
    id: 'mock-event-id',
    title: 'Mock Event',
    description: 'Mock event description',
    type: EventType.CONFERENCE,
    tier: MembershipTier.REGULAR,
    status: EventStatus.PUBLISHED,
    startDate: new Date('2025-07-01T09:00:00Z'),
    endDate: new Date('2025-07-01T17:00:00Z'),
    location: 'Mock Location',
    isVirtual: false,
    capacity: 100,
    registeredCount: 0,
    organizerId: 'mock-organizer-id',
    tags: ['mock', 'test'],
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return { ...defaultEvent, ...overrides };
};

/**
 * Helper function to create mock registration
 */
export const createMockRegistration = (overrides: Partial<EventRegistration> = {}): EventRegistration => {
  const defaultRegistration: EventRegistration = {
    id: 'mock-registration-id',
    eventId: 'mock-event-id',
    userId: 'mock-user-id',
    status: RegistrationStatus.REGISTERED,
    registeredAt: new Date(),
    attendance: {
      attended: false
    }
  };

  return { ...defaultRegistration, ...overrides };
};

/**
 * Helper function to setup mock API response
 */
export const setupMockApiResponse = <T>(data: T, success: boolean = true) => {
  return {
    success,
    data,
    message: success ? 'Success' : 'Error occurred'
  };
};
