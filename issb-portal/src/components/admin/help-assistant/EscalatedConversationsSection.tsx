/**
 * Escalated Conversations Section
 * View and manage escalated support conversations
 */

import React, { useState } from 'react';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConversationTable } from '@/components/admin/help-assistant/ConversationTable';
import { ConversationDetailModal } from '@/components/admin/help-assistant/ConversationDetailModal';
import { useEscalatedConversations } from '@/hooks/useHelpAssistant';
import { extractErrorMessage } from '@/lib/error-mapping';
import type { EscalatedConversation, ConversationStatus } from '@/types';

export function EscalatedConversationsSection() {
  const [selectedStatus, setSelectedStatus] = useState<ConversationStatus | 'all'>('all');
  const [selectedConversation, setSelectedConversation] = useState<EscalatedConversation | null>(null);

  // Fetch data
  const { data, isLoading, error, refetch } = useEscalatedConversations({
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const handleViewDetails = (conversation: EscalatedConversation) => {
    setSelectedConversation(conversation);
  };

  const handleCloseModal = () => {
    setSelectedConversation(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    refetch();
  };

  if (error) {
    return (
      <div
        role="alert"
        aria-live="polite"
        id="conversations-panel"
        className="text-center py-12"
      >
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Conversations
        </h2>
        <p className="text-gray-600 mb-4">{extractErrorMessage(error)}</p>
        <Button
          onClick={() => refetch()}
          className="bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div
      id="conversations-panel"
      role="tabpanel"
      aria-labelledby="conversations-tab"
      className="space-y-6"
    >
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Escalated Conversations</h2>
          <p className="text-sm text-gray-600 mt-1">
            {data?.total || 0} conversation{(data?.total || 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-2 block">
              Filter by Status
            </label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ConversationStatus | 'all')}>
              <SelectTrigger id="status-filter" aria-label="Filter by status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Conversation Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="sr-only">Loading conversations...</span>
        </div>
      ) : (
        <ConversationTable
          conversations={data?.conversations || []}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Detail Modal */}
      {selectedConversation && (
        <ConversationDetailModal
          isOpen={!!selectedConversation}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          conversation={selectedConversation}
        />
      )}
    </div>
  );
}
