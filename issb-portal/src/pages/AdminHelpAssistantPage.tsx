/**
 * Admin Help Assistant Page - Phase 3B
 * Main container for FAQ Management and Escalated Conversations
 * Follows Phase 3A UX patterns and accessibility standards
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toastError } from '@/lib/toast-service';
import { AdminHelpAssistantNav } from '@/components/admin/help-assistant/AdminHelpAssistantNav';
import { FAQManagementSection } from '@/components/admin/help-assistant/FAQManagementSection';
import { EscalatedConversationsSection } from '@/components/admin/help-assistant/EscalatedConversationsSection';

type Tab = 'faqs' | 'conversations';

export function AdminHelpAssistantPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('faqs');

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
        <h1 className="text-3xl font-bold text-gray-900">Help Assistant Management</h1>
        <p className="text-gray-600 mt-2">
          Manage FAQ knowledge base and review escalated support conversations
        </p>
      </div>

      {/* Tab Navigation */}
      <AdminHelpAssistantNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content Sections */}
      {activeTab === 'faqs' ? (
        <FAQManagementSection />
      ) : (
        <EscalatedConversationsSection />
      )}
    </div>
  );
}
