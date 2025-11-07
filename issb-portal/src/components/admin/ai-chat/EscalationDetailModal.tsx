import React, { useState, useEffect } from 'react';
import { Send, UserCheck } from 'lucide-react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import {
  getChatHistory,
  updateEscalationRequest,
  assignEscalation,
  type EscalationRequest,
  type ChatMessage,
} from '../../../lib/ai-chat-api';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../contexts/AuthContext';

interface EscalationDetailModalProps {
  escalation: EscalationRequest;
  onClose: (refresh: boolean) => void;
}

export const EscalationDetailModal: React.FC<EscalationDetailModalProps> = ({
  escalation,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState(escalation.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadConversation();
  }, [escalation.session_id]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      const history = await getChatHistory(escalation.session_id);
      setMessages(history.messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToMe = async () => {
    try {
      setIsSubmitting(true);
      await assignEscalation(escalation.id);
      toast({
        title: 'Success',
        description: 'Escalation assigned to you',
      });
      onClose(true);
    } catch (error) {
      console.error('Failed to assign escalation:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign escalation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide resolution notes',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await updateEscalationRequest(escalation.id, {
        status: newStatus,
        resolution_notes: resolution.trim(),
      });
      toast({
        title: 'Success',
        description: 'Escalation updated successfully',
      });
      onClose(true);
    } catch (error) {
      console.error('Failed to update escalation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update escalation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-600',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Escalation Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Escalation Info */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Priority: </h4>
                <Badge className={`${getPriorityColor(escalation.priority)} text-white mt-1`}>
                  {escalation.priority.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(escalation.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold">Reason:</h4>
              <p className="text-sm mt-1">{escalation.reason}</p>
            </div>
            {!escalation.assigned_to && escalation.status === 'pending' && (
              <Button
                onClick={handleAssignToMe}
                disabled={isSubmitting}
                className="mt-2"
                size="sm"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Assign to Me
              </Button>
            )}
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-hidden">
            <h4 className="font-semibold mb-2">Conversation History</h4>
            <ScrollArea className="h-80 border rounded-lg p-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading conversation...
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {message.sender_type === 'user' ? 'Member' : 'AI Assistant'}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.metadata.type === 'system' && (
                          <Badge variant="secondary" className="mt-2">
                            System Message
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Resolution Form */}
          {escalation.status !== 'resolved' && escalation.status !== 'closed' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as typeof newStatus)}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Notes</Label>
                <Textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter resolution notes or response to member..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This response will be added to the chat conversation for the member to see.
                </p>
              </div>

              <Button
                onClick={handleResolve}
                disabled={isSubmitting || !resolution.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Updating...' : 'Update Escalation'}
              </Button>
            </div>
          )}

          {/* Resolved Status */}
          {(escalation.status === 'resolved' || escalation.status === 'closed') &&
            escalation.resolution_notes && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Resolution
                </h4>
                <p className="text-sm mt-2">{escalation.resolution_notes}</p>
                {escalation.resolved_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Resolved: {new Date(escalation.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onClose(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
