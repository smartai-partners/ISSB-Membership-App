import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { User, UserRole, UserStatus, MembershipTier, UserFilter } from '@issb/types';
import Card, { CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Table, { TableColumn } from '../../components/ui/Table';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
  Download,
  Upload,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  tier: MembershipTier;
  status: UserStatus;
  phone?: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const permissions = usePermissionStore();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<UserFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.MEMBER,
    tier: MembershipTier.REGULAR,
    status: UserStatus.PENDING
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'sarah.johnson@example.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: UserRole.MEMBER,
          tier: MembershipTier.REGULAR,
          status: UserStatus.ACTIVE,
          phone: '+1234567890',
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-12-01'),
          lastLoginAt: new Date('2024-01-15'),
          emailVerifiedAt: new Date('2023-01-16')
        },
        {
          id: '2',
          email: 'michael.chen@example.com',
          firstName: 'Michael',
          lastName: 'Chen',
          role: UserRole.BOARD,
          tier: MembershipTier.BOARD,
          status: UserStatus.ACTIVE,
          phone: '+1234567891',
          createdAt: new Date('2023-02-20'),
          updatedAt: new Date('2023-12-05'),
          lastLoginAt: new Date('2024-01-14'),
          emailVerifiedAt: new Date('2023-02-21')
        },
        {
          id: '3',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
          tier: MembershipTier.ADMIN,
          status: UserStatus.ACTIVE,
          phone: '+1234567892',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-12-10'),
          lastLoginAt: new Date('2024-01-15'),
          emailVerifiedAt: new Date('2023-01-02')
        },
        {
          id: '4',
          email: 'pending.user@example.com',
          firstName: 'Pending',
          lastName: 'User',
          role: UserRole.MEMBER,
          tier: MembershipTier.REGULAR,
          status: UserStatus.PENDING,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          emailVerifiedAt: undefined
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filters.role?.length) {
      filtered = filtered.filter(user => filters.role!.includes(user.role));
    }

    // Status filter
    if (filters.status?.length) {
      filtered = filtered.filter(user => filters.status!.includes(user.status));
    }

    // Tier filter
    if (filters.tier?.length) {
      filtered = filtered.filter(user => filters.tier!.includes(user.tier));
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: String(users.length + 1),
        ...userForm,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setUsers([...users, newUser]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUsers = users.map(user =>
        user.id === selectedUser.id 
          ? { ...user, ...userForm, updatedAt: new Date() }
          : user
      );
      
      setUsers(updatedUsers);
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let updatedUsers = [...users];
      
      selectedUsers.forEach(userId => {
        const userIndex = updatedUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          switch (action) {
            case 'activate':
              updatedUsers[userIndex] = { ...updatedUsers[userIndex], status: UserStatus.ACTIVE };
              break;
            case 'suspend':
              updatedUsers[userIndex] = { ...updatedUsers[userIndex], status: UserStatus.SUSPENDED };
              break;
            case 'delete':
              updatedUsers = updatedUsers.filter(u => u.id !== userId);
              break;
          }
        }
      });
      
      setUsers(updatedUsers);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const resetForm = () => {
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      role: UserRole.MEMBER,
      tier: MembershipTier.REGULAR,
      status: UserStatus.PENDING
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      tier: user.tier,
      status: user.status,
      phone: user.phone
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status: UserStatus) => {
    const styles = {
      [UserStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [UserStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
      [UserStatus.SUSPENDED]: 'bg-red-100 text-red-800',
      [UserStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [UserStatus.BANNED]: 'bg-red-100 text-red-800'
    };

    const icons = {
      [UserStatus.ACTIVE]: <CheckCircle className="w-3 h-3" />,
      [UserStatus.INACTIVE]: <XCircle className="w-3 h-3" />,
      [UserStatus.SUSPENDED]: <AlertTriangle className="w-3 h-3" />,
      [UserStatus.PENDING]: <Clock className="w-3 h-3" />,
      [UserStatus.BANNED]: <XCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      [UserRole.ADMIN]: 'bg-purple-100 text-purple-800',
      [UserRole.BOARD]: 'bg-blue-100 text-blue-800',
      [UserRole.MEMBER]: 'bg-green-100 text-green-800'
    };

    const icons = {
      [UserRole.ADMIN]: <Shield className="w-3 h-3" />,
      [UserRole.BOARD]: <Users className="w-3 h-3" />,
      [UserRole.MEMBER]: <UserCheck className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {icons[role]}
        <span className="capitalize">{role}</span>
      </span>
    );
  };

  const userColumns: TableColumn<User>[] = [
    {
      key: 'name',
      title: 'Name',
      render: (_, user) => (
        <div>
          <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      ),
      sortable: true
    },
    {
      key: 'role',
      title: 'Role',
      dataIndex: 'role',
      render: getRoleBadge,
      width: '120px'
    },
    {
      key: 'tier',
      title: 'Tier',
      dataIndex: 'tier',
      render: (tier) => (
        <span className="capitalize text-sm text-gray-600">{tier}</span>
      ),
      width: '100px'
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: getStatusBadge,
      width: '120px'
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Never',
      width: '120px'
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '80px',
      render: (_, user) => (
        <div className="flex items-center space-x-1">
          {permissions.canEditUser(currentUser!, user) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => openEditModal(user)}
            />
          )}
          {permissions.canDeleteUser(currentUser!, user) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => openDeleteModal(user)}
              className="text-red-600 hover:text-red-700"
            />
          )}
        </div>
      )
    }
  ];

  const hasBulkPermission = permissions.hasPermission(currentUser!, 'user:write');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="outline" icon={<Upload className="w-4 h-4" />}>
            Import
          </Button>
          <Button 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              icon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
          
          {selectedUsers.length > 0 && hasBulkPermission && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={<UserCheck className="w-4 h-4" />}
                onClick={() => handleBulkAction('activate')}
              >
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<UserX className="w-4 h-4" />}
                onClick={() => handleBulkAction('suspend')}
              >
                Suspend
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleBulkAction('delete')}
                className="text-red-600"
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.role || []}
                onChange={(e) => setFilters({...filters, role: Array.from(e.target.selectedOptions, option => option.value as UserRole)})}
              >
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.BOARD}>Board</option>
                <option value={UserRole.MEMBER}>Member</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.status || []}
                onChange={(e) => setFilters({...filters, status: Array.from(e.target.selectedOptions, option => option.value as UserStatus)})}
              >
                <option value={UserStatus.ACTIVE}>Active</option>
                <option value={UserStatus.INACTIVE}>Inactive</option>
                <option value={UserStatus.SUSPENDED}>Suspended</option>
                <option value={UserStatus.PENDING}>Pending</option>
                <option value={UserStatus.BANNED}>Banned</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select 
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.tier || []}
                onChange={(e) => setFilters({...filters, tier: Array.from(e.target.selectedOptions, option => option.value as MembershipTier)})}
              >
                <option value={MembershipTier.REGULAR}>Regular</option>
                <option value={MembershipTier.BOARD}>Board</option>
                <option value={MembershipTier.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            columns={userColumns}
            data={filteredUsers}
            loading={loading}
            selection={{
              selectedRowKeys: selectedUsers,
              onChange: setSelectedUsers
            }}
            pagination={{
              pageSize: 25,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: true
            }}
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <Input
                value={userForm.firstName}
                onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <Input
                value={userForm.lastName}
                onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              type="tel"
              value={userForm.phone || ''}
              onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({...userForm, role: e.target.value as UserRole})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={UserRole.MEMBER}>Member</option>
                <option value={UserRole.BOARD}>Board</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={userForm.tier}
                onChange={(e) => setUserForm({...userForm, tier: e.target.value as MembershipTier})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={MembershipTier.REGULAR}>Regular</option>
                <option value={MembershipTier.BOARD}>Board</option>
                <option value={MembershipTier.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={userForm.status}
              onChange={(e) => setUserForm({...userForm, status: e.target.value as UserStatus})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={UserStatus.PENDING}>Pending</option>
              <option value={UserStatus.ACTIVE}>Active</option>
              <option value={UserStatus.INACTIVE}>Inactive</option>
              <option value={UserStatus.SUSPENDED}>Suspended</option>
            </select>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
        }}
        title="Edit User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <Input
                value={userForm.firstName}
                onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <Input
                value={userForm.lastName}
                onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              type="tel"
              value={userForm.phone || ''}
              onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({...userForm, role: e.target.value as UserRole})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={UserRole.MEMBER}>Member</option>
                <option value={UserRole.BOARD}>Board</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={userForm.tier}
                onChange={(e) => setUserForm({...userForm, tier: e.target.value as MembershipTier})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={MembershipTier.REGULAR}>Regular</option>
                <option value={MembershipTier.BOARD}>Board</option>
                <option value={MembershipTier.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={userForm.status}
              onChange={(e) => setUserForm({...userForm, status: e.target.value as UserStatus})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={UserStatus.PENDING}>Pending</option>
              <option value={UserStatus.ACTIVE}>Active</option>
              <option value={UserStatus.INACTIVE}>Inactive</option>
              <option value={UserStatus.SUSPENDED}>Suspended</option>
            </select>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              Update User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
              <p className="text-gray-600 mt-1">
                This action cannot be undone. This will permanently delete the user account
                and remove all associated data from our servers.
              </p>
              {selectedUser && (
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;