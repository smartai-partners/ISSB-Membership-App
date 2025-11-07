import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, User } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  getEscalationRequests,
  type EscalationRequest,
} from '../../../lib/ai-chat-api';
import { EscalationDetailModal } from './EscalationDetailModal';
import { useToast } from '../../../hooks/use-toast';

export const EscalationManagement: React.FC = () => {
  const [escalations, setEscalations] = useState<EscalationRequest[]>([]);
  const [filteredEscalations, setFilteredEscalations] = useState<EscalationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEscalations();
  }, []);

  useEffect(() => {
    filterEscalations();
  }, [statusFilter, priorityFilter, escalations]);

  const loadEscalations = async () => {
    try {
      setIsLoading(true);
      const data = await getEscalationRequests();
      setEscalations(data);
    } catch (error) {
      console.error('Failed to load escalations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load escalation requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterEscalations = () => {
    let filtered = escalations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(e => e.priority === priorityFilter);
    }

    setFilteredEscalations(filtered);
  };

  const handleViewEscalation = (escalation: EscalationRequest) => {
    setSelectedEscalation(escalation);
  };

  const handleModalClose = (refresh: boolean) => {
    setSelectedEscalation(null);
    if (refresh) {
      loadEscalations();
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    const variants: Record<string, string> = {
      urgent: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white',
    };
    return variants[priority] || 'bg-gray-500';
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'destructive',
      in_progress: 'default',
      resolved: 'secondary',
      closed: 'outline',
    };
    return variants[status] || 'secondary';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <AlertCircle className="h-4 w-4" />,
      in_progress: <Clock className="h-4 w-4" />,
      resolved: <CheckCircle className="h-4 w-4" />,
      closed: <CheckCircle className="h-4 w-4" />,
    };
    return icons[status] || <AlertCircle className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeElapsed = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStats = () => {
    return {
      total: escalations.length,
      pending: escalations.filter(e => e.status === 'pending').length,
      inProgress: escalations.filter(e => e.status === 'in_progress').length,
      resolved: escalations.filter(e => e.status === 'resolved').length,
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Escalations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Escalations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Escalation Requests</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading escalations...
            </div>
          ) : filteredEscalations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No escalation requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEscalations.map((escalation) => (
                  <TableRow key={escalation.id}>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(escalation.status)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getStatusIcon(escalation.status)}
                        {escalation.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadgeVariant(escalation.priority)}>
                        {escalation.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="truncate max-w-xs">{escalation.reason}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatDate(escalation.created_at)}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTimeElapsed(escalation.created_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {escalation.assigned_to ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <User className="h-3 w-3" />
                          Assigned
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEscalation(escalation)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Escalation Detail Modal */}
      {selectedEscalation && (
        <EscalationDetailModal
          escalation={selectedEscalation}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};
