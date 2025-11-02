/**
 * Phase 3C.3: Quality Gates Panel
 * UI for managing CI/CD quality gates for accessibility compliance
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Shield, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import {
  useQualityGates,
  useCreateQualityGate,
  useUpdateQualityGate,
  useDeleteQualityGate,
  useQualityGateResults,
} from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/use-toast';
import type { QualityGate } from '@/types';

export function QualityGatesPanel() {
  const { toast } = useToast();
  const { data: gates, isLoading } = useQualityGates();
  const createGate = useCreateQualityGate();
  const updateGate = useUpdateQualityGate();
  const deleteGate = useDeleteQualityGate();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<QualityGate | null>(null);
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const { data: gateResults } = useQualityGateResults(selectedGateId || undefined, 10);

  const [formData, setFormData] = useState({
    gate_name: '',
    description: '',
    repository: '',
    branch: '',
    min_compliance_score: 80,
    max_critical_issues: 0,
    max_high_issues: 3,
    block_deployment: true,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      gate_name: '',
      description: '',
      repository: '',
      branch: '',
      min_compliance_score: 80,
      max_critical_issues: 0,
      max_high_issues: 3,
      block_deployment: true,
      is_active: true,
    });
    setEditingGate(null);
  };

  const handleCreate = async () => {
    try {
      await createGate.mutateAsync({
        gate_name: formData.gate_name,
        description: formData.description || undefined,
        repository: formData.repository || undefined,
        branch: formData.branch || undefined,
        min_compliance_score: formData.min_compliance_score,
        max_critical_issues: formData.max_critical_issues,
        max_high_issues: formData.max_high_issues,
        block_deployment: formData.block_deployment,
        is_active: formData.is_active,
      } as any);

      toast({
        title: 'Quality gate created',
        description: `Quality gate "${formData.gate_name}" has been created.`,
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create quality gate',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingGate) return;

    try {
      await updateGate.mutateAsync({
        id: editingGate.id,
        updates: {
          gate_name: formData.gate_name,
          description: formData.description || undefined,
          repository: formData.repository || undefined,
          branch: formData.branch || undefined,
          min_compliance_score: formData.min_compliance_score,
          max_critical_issues: formData.max_critical_issues,
          max_high_issues: formData.max_high_issues,
          block_deployment: formData.block_deployment,
          is_active: formData.is_active,
        },
      });

      toast({
        title: 'Quality gate updated',
        description: `Quality gate "${formData.gate_name}" has been updated.`,
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update quality gate',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the quality gate "${name}"?`)) return;

    try {
      await deleteGate.mutateAsync(id);
      toast({
        title: 'Quality gate deleted',
        description: `Quality gate "${name}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete quality gate',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (gate: QualityGate) => {
    setEditingGate(gate);
    setFormData({
      gate_name: gate.gate_name,
      description: gate.description || '',
      repository: gate.repository || '',
      branch: gate.branch || '',
      min_compliance_score: gate.min_compliance_score,
      max_critical_issues: gate.max_critical_issues,
      max_high_issues: gate.max_high_issues,
      block_deployment: gate.block_deployment,
      is_active: gate.is_active,
    });
    setIsCreateDialogOpen(true);
  };

  const handleToggleActive = async (gate: QualityGate) => {
    try {
      await updateGate.mutateAsync({
        id: gate.id,
        updates: { is_active: !gate.is_active },
      });
      toast({
        title: gate.is_active ? 'Gate deactivated' : 'Gate activated',
        description: `Quality gate "${gate.gate_name}" is now ${!gate.is_active ? 'active' : 'inactive'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle gate',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quality Gates</h2>
          <p className="text-muted-foreground">
            Configure CI/CD quality gates for accessibility compliance
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Quality Gate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingGate ? 'Edit Quality Gate' : 'Create New Quality Gate'}
              </DialogTitle>
              <DialogDescription>
                {editingGate
                  ? 'Update the quality gate configuration'
                  : 'Configure a new quality gate for CI/CD integration'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gate_name">Gate Name</Label>
                <Input
                  id="gate_name"
                  value={formData.gate_name}
                  onChange={(e) => setFormData({ ...formData, gate_name: e.target.value })}
                  placeholder="Production Deployment Gate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Quality gate for production deployments"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repository">Repository (Optional)</Label>
                  <Input
                    id="repository"
                    value={formData.repository}
                    onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                    placeholder="owner/repo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch (Optional)</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="main"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Compliance Criteria</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="min_compliance_score">
                    Minimum Compliance Score (%)
                  </Label>
                  <Input
                    id="min_compliance_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.min_compliance_score}
                    onChange={(e) =>
                      setFormData({ ...formData, min_compliance_score: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_critical_issues">
                    Maximum Critical Issues Allowed
                  </Label>
                  <Input
                    id="max_critical_issues"
                    type="number"
                    min="0"
                    value={formData.max_critical_issues}
                    onChange={(e) =>
                      setFormData({ ...formData, max_critical_issues: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_high_issues">
                    Maximum High Severity Issues Allowed
                  </Label>
                  <Input
                    id="max_high_issues"
                    type="number"
                    min="0"
                    value={formData.max_high_issues}
                    onChange={(e) =>
                      setFormData({ ...formData, max_high_issues: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="block_deployment">Block Deployment</Label>
                    <p className="text-sm text-muted-foreground">
                      Prevent deployments if gate fails
                    </p>
                  </div>
                  <Switch
                    id="block_deployment"
                    checked={formData.block_deployment}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, block_deployment: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">Active</Label>
                    <p className="text-sm text-muted-foreground">Enable this quality gate</p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={editingGate ? handleUpdate : handleCreate}
                disabled={
                  !formData.gate_name || createGate.isPending || updateGate.isPending
                }
              >
                {editingGate ? 'Update Gate' : 'Create Gate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading quality gates...</p>
        </div>
      ) : gates && gates.length > 0 ? (
        <div className="grid gap-4">
          {gates.map((gate) => (
            <Card key={gate.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle>{gate.gate_name}</CardTitle>
                      <Badge variant={gate.is_active ? 'default' : 'secondary'}>
                        {gate.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {gate.last_check_passed !== null && (
                        <Badge variant={gate.last_check_passed ? 'default' : 'destructive'}>
                          {gate.last_check_passed ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Passed
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                    {gate.description && (
                      <CardDescription className="mt-1">{gate.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(gate)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(gate.id, gate.gate_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Min Score</p>
                      <p className="text-lg font-bold">{gate.min_compliance_score}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Critical</p>
                      <p className="text-lg font-bold text-red-600">{gate.max_critical_issues}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max High</p>
                      <p className="text-lg font-bold text-orange-600">{gate.max_high_issues}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Action</p>
                      <p className="text-lg font-bold">
                        {gate.block_deployment ? 'Block' : 'Warn'}
                      </p>
                    </div>
                  </div>

                  {(gate.repository || gate.branch) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {gate.repository && <span>Repo: {gate.repository}</span>}
                      {gate.branch && <span>Branch: {gate.branch}</span>}
                    </div>
                  )}

                  {gate.last_check_at && (
                    <div className="text-sm text-muted-foreground">
                      Last check: {new Date(gate.last_check_at).toLocaleString()}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(gate)}
                      disabled={updateGate.isPending}
                    >
                      {gate.is_active ? 'Deactivate' : 'Activate'} Gate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGateId(selectedGateId === gate.id ? null : gate.id)}
                    >
                      {selectedGateId === gate.id ? 'Hide' : 'Show'} History
                    </Button>
                  </div>

                  {selectedGateId === gate.id && gateResults && gateResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-sm">Recent Checks</h4>
                      {gateResults.map((result) => (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 border rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-3">
                            {result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium">
                                {result.passed ? 'Passed' : 'Failed'}
                              </p>
                              <p className="text-muted-foreground">
                                {new Date(result.check_timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p>Score: {result.compliance_score}%</p>
                            <p className="text-muted-foreground">
                              Critical: {result.critical_issues}, High: {result.high_issues}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No quality gates configured</p>
            <p className="text-muted-foreground text-center mb-4">
              Create quality gates to enforce accessibility standards in your CI/CD pipeline
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Quality Gate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
