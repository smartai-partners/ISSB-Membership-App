/**
 * Conversation Table Component
 * Displays escalated conversations with view details action
 */

import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EscalatedConversation, ConversationStatus } from '@/types';

interface ConversationTableProps {
  conversations: EscalatedConversation[];
  onViewDetails: (conversation: EscalatedConversation) => void;
}

const statusColors: Record<ConversationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels: Record<ConversationStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function ConversationTable({ conversations, onViewDetails }: ConversationTableProps) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">
          No escalated conversations found. Conversations will appear here when users need
          additional support.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">User Email</TableHead>
            <TableHead className="w-1/4">Reason</TableHead>
            <TableHead className="w-1/6">Status</TableHead>
            <TableHead className="w-1/6">Messages</TableHead>
            <TableHead className="w-1/6">Escalated</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conversation) => {
            const messageCount = conversation.conversation_data?.messages?.length || 0;
            const userEmail =
              conversation.conversation_data?.user_email || 'Unknown User';

            return (
              <TableRow key={conversation.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="max-w-xs truncate" title={userEmail}>
                    {userEmail}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="max-w-xs truncate text-gray-600"
                    title={conversation.escalated_reason || 'No reason provided'}
                  >
                    {conversation.escalated_reason || 'No reason provided'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${statusColors[conversation.status]} border`}
                    variant="secondary"
                  >
                    {statusLabels[conversation.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(conversation.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewDetails(conversation)}
                    aria-label={`View details for conversation with ${userEmail}`}
                    className="hover:bg-gray-100 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
