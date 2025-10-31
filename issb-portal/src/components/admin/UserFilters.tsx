/**
 * User Filters Component
 * WCAG 2.1 AA compliant filtering interface for user management
 * Implements accessible form controls with ARIA labels and live regions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { UserRole, UserStatus, MembershipTier } from '@/types';

export interface UserFilterValues {
  searchQuery: string;
  roles: UserRole[];
  statuses: UserStatus[];
  membershipTier: string;
}

interface UserFiltersProps {
  onFilterChange: (filters: UserFilterValues) => void;
  className?: string;
}

export function UserFilters({ onFilterChange, className = '' }: UserFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<UserStatus[]>([]);
  const [selectedMembership, setSelectedMembership] = useState('');

  // ARIA live region for announcing filter changes
  const [announcement, setAnnouncement] = useState('');

  // Debounced filter application
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({
        searchQuery,
        roles: selectedRoles,
        statuses: selectedStatuses,
        membershipTier: selectedMembership,
      });

      // Announce filter changes for screen readers
      const announcements: string[] = [];
      if (searchQuery) announcements.push(`Search: ${searchQuery}`);
      if (selectedRoles.length > 0) announcements.push(`${selectedRoles.length} roles selected`);
      if (selectedStatuses.length > 0) announcements.push(`${selectedStatuses.length} statuses selected`);
      if (selectedMembership) announcements.push(`Membership tier: ${selectedMembership}`);

      if (announcements.length > 0) {
        setAnnouncement(`Filters updated. ${announcements.join('. ')}`);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedRoles, selectedStatuses, selectedMembership, onFilterChange]);

  const handleRoleToggle = useCallback((role: UserRole, checked: boolean) => {
    setSelectedRoles((prev) =>
      checked ? [...prev, role] : prev.filter((r) => r !== role)
    );
  }, []);

  const handleStatusToggle = useCallback((status: UserStatus, checked: boolean) => {
    setSelectedStatuses((prev) =>
      checked ? [...prev, status] : prev.filter((s) => s !== status)
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRoles([]);
    setSelectedStatuses([]);
    setSelectedMembership('');
    setAnnouncement('All filters cleared');
  }, []);

  const hasActiveFilters =
    searchQuery || selectedRoles.length > 0 || selectedStatuses.length > 0 || selectedMembership;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 space-y-6 ${className}`}>
      {/* Screen reader announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filter Users</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="user-search" className="text-sm font-medium text-gray-700">
          Search Users
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            id="user-search"
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-describedby="search-help"
          />
        </div>
        <p id="search-help" className="text-xs text-gray-500">
          Search by first name, last name, email address, or phone number
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Role Filters */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-700 mb-3">Filter by Role</legend>
          <div className="space-y-2">
            {(['admin', 'board', 'member', 'student', 'applicant'] as UserRole[]).map((role) => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role}`}
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={(checked) => handleRoleToggle(role, checked as boolean)}
                  aria-describedby={`role-${role}-desc`}
                />
                <Label
                  htmlFor={`role-${role}`}
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {role === 'admin' ? 'Administrator' : role === 'board' ? 'Board Member' : role.charAt(0).toUpperCase() + role.slice(1)}
                </Label>
                <span id={`role-${role}-desc`} className="sr-only">
                  Filter users with {role} role
                </span>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Status Filters */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-700 mb-3">Filter by Status</legend>
          <div className="space-y-2">
            {(['active', 'inactive', 'suspended', 'pending'] as UserStatus[]).map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={(checked) => handleStatusToggle(status, checked as boolean)}
                  aria-describedby={`status-${status}-desc`}
                />
                <Label
                  htmlFor={`status-${status}`}
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Label>
                <span id={`status-${status}-desc`} className="sr-only">
                  Filter users with {status} status
                </span>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Membership Tier Filter */}
        <div className="space-y-3">
          <Label htmlFor="membership-filter" className="text-sm font-medium text-gray-700">
            Membership Tier
          </Label>
          <Select value={selectedMembership} onValueChange={setSelectedMembership}>
            <SelectTrigger id="membership-filter" aria-describedby="membership-help">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Members</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
          <p id="membership-help" className="text-xs text-gray-500">
            Filter by membership tier level
          </p>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2" role="status" aria-label="Active filters">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-primary-900"
                  aria-label="Remove search filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                Role: {role}
                <button
                  onClick={() => handleRoleToggle(role, false)}
                  className="hover:text-blue-900"
                  aria-label={`Remove ${role} role filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedStatuses.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
              >
                Status: {status}
                <button
                  onClick={() => handleStatusToggle(status, false)}
                  className="hover:text-purple-900"
                  aria-label={`Remove ${status} status filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedMembership && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Tier: {selectedMembership}
                <button
                  onClick={() => setSelectedMembership('')}
                  className="hover:text-green-900"
                  aria-label="Remove membership tier filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
