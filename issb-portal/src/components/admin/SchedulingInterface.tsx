/**
 * Phase 3C.3: Scheduling Interface
 * UI for managing scheduled accessibility audits
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Edit, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  useAuditSchedules,
  useCreateAuditSchedule,
  useUpdateAuditSchedule,
  useDeleteAuditSchedule,
} from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/use-toast';
import type { AuditSchedule } from '@/types';

export function SchedulingInterface() {
  const { toast } = useToast();
  const { data: schedules, isLoading } = useAuditSchedules();
  const createSchedule = useCreateAuditSchedule();
  const updateSchedule = useUpdateAuditSchedule();
  const deleteSchedule = useDeleteAuditSchedule();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AuditSchedule | null>(null);
  const [formData, setFormData] = useState({
    schedule_name: '',
    description: '',
    target_urls: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'custom',
    wcag_level: 'AA' as 'A' | 'AA' | 'AAA',
    is_active: true,
    notify_on_completion: false,
    notification_emails: '',
  });

  const resetForm = () => {
    setFormData({
      schedule_name: '',
      description: '',
      target_urls: '',
      frequency: 'weekly',
      wcag_level: 'AA',
      is_active: true,
      notify_on_completion: false,
      notification_emails: '',
    });
    setEditingSchedule(null);
  };

  const handleCreate = async () => {
    try {
      const urls = formData.target_urls.split('\n').filter(url => url.trim());
      const emails = formData.notification_emails
        ? formData.notification_emails.split(',').map(e => e.trim()).filter(e => e)
        : undefined;

      await createSchedule.mutateAsync({
        schedule_name: formData.schedule_name,
        description: formData.description || undefined,
        target_urls: urls,
        frequency: formData.frequency,
        wcag_level: formData.wcag_level,
        is_active: formData.is_active,
        notify_on_completion: formData.notify_on_completion,
        notification_emails: emails,
        next_run_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      } as any);

      toast({
        title: 'Schedule created',
        description: `Audit schedule "${formData.schedule_name}" has been created.`,
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create schedule',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingSchedule) return;

    try {
      const urls = formData.target_urls.split('\n').filter(url => url.trim());
      const emails = formData.notification_emails
        ? formData.notification_emails.split(',').map(e => e.trim()).filter(e => e)
        : undefined;

      await updateSchedule.mutateAsync({
        id: editingSchedule.id,
        updates: {
          schedule_name: formData.schedule_name,
          description: formData.description || undefined,
          target_urls: urls,
          frequency: formData.frequency,
          wcag_level: formData.wcag_level,
          is_active: formData.is_active,
          notify_on_completion: formData.notify_on_completion,
          notification_emails: emails,
        },
      });

      toast({
        title: 'Schedule updated',
        description: `Audit schedule "${formData.schedule_name}" has been updated.`,
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update schedule',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the schedule "${name}"?`)) return;

    try {
      await deleteSchedule.mutateAsync(id);
      toast({
        title: 'Schedule deleted',
        description: `Audit schedule "${name}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (schedule: AuditSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      schedule_name: schedule.schedule_name,
      description: schedule.description || '',
      target_urls: schedule.target_urls.join('\n'),
      frequency: schedule.frequency,
      wcag_level: schedule.wcag_level,
      is_active: schedule.is_active,
      notify_on_completion: schedule.notify_on_completion,
      notification_emails: schedule.notification_emails?.join(', ') || '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleToggleActive = async (schedule: AuditSchedule) => {
    try {
      await updateSchedule.mutateAsync({
        id: schedule.id,
        updates: { is_active: !schedule.is_active },
      });
      toast({
        title: schedule.is_active ? 'Schedule deactivated' : 'Schedule activated',
        description: `Audit schedule "${schedule.schedule_name}" is now ${!schedule.is_active ? 'active' : 'inactive'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle schedule',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scheduled Audits</h2>
          <p className="text-muted-foreground">
            Manage automated accessibility audit schedules
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
              </DialogTitle>
              <DialogDescription>
                {editingSchedule
                  ? 'Update the scheduled audit configuration'
                  : 'Configure a new scheduled accessibility audit'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schedule_name">Schedule Name</Label>
                <Input
                  id="schedule_name"
                  value={formData.schedule_name}
                  onChange={(e) => setFormData({ ...formData, schedule_name: e.target.value })}
                  placeholder="Daily Dashboard Audit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Automated audit of admin dashboard pages"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_urls">Target URLs (one per line)</Label>
                <textarea
                  id="target_urls"
                  className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
                  value={formData.target_urls}
                  onChange={(e) => setFormData({ ...formData, target_urls: e.target.value })}
                  placeholder="https://example.com/page1&#10;https://example.com/page2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wcag_level">WCAG Level</Label>
                  <Select
                    value={formData.wcag_level}
                    onValueChange={(value: any) => setFormData({ ...formData, wcag_level: value })}
                  >
                    <SelectTrigger id="wcag_level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Level A</SelectItem>
                      <SelectItem value="AA">Level AA</SelectItem>
                      <SelectItem value="AAA">Level AAA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_on_completion">Email Notifications</Label>
                  <Switch
                    id="notify_on_completion"
                    checked={formData.notify_on_completion}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, notify_on_completion: checked })
                    }
                  />
                </div>
              </div>

              {formData.notify_on_completion && (
                <div className="space-y-2">
                  <Label htmlFor="notification_emails">Notification Emails (comma-separated)</Label>
                  <Input
                    id="notification_emails"
                    value={formData.notification_emails}
                    onChange={(e) =>
                      setFormData({ ...formData, notification_emails: e.target.value })
                    }
                    placeholder="admin@example.com, team@example.com"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={editingSchedule ? handleUpdate : handleCreate}
                disabled={
                  !formData.schedule_name || !formData.target_urls ||
                  createSchedule.isPending || updateSchedule.isPending
                }
              >
                {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading schedules...</p>
        </div>
      ) : schedules && schedules.length > 0 ? (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{schedule.schedule_name}</CardTitle>
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {schedule.description && (
                      <CardDescription className="mt-1">{schedule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(schedule.id, schedule.schedule_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-medium capitalize">{schedule.frequency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">WCAG Level</p>
                      <p className="font-medium">{schedule.wcag_level}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target URLs</p>
                      <p className="font-medium">{schedule.target_urls.length} URLs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Notifications</p>
                      <p className="font-medium">
                        {schedule.notify_on_completion ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  {schedule.last_run_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last run: {new Date(schedule.last_run_at).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {schedule.next_run_at && schedule.is_active && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Next run: {new Date(schedule.next_run_at).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(schedule)}
                      disabled={updateSchedule.isPending}
                    >
                      {schedule.is_active ? 'Deactivate' : 'Activate'} Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No scheduled audits</p>
            <p className="text-muted-foreground text-center mb-4">
              Create your first scheduled audit to automate accessibility testing
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
