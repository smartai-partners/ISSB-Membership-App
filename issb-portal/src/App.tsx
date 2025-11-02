import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthBridge } from '@/components/AuthBridge';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { EventsPage } from '@/pages/EventsPage';
import { VolunteersPage } from '@/pages/VolunteersPage';
import { DonationsPage } from '@/pages/DonationsPage';
import { MemberDashboardPage } from '@/pages/MemberDashboardPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { UsersManagementPage } from '@/pages/UsersManagementPage';
import { EnhancedUsersManagementPage } from '@/pages/EnhancedUsersManagementPage';
import { MembershipsManagementPage } from '@/pages/MembershipsManagementPage';
import { EventsManagementPage } from '@/pages/EventsManagementPage';
import { AdminVolunteerManagement } from '@/pages/AdminVolunteerManagementPage';
import { AdminHelpAssistantPage } from '@/pages/AdminHelpAssistantPage';
import EnhancedAdminAccessibilityAuditPage from '@/pages/EnhancedAdminAccessibilityAuditPage';
import { AccessibilityAnalyticsPage } from '@/pages/AccessibilityAnalyticsPage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <AuthBridge />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MemberDashboardPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/volunteers"
              element={
                <ProtectedRoute>
                  <VolunteersPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <ApplicationsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <EnhancedUsersManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/memberships"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <MembershipsManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <EventsManagementPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/volunteers"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <AdminVolunteerManagement />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/help-assistant"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <AdminHelpAssistantPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/accessibility-audit"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <EnhancedAdminAccessibilityAuditPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/accessibility-analytics"
              element={
                <ProtectedRoute roles={['admin', 'board']}>
                  <AccessibilityAnalyticsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
