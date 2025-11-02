/**
 * Enhanced Filter Panel - Phase 3C.2
 * Advanced multi-criteria filtering with saved presets
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Save, ChevronDown } from 'lucide-react';
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
  useComponents,
  useAssignees,
  useFilterPresets,
  useCreateFilterPreset,
} from '@/hooks/useAccessibilityAuditEnhanced';
import type { EnhancedIssueFilters } from '@/lib/accessibility-audit-api-enhanced';

interface EnhancedFilterPanelProps {
  onFilterChange: (filters: EnhancedIssueFilters) => void;
  initialFilters?: EnhancedIssueFilters;
}

export function EnhancedFilterPanel({ onFilterChange, initialFilters }: EnhancedFilterPanelProps) {
  const [filters, setFilters] = useState<EnhancedIssueFilters>(initialFilters || {});
  const [searchQuery, setSearchQuery] = useState(initialFilters?.searchQuery || '');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const { data: components } = useComponents();
  const { data: assignees } = useAssignees();
  const { data: presets } = useFilterPresets();
  const createPreset = useCreateFilterPreset();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.searchQuery) {
        updateFilters({ searchQuery });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateFilters = (newFilters: Partial<EnhancedIssueFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const empty = {};
    setFilters(empty);
    setSearchQuery('');
    onFilterChange(empty);
  };

  const saveCurrentFilters = async () => {
    if (!presetName.trim()) return;
    
    await createPreset.mutateAsync({
      preset_name: presetName,
      filters: filters,
      is_default: false,
    });
    
    setPresetName('');
    setShowSavePreset(false);
  };

  const loadPreset = (preset: any) => {
    const loaded = preset.filters;
    setFilters(loaded);
    setSearchQuery(loaded.searchQuery || '');
    onFilterChange(loaded);
  };

  const activeFilterCount = Object.keys(filters).filter(
    key => filters[key as keyof EnhancedIssueFilters] !== undefined && 
           filters[key as keyof EnhancedIssueFilters] !== ''
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div>
        <Label htmlFor="search">Search</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Search description, WCAG criteria, component..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Severity Filter */}
        <div>
          <Label htmlFor="severity">Severity</Label>
          <Select
            value={filters.severity as string || 'all'}
            onValueChange={(value) => 
              updateFilters({ severity: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="severity">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status as string || 'all'}
            onValueChange={(value) => 
              updateFilters({ status: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={filters.priority as string || 'all'}
            onValueChange={(value) => 
              updateFilters({ priority: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignee Filter */}
        <div>
          <Label htmlFor="assignee">Assigned To</Label>
          <Select
            value={filters.assignedTo || 'all'}
            onValueChange={(value) => 
              updateFilters({ assignedTo: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="assignee">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {assignees?.map((assignee) => (
                <SelectItem key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Component Filter */}
        <div>
          <Label htmlFor="component">Component</Label>
          <Select
            value={filters.component || 'all'}
            onValueChange={(value) => 
              updateFilters({ component: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="component">
              <SelectValue placeholder="All Components" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Components</SelectItem>
              {components?.map((component) => (
                <SelectItem key={component} value={component}>
                  {component}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Issue Type Filter */}
        <div>
          <Label htmlFor="issueType">Issue Type</Label>
          <Select
            value={filters.issueType as string || 'all'}
            onValueChange={(value) => 
              updateFilters({ issueType: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="issueType">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Perceivable">Perceivable</SelectItem>
              <SelectItem value="Operable">Operable</SelectItem>
              <SelectItem value="Understandable">Understandable</SelectItem>
              <SelectItem value="Robust">Robust</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Verification Status */}
        <div>
          <Label htmlFor="verification">Verification</Label>
          <Select
            value={filters.verificationStatus || 'all'}
            onValueChange={(value) => 
              updateFilters({ verificationStatus: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="verification">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Presets */}
      {presets && presets.length > 0 && (
        <div>
          <Label>Saved Presets</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {presets.map((preset) => (
              <Button
                key={preset.id}
                variant="outline"
                size="sm"
                onClick={() => loadPreset(preset)}
              >
                {preset.preset_name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Save Preset */}
      <div className="flex items-center gap-2 pt-2 border-t">
        {!showSavePreset ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavePreset(true)}
            disabled={activeFilterCount === 0}
          >
            <Save className="h-4 w-4 mr-1" />
            Save as Preset
          </Button>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={saveCurrentFilters} disabled={!presetName.trim()}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSavePreset(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
