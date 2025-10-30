import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Layout Components
import MemberLayout from '@/layouts/MemberLayout';

// Page Components
import EventList from '@/features/events/EventList';
import EventDetails from '@/features/events/EventDetails';
import EventRegistration from '@/features/events/EventRegistration';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Protected Route Component with Event-specific Access
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedTiers?: string[];
  requiresActiveMembership?: boolean;
  eventId?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  allowedTiers = [],
  requiresActiveMembership = false,
  eventId
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { hasRole, hasTier } = usePermissionStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (user && allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return <UnauthorizedPage />;
  }

  // Check tier-based access
  if (user && allowedTiers.length > 0 && !hasTier(user, allowedTiers)) {
    return <UnauthorizedPage />;
  }

  // Check active membership requirement
  if (requiresActiveMembership && user?.status !== 'active') {
    return (
      <UnauthorizedPage 
        message="Active membership required to access this feature. Please renew your membership." 
      />
    );
  }

  return <>{children}</>;
};

// Event Registration Status Guard
const EventRegistrationGuard: React.FC<{ 
  children: React.ReactNode; 
  eventId?: string;
  requireRegistration?: boolean;
}> = ({ children, eventId, requireRegistration = false }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Suspended users cannot register for events
  if (user.status === 'suspended') {
    return (
      <UnauthorizedPage 
        message="Your account is suspended. You cannot register for events at this time." 
      />
    );
  }

  // Check specific event registration requirements if eventId is provided
  if (eventId && requireRegistration) {
    // This would typically check if user is registered for the specific event
    // For now, we'll return children as the actual validation would happen in the component
  }

  return <>{children}</>;
};

// Event Capacity Guard - Check if event has available spots
const EventCapacityGuard: React.FC<{ children: React.ReactNode; eventId: string }> = ({ 
  children, 
  eventId 
}) => {
  // This would typically check event capacity and current registration count
  // For now, we'll allow the component to handle this check
  return <>{children}</>;
};

// Event Date Guard - Check if event registration is still open
const EventDateGuard: React.FC<{ children: React.ReactNode; eventId: string }> = ({ 
  children, 
  eventId 
}) => {
  // This would check registration deadline and event date
  // For now, we'll allow the component to handle this check
  return <>{children}</>;
};

const EventRegistrationRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Event List - View all available events */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <EventList viewMode="member-list" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Upcoming Events - Show only upcoming events */}
      <Route
        path="/upcoming"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <EventList viewMode="upcoming" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* My Registered Events - Events user has registered for */}
      <Route
        path="/my-events"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberLayout>
              <EventList viewMode="my-events" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Event Details - View specific event details */}
      <Route
        path="/:eventId"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <EventDetails viewMode="member-view" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Event Registration - Register for specific event */}
      <Route
        path="/:eventId/register"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <EventRegistrationGuard>
              <EventDateGuard eventId="">
                <EventCapacityGuard eventId="">
                  <MemberLayout>
                    <EventRegistration viewMode="register" />
                  </MemberLayout>
                </EventCapacityGuard>
              </EventDateGuard>
            </EventRegistrationGuard>
          </ProtectedRoute>
        }
      />

      {/* Event Registration Form - Detailed registration form */}
      <Route
        path="/:eventId/register/form"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <EventRegistrationGuard requireRegistration={true}>
              <MemberLayout>
                <EventRegistration viewMode="registration-form" />
              </MemberLayout>
            </EventRegistrationGuard>
          </ProtectedRoute>
        }
      />

      {/* Registration Confirmation - View registration confirmation */}
      <Route
        path="/:eventId/confirmation"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <EventRegistrationGuard requireRegistration={true}>
              <MemberLayout>
                <EventRegistration viewMode="confirmation" />
              </MemberLayout>
            </EventRegistrationGuard>
          </ProtectedRoute>
        }
      />

      {/* Unregister from Event - Cancel event registration */}
      <Route
        path="/:eventId/unregister"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <EventRegistrationGuard requireRegistration={true}>
              <MemberLayout>
                <EventRegistration viewMode="unregister" />
              </MemberLayout>
            </EventRegistrationGuard>
          </ProtectedRoute>
        }
      />

      {/* Event Calendar - View events in calendar format */}
      <Route
        path="/calendar"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <EventList viewMode="calendar" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Event Categories - Filter events by category */}
      <Route
        path="/category/:category"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <EventList viewMode="category-filter" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Event Search - Search for specific events */}
      <Route
        path="/search"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <EventList viewMode="search" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Event History - View past events and registration history */}
      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <EventList viewMode="history" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Event Feedback - Provide feedback for attended events */}
      <Route
        path="/:eventId/feedback"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <EventRegistrationGuard requireRegistration={true}>
              <MemberLayout>
                <EventRegistration viewMode="feedback" />
              </MemberLayout>
            </EventRegistrationGuard>
          </ProtectedRoute>
        }
      />

      {/* Board: Event Management - Board can manage events */}
      <Route
        path="/board/manage"
        element={
          <ProtectedRoute allowedRoles={['board', 'admin']}>
            <MemberLayout>
              <EventList viewMode="board-management" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin: All Events - Admin can view and manage all events */}
      <Route
        path="/admin/all"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MemberLayout>
              <EventList viewMode="admin-all" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin: Event Analytics - Admin can view event analytics */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MemberLayout>
              <EventList viewMode="admin-analytics" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Event Waitlist - Join waitlist for full events */}
      <Route
        path="/:eventId/waitlist"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberLayout>
              <EventRegistration viewMode="waitlist" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default EventRegistrationRoutes;