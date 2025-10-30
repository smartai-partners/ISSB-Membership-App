import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { Membership, MembershipStatus, MembershipTier, RenewalType } from '@issb/types';
import Card, { CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Table, { TableColumn } from '../../components/ui/Table';
import {
  CreditCard,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  MoreVertical
} from 'lucide-react';

interface MembershipFormData {
  userId: string;
  tier: MembershipTier;
  status: MembershipStatus;
  renewalType: RenewalType;
  autoRenew: boolean;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
}

interface MembershipStats {
  totalMemberships: number;
  activeMemberships: number;
  expiredMemberships: number;
  totalRevenue: number;
  monthlyRevenue: number;
  renewalsThisMonth: number;
}

const MembershipManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const permissions = usePermissionStore();
  
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<Membership[]>([]);
  const [stats, setStats] = useState<MembershipStats>({
    totalMemberships: 0,
    activeMemberships: 0,
    expiredMemberships: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    renewalsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [membershipForm, setMembershipForm] = useState<MembershipFormData>({
    userId: '',
    tier: MembershipTier.REGULAR,
    status: MembershipStatus.ACTIVE,
    renewalType: RenewalType.ANNUAL,
    autoRenew: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: 0,
    currency: 'USD'
  });

  useEffect(() => {
    loadMemberships();
  }, []);

  useEffect(() => {
    filterMemberships();
  }, [memberships, searchTerm]);

  const loadMemberships = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockMemberships: Membership[] = [
        {
          id: '1',
          userId: 'user-1',
          tier: MembershipTier.REGULAR,
          status: MembershipStatus.ACTIVE,
          startDate: new Date('2023-01-15'),
          endDate: new Date('2024-01-15'),
          renewalType: RenewalType.ANNUAL,
          autoRenew: true,
          paymentMethod: 'credit_card',
          lastPaymentDate: new Date('2023-01-15'),
          nextPaymentDate: new Date('2024-01-15'),
          amount: 99.99,
          currency: 'USD',
          benefits: ['Basic access', 'Monthly newsletter', 'Community forum'],
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-12-01')
        },
        {
          id: '2',
          userId: 'user-2',
          tier: MembershipTier.BOARD,
          status: MembershipStatus.ACTIVE,
          startDate: new Date('2023-06-01'),
          endDate: new Date('2024-06-01'),
          renewalType: RenewalType.ANNUAL,
          autoRenew: false,
          paymentMethod: 'invoice',
          lastPaymentDate: new Date('2023-06-01'),
          nextPaymentDate: new Date('2024-06-01'),
          amount: 299.99,
          currency: 'USD',
          benefits: ['All benefits', 'Priority support', 'Exclusive events', 'Board resources'],
          createdAt: new Date('2023-06-01'),
          updatedAt: new Date('2023-11-15')
        },
        {
          id: '3',
          userId: 'user-3',
          tier: MembershipTier.ADMIN,
          status: MembershipStatus.ACTIVE,
          startDate: new Date('2023-01-01'),
          endDate: new Date('2024-01-01'),
          renewalType: RenewalType.ANNUAL,
          autoRenew: true,
          paymentMethod: 'credit_card',
          lastPaymentDate: new Date('2023-01-01'),
          nextPaymentDate: new Date('2024-01-01'),
          amount: 499.99,
          currency: 'USD',
          benefits: ['All benefits', 'Admin access', 'System management', 'Full support'],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-12-10')
        },
        {
          id: '4',
          userId: 'user-4',
          tier: MembershipTier.REGULAR,
          status: MembershipStatus.EXPIRED,
          startDate: new Date('2022-01-15'),
          endDate: new Date('2023-01-15'),
          renewalType: RenewalType.ANNUAL,
          autoRenew: false,
          paymentMethod: 'credit_card',
          lastPaymentDate: new Date('2022-01-15'),
          amount: 99.99,
          currency: 'USD',
          benefits: ['Basic access', 'Monthly newsletter', 'Community forum'],
          createdAt: new Date('2022-01-15'),
          updatedAt: new Date('2023-01-15')
        }
      ];
      
      setMemberships(mockMemberships);
      
      // Calculate stats
      const totalMemberships = mockMemberships.length;
      const activeMemberships = mockMemberships.filter(m => m.status === MembershipStatus.ACTIVE).length;
      const expiredMemberships = mockMemberships.filter(m => m.status === MembershipStatus.EXPIRED).length;
      const totalRevenue = mockMemberships.reduce((sum, m) => sum + m.amount, 0);
      const monthlyRevenue = totalRevenue / 12; // Approximate monthly
      
      setStats({
        totalMemberships,
        activeMemberships,
        expiredMemberships,
        totalRevenue,
        monthlyRevenue,
        renewalsThisMonth: mockMemberships.filter(m => 
          m.nextPaymentDate && new Date(m.nextPaymentDate).getMonth() === new Date().getMonth()
        ).length
      });
      
    } catch (error) {
      console.error('Failed to load memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMemberships = () => {
    let filtered = [...memberships];
    
    if (searchTerm) {
      filtered = filtered.filter(membership =>
        membership.tier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        membership.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        membership.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredMemberships(filtered);
  };

  const handleCreateMembership = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMembership: Membership = {
        id: String(memberships.length + 1),
        ...membershipForm,
        startDate: new Date(membershipForm.startDate),
        endDate: new Date(membershipForm.endDate),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setMemberships([...memberships, newMembership]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create membership:', error);
    }
  };

  const handleEditMembership = async () => {
    if (!selectedMembership) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedMemberships = memberships.map(membership =>
        membership.id === selectedMembership.id 
          ? { 
              ...membership, 
              ...membershipForm,
              startDate: new Date(membershipForm.startDate),
              endDate: new Date(membershipForm.endDate),
              updatedAt: new Date() 
            }
          : membership
      );
      
      setMemberships(updatedMemberships);
      setShowEditModal(false);
      setSelectedMembership(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update membership:', error);
    }
  };

  const handleRenewMembership = async () => {
    if (!selectedMembership) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const renewalPeriod = selectedMembership.renewalType === RenewalType.MONTHLY ? 30 :
                           selectedMembership.renewalType === RenewalType.QUARTERLY ? 90 :
                           selectedMembership.renewalType === RenewalType.ANNUAL ? 365 : 365;
      
      const newEndDate = new Date(selectedMembership.endDate);
      newEndDate.setDate(newEndDate.getDate() + renewalPeriod);
      
      const updatedMemberships = memberships.map(membership =>
        membership.id === selectedMembership.id 
          ? {
              ...membership,
              endDate: newEndDate,
              status: MembershipStatus.ACTIVE,
              lastPaymentDate: new Date(),
              nextPaymentDate: new Date(newEndDate.getTime() + renewalPeriod * 24 * 60 * 60 * 1000),
              updatedAt: new Date()
            }
          : membership
      );
      
      setMemberships(updatedMemberships);
      setShowRenewModal(false);
      setSelectedMembership(null);
    } catch (error) {
      console.error('Failed to renew membership:', error);
    }
  };

  const resetForm = () => {
    setMembershipForm({
      userId: '',
      tier: MembershipTier.REGULAR,
      status: MembershipStatus.ACTIVE,
      renewalType: RenewalType.ANNUAL,
      autoRenew: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 0,
      currency: 'USD'
    });
  };

  const openEditModal = (membership: Membership) => {
    setSelectedMembership(membership);
    setMembershipForm({
      userId: membership.userId,
      tier: membership.tier,
      status: membership.status,
      renewalType: membership.renewalType,
      autoRenew: membership.autoRenew,
      startDate: membership.startDate.toISOString().split('T')[0],
      endDate: membership.endDate.toISOString().split('T')[0],
      amount: membership.amount,
      currency: membership.currency
    });
    setShowEditModal(true);
  };

  const openViewModal = (membership: Membership) => {
    setSelectedMembership(membership);
    setShowViewModal(true);
  };

  const openRenewModal = (membership: Membership) => {
    setSelectedMembership(membership);
    setShowRenewModal(true);
  };

  const getStatusBadge = (status: MembershipStatus) => {
    const styles = {
      [MembershipStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [MembershipStatus.EXPIRED]: 'bg-red-100 text-red-800',
      [MembershipStatus.SUSPENDED]: 'bg-yellow-100 text-yellow-800',
      [MembershipStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
      [MembershipStatus.PENDING]: 'bg-blue-100 text-blue-800'
    };

    const icons = {
      [MembershipStatus.ACTIVE]: <CheckCircle className="w-3 h-3" />,
      [MembershipStatus.EXPIRED]: <XCircle className="w-3 h-3" />,
      [MembershipStatus.SUSPENDED]: <AlertTriangle className="w-3 h-3" />,
      [MembershipStatus.CANCELLED]: <XCircle className="w-3 h-3" />,
      [MembershipStatus.PENDING]: <Clock className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        <span className="capitalize">{status}</span>
      </span>
    );
  };

  const getTierBadge = (tier: MembershipTier) => {
    const styles = {
      [MembershipTier.REGULAR]: 'bg-blue-100 text-blue-800',
      [MembershipTier.BOARD]: 'bg-purple-100 text-purple-800',
      [MembershipTier.ADMIN]: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[tier]}`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const isExpiringSoon = (endDate: Date) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return new Date(endDate) <= thirtyDaysFromNow && new Date(endDate) > now;
  };

  const membershipColumns: TableColumn<Membership>[] = [
    {
      key: 'user',
      title: 'User ID',
      dataIndex: 'userId',
      render: (userId) => (
        <span className="font-medium text-gray-900">{userId}</span>
      )
    },
    {
      key: 'tier',
      title: 'Tier',
      dataIndex: 'tier',
      render: getTierBadge,
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
      key: 'amount',
      title: 'Amount',
      dataIndex: 'amount',
      render: (amount, membership) => formatCurrency(amount, membership.currency),
      width: '100px'
    },
    {
      key: 'startDate',
      title: 'Start Date',
      dataIndex: 'startDate',
      render: (date) => new Date(date).toLocaleDateString(),
      width: '120px'
    },
    {
      key: 'endDate',
      title: 'End Date',
      dataIndex: 'endDate',
      render: (date, membership) => {
        const isExpiring = isExpiringSoon(date);
        return (
          <div className="flex items-center space-x-1">
            <span className={isExpiring ? 'text-orange-600 font-medium' : ''}>
              {new Date(date).toLocaleDateString()}
            </span>
            {isExpiring && <AlertTriangle className="w-3 h-3 text-orange-500" />}
          </div>
        );
      },
      width: '140px'
    },
    {
      key: 'autoRenew',
      title: 'Auto-Renew',
      dataIndex: 'autoRenew',
      render: (autoRenew) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          autoRenew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {autoRenew ? 'Yes' : 'No'}
        </span>
      ),
      width: '100px'
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      render: (_, membership) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => openViewModal(membership)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => openEditModal(membership)}
          />
          {membership.status === MembershipStatus.ACTIVE && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => openRenewModal(membership)}
            />
          )}
        </div>
      )
    }
  ];

  const hasWritePermission = permissions.hasPermission(currentUser!, 'user:write');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Membership Management</h1>
          <p className="text-gray-600 mt-1">
            Manage memberships, renewals, and billing
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            Export Report
          </Button>
          {hasWritePermission && (
            <Button 
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Membership
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Memberships</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMemberships}</p>
              <p className="text-sm text-green-600 mt-1">
                {Math.round((stats.activeMemberships / stats.totalMemberships) * 100)}% active
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeMemberships}</p>
              <p className="text-sm text-green-600 mt-1">
                +{Math.floor(stats.activeMemberships * 0.05)} this month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue, 'USD')}</p>
              <p className="text-sm text-purple-600 mt-1">
                {stats.renewalsThisMonth} renewals this month
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-3xl font-bold text-gray-900">{stats.expiredMemberships}</p>
              <p className="text-sm text-red-600 mt-1">
                Need attention
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search memberships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
            Advanced Filters
          </Button>
        </div>
      </Card>

      {/* Memberships Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            columns={membershipColumns}
            data={filteredMemberships}
            loading={loading}
            selection={{
              selectedRowKeys: selectedMemberships,
              onChange: setSelectedMemberships
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

      {/* Create Membership Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Membership"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <Input
                value={membershipForm.userId}
                onChange={(e) => setMembershipForm({...membershipForm, userId: e.target.value})}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={membershipForm.tier}
                onChange={(e) => setMembershipForm({...membershipForm, tier: e.target.value as MembershipTier})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={MembershipTier.REGULAR}>Regular</option>
                <option value={MembershipTier.BOARD}>Board</option>
                <option value={MembershipTier.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={membershipForm.startDate}
                onChange={(e) => setMembershipForm({...membershipForm, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                value={membershipForm.endDate}
                onChange={(e) => setMembershipForm({...membershipForm, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Type</label>
              <select
                value={membershipForm.renewalType}
                onChange={(e) => setMembershipForm({...membershipForm, renewalType: e.target.value as RenewalType})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={RenewalType.MONTHLY}>Monthly</option>
                <option value={RenewalType.QUARTERLY}>Quarterly</option>
                <option value={RenewalType.ANNUAL}>Annual</option>
                <option value={RenewalType.LIFETIME}>Lifetime</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={membershipForm.amount}
                onChange={(e) => setMembershipForm({...membershipForm, amount: parseFloat(e.target.value)})}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={membershipForm.autoRenew}
                onChange={(e) => setMembershipForm({...membershipForm, autoRenew: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable auto-renewal</span>
            </label>
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
            <Button onClick={handleCreateMembership}>
              Create Membership
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Membership Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMembership(null);
          resetForm();
        }}
        title="Edit Membership"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <Input
                value={membershipForm.userId}
                onChange={(e) => setMembershipForm({...membershipForm, userId: e.target.value})}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={membershipForm.tier}
                onChange={(e) => setMembershipForm({...membershipForm, tier: e.target.value as MembershipTier})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={MembershipTier.REGULAR}>Regular</option>
                <option value={MembershipTier.BOARD}>Board</option>
                <option value={MembershipTier.ADMIN}>Admin</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={membershipForm.startDate}
                onChange={(e) => setMembershipForm({...membershipForm, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                value={membershipForm.endDate}
                onChange={(e) => setMembershipForm({...membershipForm, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Type</label>
              <select
                value={membershipForm.renewalType}
                onChange={(e) => setMembershipForm({...membershipForm, renewalType: e.target.value as RenewalType})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={RenewalType.MONTHLY}>Monthly</option>
                <option value={RenewalType.QUARTERLY}>Quarterly</option>
                <option value={RenewalType.ANNUAL}>Annual</option>
                <option value={RenewalType.LIFETIME}>Lifetime</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <Input
                type="number"
                step="0.01"
                value={membershipForm.amount}
                onChange={(e) => setMembershipForm({...membershipForm, amount: parseFloat(e.target.value)})}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={membershipForm.autoRenew}
                onChange={(e) => setMembershipForm({...membershipForm, autoRenew: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable auto-renewal</span>
            </label>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedMembership(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditMembership}>
              Update Membership
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Membership Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedMembership(null);
        }}
        title="Membership Details"
        size="lg"
      >
        {selectedMembership && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Membership Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User ID:</span>
                    <span className="text-sm font-medium">{selectedMembership.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tier:</span>
                    {getTierBadge(selectedMembership.tier)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    {getStatusBadge(selectedMembership.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount:</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedMembership.amount, selectedMembership.currency)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Dates & Renewal</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Start Date:</span>
                    <span className="text-sm font-medium">{selectedMembership.startDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">End Date:</span>
                    <span className="text-sm font-medium">{selectedMembership.endDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Renewal Type:</span>
                    <span className="text-sm font-medium capitalize">{selectedMembership.renewalType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Auto-Renew:</span>
                    <span className="text-sm font-medium">{selectedMembership.autoRenew ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedMembership.benefits && selectedMembership.benefits.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Benefits</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedMembership.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-gray-600">{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedMembership);
                }}
              >
                Edit Membership
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Renew Membership Modal */}
      <Modal
        isOpen={showRenewModal}
        onClose={() => {
          setShowRenewModal(false);
          setSelectedMembership(null);
        }}
        title="Renew Membership"
        size="md"
      >
        {selectedMembership && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <RefreshCw className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Renew Membership</h3>
                <p className="text-gray-600 mt-1">
                  This will extend the membership by one renewal period.
                </p>
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm">
                    <strong>User ID:</strong> {selectedMembership.userId}
                  </p>
                  <p className="text-sm">
                    <strong>Tier:</strong> {selectedMembership.tier}
                  </p>
                  <p className="text-sm">
                    <strong>Current End Date:</strong> {selectedMembership.endDate.toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <strong>Amount:</strong> {formatCurrency(selectedMembership.amount, selectedMembership.currency)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRenewModal(false);
                  setSelectedMembership(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleRenewMembership}>
                Renew Membership
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MembershipManagement;