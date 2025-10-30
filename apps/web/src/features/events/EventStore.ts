import { create } from 'zustand';
import { Event, EventRegistration, EventFilter, PaginatedResponse, CreateInput, UpdateInput } from '@issb/types';
import api from '../../services/api';

interface EventState {
  // Events state
  events: Event[];
  currentEvent: Event | null;
  featuredEvents: Event[];
  upcomingEvents: Event[];
  myEvents: Event[];
  
  // Registration state
  userRegistrations: EventRegistration[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  filters: EventFilter;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // Actions
  fetchEvents: (filters?: EventFilter) => Promise<void>;
  fetchFeaturedEvents: () => Promise<void>;
  fetchUpcomingEvents: () => Promise<void>;
  fetchMyEvents: (userId: string) => Promise<void>;
  fetchEventById: (id: string) => Promise<Event | null>;
  createEvent: (eventData: CreateInput<Event>) => Promise<Event | null>;
  updateEvent: (id: string, eventData: UpdateInput<Event>) => Promise<Event | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  
  // Registration actions
  registerForEvent: (eventId: string, registrationData?: any) => Promise<EventRegistration | null>;
  cancelRegistration: (registrationId: string) => Promise<boolean>;
  fetchUserRegistrations: (userId: string) => Promise<void>;
  
  // Filter actions
  setFilters: (filters: Partial<EventFilter>) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  
  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultFilters: EventFilter = {
  sortBy: 'startDate',
  sortOrder: 'asc'
};

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
};

export const useEventStore = create<EventState>((set, get) => ({
  // Initial state
  events: [],
  currentEvent: null,
  featuredEvents: [],
  upcomingEvents: [],
  myEvents: [],
  userRegistrations: [],
  isLoading: false,
  error: null,
  filters: defaultFilters,
  pagination: defaultPagination,

  // Event fetching actions
  fetchEvents: async (filters = {}) => {
    try {
      set({ isLoading: true, error: null });
      
      const currentFilters = { ...get().filters, ...filters };
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.set(key, value.toString());
          }
        }
      });
      
      // Add pagination
      params.set('page', get().pagination.page.toString());
      params.set('limit', get().pagination.limit.toString());
      
      const response = await api.get<PaginatedResponse<Event>>(`/events?${params}`);
      
      if (response.success) {
        set({
          events: response.data.data,
          pagination: {
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages
          },
          isLoading: false
        });
      } else {
        throw new Error(response.message || 'Failed to fetch events');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch events',
        isLoading: false
      });
    }
  },

  fetchFeaturedEvents: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.get<{ data: Event[] }>('/events/featured');
      
      if (response.success) {
        set({
          featuredEvents: response.data,
          isLoading: false
        });
      } else {
        throw new Error(response.message || 'Failed to fetch featured events');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch featured events',
        isLoading: false
      });
    }
  },

  fetchUpcomingEvents: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.get<{ data: Event[] }>('/events/upcoming');
      
      if (response.success) {
        set({
          upcomingEvents: response.data,
          isLoading: false
        });
      } else {
        throw new Error(response.message || 'Failed to fetch upcoming events');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch upcoming events',
        isLoading: false
      });
    }
  },

  fetchMyEvents: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.get<{ data: Event[] }>(`/events/my-events/${userId}`);
      
      if (response.success) {
        set({
          myEvents: response.data,
          isLoading: false
        });
      } else {
        throw new Error(response.message || 'Failed to fetch my events');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch my events',
        isLoading: false
      });
    }
  },

  fetchEventById: async (id: string): Promise<Event | null> => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.get<{ data: Event }>(`/events/${id}`);
      
      if (response.success) {
        set({
          currentEvent: response.data,
          isLoading: false
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch event');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch event',
        isLoading: false
      });
      return null;
    }
  },

  createEvent: async (eventData: CreateInput<Event>): Promise<Event | null> => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post<{ data: Event }>('/events', eventData);
      
      if (response.success) {
        const newEvent = response.data;
        set(state => ({
          events: [newEvent, ...state.events],
          isLoading: false
        }));
        return newEvent;
      } else {
        throw new Error(response.message || 'Failed to create event');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create event',
        isLoading: false
      });
      return null;
    }
  },

  updateEvent: async (id: string, eventData: UpdateInput<Event>): Promise<Event | null> => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.put<{ data: Event }>(`/events/${id}`, eventData);
      
      if (response.success) {
        const updatedEvent = response.data;
        set(state => ({
          events: state.events.map(event => 
            event.id === id ? updatedEvent : event
          ),
          currentEvent: state.currentEvent?.id === id ? updatedEvent : state.currentEvent,
          isLoading: false
        }));
        return updatedEvent;
      } else {
        throw new Error(response.message || 'Failed to update event');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update event',
        isLoading: false
      });
      return null;
    }
  },

  deleteEvent: async (id: string): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.delete(`/events/${id}`);
      
      if (response.success) {
        set(state => ({
          events: state.events.filter(event => event.id !== id),
          currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
          isLoading: false
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete event');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete event',
        isLoading: false
      });
      return false;
    }
  },

  // Registration actions
  registerForEvent: async (eventId: string, registrationData = {}): Promise<EventRegistration | null> => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.post<{ data: EventRegistration }>(`/events/${eventId}/register`, registrationData);
      
      if (response.success) {
        const registration = response.data;
        set(state => ({
          userRegistrations: [...state.userRegistrations, registration],
          isLoading: false
        }));
        return registration;
      } else {
        throw new Error(response.message || 'Failed to register for event');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to register for event',
        isLoading: false
      });
      return null;
    }
  },

  cancelRegistration: async (registrationId: string): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.delete(`/registrations/${registrationId}`);
      
      if (response.success) {
        set(state => ({
          userRegistrations: state.userRegistrations.filter(reg => reg.id !== registrationId),
          isLoading: false
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to cancel registration');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to cancel registration',
        isLoading: false
      });
      return false;
    }
  },

  fetchUserRegistrations: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await api.get<{ data: EventRegistration[] }>(`/registrations/user/${userId}`);
      
      if (response.success) {
        set({
          userRegistrations: response.data,
          isLoading: false
        });
      } else {
        throw new Error(response.message || 'Failed to fetch user registrations');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch user registrations',
        isLoading: false
      });
    }
  },

  // Filter actions
  setFilters: (filters: Partial<EventFilter>) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  clearFilters: () => {
    set({ filters: defaultFilters });
  },

  setPage: (page: number) => {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
}));