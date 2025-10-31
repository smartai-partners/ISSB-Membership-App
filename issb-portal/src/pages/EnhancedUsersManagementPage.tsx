/**
 * Enhanced Users Management Page
 * Enterprise-grade user management with hierarchical architecture
 * Uses RTK Query, DataTable, and accessible components
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, MoreVertical, UserPlus, Shield, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetAllUsersQuery, useUpdateUserProfileMutation, useDeleteUserMutation } from '@/store/api/adminApi';
import { DataTable } from '@/components/admin/DataTable';
import { UserFilters, UserFilterValues } from '@/components/admin/UserFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Profile, UserRole, UserStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function EnhancedUsersManagementPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [filters, setFilters] = useState<UserFilterValues>({
    searchQuery: '',
    roles: [],
    statuses: [],
    membershipTier: '',
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(25);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  // RTK Query hooks
  const { data, isLoading, error, refetch } = useGetAllUsersQuery({
    searchQuery: filters.searchQuery,
    roles: filters.roles,
    statuses: filters.statuses,
    membershipTier: filters.membershipTier,
    pageIndex,
    pageSize,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // Check authorization
  React.useEffect(() => {
    if (!profile || !['admin', 'board'].includes(profile.role)) {
      navigate('/');
    }
  }, [profile, navigate]);

  // Define table columns
  const columns = useMemo<ColumnDef<Profile>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {row.original.first_name} {row.original.last_name}
            </span>
            <span className="text-sm text-gray-500">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const roleColors: Record<UserRole, string> = {
            admin: 'bg-red-100 text-red-800',
            board: 'bg-purple-100 text-purple-800',
            member: 'bg-blue-100 text-blue-800',
            student: 'bg-green-100 text-green-800',
            applicant: 'bg-yellow-100 text-yellow-800',
          };

          return (
            <Badge className={roleColors[row.original.role]} variant="secondary">
              {row.original.role}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const statusColors: Record<UserStatus, string> = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            suspended: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
          };

          return (
            <Badge className={statusColors[row.original.status]} variant="secondary">
              {row.original.status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'membership_tier',
        header: 'Tier',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 capitalize">
            {row.original.membership_tier || 'None'}
          </span>
        ),
      },
      {
        accessorKey: 'total_volunteer_hours',
        header: 'Hours',
        cell: ({ row }) => (
          <span className="text-sm text-gray-900 font-medium">
            {row.original.total_volunteer_hours || 0}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="User actions menu">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEditingUser(row.original);
                  setShowEditDialog(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setUserToDelete(row.original);
                  setShowDeleteDialog(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  // Handle edit user
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await updateUser({
        userId: editingUser.id,
        updates: {
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          role: editingUser.role,
          status: editingUser.status,
          phone: editingUser.phone,
        },
      }).unwrap();

      toast({
        title: 'User Updated',
        description: 'User profile has been updated successfully.',
      });

      setShowEditDialog(false);
      setEditingUser(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id).unwrap();

      toast({
        title: 'User Deleted',
        description: 'User has been deleted successfully.',
      });

      setShowDeleteDialog(false);
      setUserToDelete(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading users. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <UserFilters onFilterChange={(newFilters) => {
        setFilters(newFilters);
        setPageIndex(0); // Reset to first page on filter change
      }} />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.users || []}
        loading={isLoading}
        pagination={
          data
            ? {
                pageIndex: data.pageIndex,
                pageSize: data.pageSize,
                pageCount: data.pageCount,
                total: data.total,
              }
            : undefined
        }
        onPaginationChange={(pagination) => setPageIndex(pagination.pageIndex)}
        sortable
      />

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={editingUser.first_name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={editingUser.last_name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, last_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value as UserRole })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="board">Board Member</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="applicant">Applicant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingUser.status}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, status: value as UserStatus })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">
                {userToDelete.first_name} {userToDelete.last_name}
              </p>
              <p className="text-sm text-gray-600">{userToDelete.email}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
