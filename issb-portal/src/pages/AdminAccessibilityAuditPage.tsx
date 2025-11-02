/**
 * Admin Accessibility Audit Page - Phase 3C.1
 * Main container for accessibility audit monitoring and WCAG compliance tracking
 * Follows Phase 3B patterns and accessibility standards
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toastError } from '@/lib/toast-service';
import { AuditDashboard } from '@/components/admin/accessibility-audit/AuditDashboard';
import { AuditResultsSection } from '@/components/admin/accessibility-audit/AuditResultsSection';

export function AdminAccessibilityAuditPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Check authorization
  React.useEffect(() => {
    if (!profile || !['admin', 'board'].includes(profile.role)) {
      toastError.permissionDenied();
      navigate('/');
    }
  }, [profile, navigate]);

  if (!profile || !['admin', 'board'].includes(profile.role)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accessibility Audit</h1>
        <p className="text-gray-600 mt-2">
          Monitor WCAG compliance and track accessibility issues across the portal
        </p>
      </div>

      {/* Dashboard Summary */}
      <AuditDashboard />

      {/* Audit Results Section */}
      <AuditResultsSection />
    </div>
  );
}
