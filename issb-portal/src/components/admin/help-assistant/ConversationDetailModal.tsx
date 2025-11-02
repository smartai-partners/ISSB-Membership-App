/**
 * Conversation Detail Modal
 * View conversation transcript and manage status
 */

import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquare, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateConversationStatus, useDeleteConversation } from '@/hooks/useHelpAssistant';
import type { EscalatedConversation, ConversationStatus } from '@/types';

interface ConversationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  conversation: EscalatedConversation;
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

export function ConversationDetailModal({
  isOpen,
  onClose,
  onSuccess,
  conversation,
}: ConversationDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ConversationStatus>(conversation.status);
  const [notes, setNotes] = useState(conversation.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateStatusMutation = useUpdateConversationStatus();
  const deleteMutation = useDeleteConversation();

  const isSaving = updateStatusMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  useEffect(() => {
    setSelectedStatus(conversation.status);
    setNotes(conversation.notes || '');
  }, [conversation]);

  const handleUpdateStatus = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        id: conversation.id,
        status: selectedStatus,
        notes,
      });
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(conversation.id);
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const messages = conversation.conversation_data?.messages || [];
  const userEmail = conversation.conversation_data?.user_email || 'Unknown User';
  const hasChanges =
    selectedStatus !== conversation.status || notes !== (conversation.notes || '');

  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this escalated conversation? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-sm">
              <p className="font-semibold text-gray-900 mb-2">Conversation with:</p>
              <p className="text-gray-700">{userEmail}</p>
              {conversation.escalated_reason && (
                <>
                  <p className="font-semibold text-gray-900 mt-3 mb-1">Reason:</p>
                  <p className="text-gray-700">{conversation.escalated_reason}</p>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Conversation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Conversation Details</DialogTitle>
          <DialogDescription>
            Review conversation transcript and update status
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Metadata Section */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">User Email</p>
              <p className="text-sm text-gray-900 mt-1">{userEmail}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Current Status</p>
              <Badge
                className={`${statusColors[conversation.status]} border mt-1`}
                variant="secondary"
              >
                {statusLabels[conversation.status]}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Escalated</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(conversation.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Last Updated</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(conversation.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Escalation Reason */}
          {conversation.escalated_reason && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Escalation Reason</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-800">{conversation.escalated_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conversation Transcript */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversation Transcript</h3>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      message.role === 'assistant' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-white border border-gray-200'
                          : 'bg-primary-100 border border-primary-200'
                      }`}
                    >
                      <p className="text-sm text-gray-900">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Update Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Update Status</h3>

            <div>
              <Label htmlFor="status-select">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as ConversationStatus)}
              >
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Admin Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this conversation or the resolution..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving || isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Close
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={isSaving || !hasChanges}
            className="bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
