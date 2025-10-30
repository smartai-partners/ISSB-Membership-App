import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { EventsPage } from '@/pages/EventsPage';
import { VolunteersPage } from '@/pages/VolunteersPage';
import { DonationsPage } from '@/pages/DonationsPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { UsersManagementPage } from '@/pages/UsersManagementPage';
import { MembershipsManagementPage } from '@/pages/MembershipsManagementPage';
import { EventsManagementPage } from '@/pages/EventsManagementPage';

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
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            
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
                  <UsersManagementPage />
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
