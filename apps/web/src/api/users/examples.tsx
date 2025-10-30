// ============================================================================
// USER API USAGE EXAMPLES
// ============================================================================

import React, { useState, useEffect } from 'react';
import { userApi, UserStatus, UserRole, MembershipTier } from '@/api/users';
import type { User, UserListResponse, UserSearchParams, UserStatistics } from '@issb/types';

// ============================================================================
// EXAMPLE 1: USER LIST COMPONENT
// ============================================================================

interface UserListProps {
  onUserSelect?: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ onUserSelect }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = async (params?: UserSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: UserListResponse = await userApi.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        ...params,
      });

      setUsers(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSearch = (searchTerm: string) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers({ search: searchTerm });
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          onChange={(e) => handleSearch(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>
                <button onClick={() => onUserSelect?.(user)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          disabled={pagination.page === pagination.totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: USER CREATION FORM
// ============================================================================

export const CreateUserForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.MEMBER,
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await userApi.createUser(formData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: UserRole.MEMBER,
        phone: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">User created successfully!</div>}
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div>
        <label>Password:</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
      </div>

      <div>
        <label>First Name:</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
          required
        />
      </div>

      <div>
        <label>Last Name:</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
          required
        />
      </div>

      <div>
        <label>Role:</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
        >
          <option value={UserRole.MEMBER}>Member</option>
          <option value={UserRole.BOARD}>Board</option>
          <option value={UserRole.ADMIN}>Admin</option>
        </select>
      </div>

      <div>
        <label>Phone:</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
};

// ============================================================================
// EXAMPLE 3: USER PROFILE MANAGEMENT
// ============================================================================

interface UserProfileProps {
  userId: string;
}

export const UserProfileManager: React.FC<UserProfileProps> = ({ userId }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await userApi.getUserProfile(userId);
        setProfile(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleUpdateProfile = async (updates: any) => {
    try {
      setSaving(true);
      const updatedProfile = await userApi.updateUserProfile(userId, updates);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setSaving(true);
      const { avatarUrl } = await userApi.uploadAvatar(userId, file);
      setProfile((prev: any) => ({ ...prev, avatar: avatarUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div className="profile-manager">
      <div className="profile-avatar">
        <img src={profile.avatar || '/default-avatar.png'} alt="Avatar" />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAvatarUpload(file);
          }}
        />
      </div>

      <div className="profile-form">
        <div>
          <label>Bio:</label>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
        </div>

        <div>
          <label>Location:</label>
          <input
            type="text"
            value={profile.location || ''}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          />
        </div>

        <div>
          <label>Occupation:</label>
          <input
            type="text"
            value={profile.occupation || ''}
            onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
          />
        </div>

        <button
          onClick={() => handleUpdateProfile(profile)}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: BULK USER OPERATIONS
// ============================================================================

export const BulkUserOperations: React.FC = () => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [operation, setOperation] = useState<'activate' | 'deactivate' | 'suspend' | 'delete'>('activate');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBulkOperation = async () => {
    if (selectedUserIds.length === 0) {
      alert('Please select users first');
      return;
    }

    try {
      setLoading(true);
      const response = await userApi.bulkOperation({
        userIds: selectedUserIds,
        operation,
      });
      setResult(response);
      
      // Clear selection
      setSelectedUserIds([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-operations">
      <div className="operation-selector">
        <select value={operation} onChange={(e) => setOperation(e.target.value as any)}>
          <option value="activate">Activate</option>
          <option value="deactivate">Deactivate</option>
          <option value="suspend">Suspend</option>
          <option value="delete">Delete</option>
        </select>

        <button onClick={handleBulkOperation} disabled={loading || selectedUserIds.length === 0}>
          {loading ? 'Processing...' : `Execute on ${selectedUserIds.length} users`}
        </button>
      </div>

      {result && (
        <div className="operation-result">
          <p>Success: {result.success}</p>
          <p>Failed: {result.failed}</p>
          {result.errors.length > 0 && (
            <div>
              <p>Errors:</p>
              <ul>
                {result.errors.map((error: any, index: number) => (
                  <li key={index}>{error.userId}: {error.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: USER DASHBOARD WITH STATISTICS
// ============================================================================

export const UserDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statistics = await userApi.getUserStatistics();
        setStats(statistics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="user-dashboard">
      <h2>User Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.total}</p>
        </div>

        <div className="stat-card">
          <h3>Active Users</h3>
          <p className="stat-number">{stats.active}</p>
        </div>

        <div className="stat-card">
          <h3>Suspended</h3>
          <p className="stat-number">{stats.suspended}</p>
        </div>

        <div className="stat-card">
          <h3>Recent (30 days)</h3>
          <p className="stat-number">{stats.last30Days}</p>
        </div>
      </div>

      <div className="role-breakdown">
        <h3>By Role</h3>
        {Object.entries(stats.byRole).map(([role, count]) => (
          <div key={role} className="role-stat">
            <span>{role}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>

      <div className="tier-breakdown">
        <h3>By Tier</h3>
        {Object.entries(stats.byTier).map(([tier, count]) => (
          <div key={tier} className="tier-stat">
            <span>{tier}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 6: USER SEARCH WITH FILTERS
// ============================================================================

export const UserSearchComponent: React.FC = () => {
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    search: '',
    role: [],
    status: [],
    page: 1,
    limit: 20,
  });
  const [results, setResults] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await userApi.searchUsers(searchParams);
      setResults(response);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof UserSearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchParams]);

  return (
    <div className="user-search">
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchParams.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />

        <select
          multiple
          value={searchParams.role || []}
          onChange={(e) => handleFilterChange('role', Array.from(e.target.selectedOptions, option => option.value as UserRole))}
        >
          <option value={UserRole.MEMBER}>Member</option>
          <option value={UserRole.BOARD}>Board</option>
          <option value={UserRole.ADMIN}>Admin</option>
        </select>

        <select
          multiple
          value={searchParams.status || []}
          onChange={(e) => handleFilterChange('status', Array.from(e.target.selectedOptions, option => option.value as UserStatus))}
        >
          <option value={UserStatus.ACTIVE}>Active</option>
          <option value={UserStatus.INACTIVE}>Inactive</option>
          <option value={UserStatus.SUSPENDED}>Suspended</option>
          <option value={UserStatus.PENDING}>Pending</option>
        </select>

        <select
          value={searchParams.limit}
          onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {loading && <div>Searching...</div>}

      {results && (
        <div className="search-results">
          <p>Found {results.pagination.total} users</p>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {results.data.map(user => (
                <tr key={user.id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const UserApiExamples = {
  UserList,
  CreateUserForm,
  UserProfileManager,
  BulkUserOperations,
  UserDashboard,
  UserSearchComponent,
};
