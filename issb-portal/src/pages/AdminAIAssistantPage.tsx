/**
 * Admin AI Assistant Page
 * New AI-powered help assistant management with knowledge base and escalations
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AIAssistantAdminPage } from '@/components/admin/ai-chat/AIAssistantAdminPage';

export function AdminAIAssistantPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Check authorization
  React.useEffect(() => {
    if (!profile || !['admin', 'board'].includes(profile.role)) {
      navigate('/');
    }
  }, [profile, navigate]);

  if (!profile || !['admin', 'board'].includes(profile.role)) {
    return null;
  }

  return <AIAssistantAdminPage />;
}
