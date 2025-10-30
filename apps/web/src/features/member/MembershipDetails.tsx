import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import { MembershipDetails as MembershipDetailsType, PaymentRecord, TierChange } from './types';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  FileText,
  RefreshCw
} from 'lucide-react';

const MembershipDetails: React.FC = () => {
  const { user } = useAuthStore();
  const [membership, setMembership] = useState<MembershipDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'history'>('overview');

  useEffect(() => {
    if (user) {
      fetchMembershipDetails();
    }
  }, [user]);

  const fetchMembershipDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMembership: MembershipDetailsType = {
        id: 'membership-001',
        memberId: user!.id,
        tier: 'gold',
        status: 'active',
        joinDate: '2023-01-15',
        renewalDate: '2024-01-15',
        benefits: [
          'Access to all member events',
          'Priority registration for workshops',
          'Monthly newsletter subscription',
          'Networking opportunities',
          'Member directory access',
          'Resource library access'
        ],
        perks: [
          '25% discount on merchandise',
          'Free admission to quarterly social events',
          'Exclusive member-only webinars',
          'Early access to new programs',
          'Referral rewards program',
          'Complimentary parking at events'
        ],
        nextPayment: {
          amount: 299.99,
          date: '2024-01-15'
        },
        paymentHistory: [
          {
            id: 'payment-001',
            date: '2023-01-15',
            amount: 299.99,
            status: 'completed',
            description: 'Gold Membership - Annual Fee',
            method: 'credit-card'
          },
          {
            id: 'payment-002',
            date: '2022-01-15',
            amount: 279.99,
            status: 'completed',
            description: 'Gold Membership - Annual Fee',
            method: 'bank-transfer'
          }
        ],
        tierHistory: [
          {
            id: 'tier-change-001',
            fromTier: 'silver',
            toTier: 'gold',
            changedAt: '2022-06-01',
            reason: 'Upgraded for additional benefits',
            approvedBy: 'admin'
          },
          {
            id: 'tier-change-002',
            fromTier: 'bronze',
            toTier: 'silver',
            changedAt: '2021-12-01',
            reason: 'Automatic upgrade after 6 months',
            approvedBy: 'system'
          }
        ]
      };
      
      setMembership(mockMembership);
    } catch (error) {
      setError('Failed to load membership details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    return <Crown size={24} className="text-yellow-500" />;
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100',
      silver: 'border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100',
      gold: 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-yellow-100',
      platinum: 'border-purple-300 bg-gradient-to-r from-purple-50 to-purple-100'
    };
    return colors[tier as keyof typeof colors] || 'border-gray-300 bg-gray-50';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-700 bg-green-100',
      inactive: 'text-gray-700 bg-gray-100',
      suspended: 'text-red-700 bg-red-100',
      pending: 'text-yellow-700 bg-yellow-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading membership details...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchMembershipDetails}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </Card>
        </div>
      </div>
    );
  }

  if (!membership) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Membership Details</h1>
          <button
            onClick={fetchMembershipDetails}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Membership Overview Card */}
        <Card variant="elevated" className={`border-2 ${getTierColor(membership.tier)}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {getTierIcon(membership.tier)}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {membership.tier.charAt(0).toUpperCase() + membership.tier.slice(1)} Membership
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(membership.status)}`}>
                      {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Since {new Date(membership.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {membership.nextPayment && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Next Payment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(membership.nextPayment.amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Due {new Date(membership.nextPayment.date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'payments', label: 'Payment History', icon: CreditCard },
              { id: 'history', label: 'Tier History', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Benefits */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-500" />
                  Membership Benefits
                </h3>
                <ul className="space-y-3">
                  {membership.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Perks */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown size={20} className="text-yellow-500" />
                  Member Perks
                </h3>
                <ul className="space-y-3">
                  {membership.perks.map((perk, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Crown size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'payments' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-500" />
                Payment History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Method</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membership.paymentHistory.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{payment.description}</td>
                        <td className="py-3 px-4 text-gray-900 font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-4 text-gray-700 capitalize">
                          {payment.method.replace('-', ' ')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getPaymentStatusIcon(payment.status)}
                            <span className="capitalize text-sm">{payment.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-500" />
                Tier Change History
              </h3>
              <div className="space-y-4">
                {membership.tierHistory.map((change) => (
                  <div key={change.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {change.fromTier.charAt(0).toUpperCase() + change.fromTier.slice(1)}
                        </span>
                        <TrendingUp size={16} className="text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {change.toTier.charAt(0).toUpperCase() + change.toTier.slice(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(change.changedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{change.reason}</p>
                    <p className="text-xs text-gray-500">Approved by {change.approvedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MembershipDetails;