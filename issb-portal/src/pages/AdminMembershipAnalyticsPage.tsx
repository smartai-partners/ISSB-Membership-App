import React from 'react';
import { useGetMembershipAnalyticsQuery } from '@/store/api/membershipApi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Loader2,
  CreditCard,
  HandHeart,
  Gift
} from 'lucide-react';

export const AdminMembershipAnalyticsPage: React.FC = () => {
  const { data: analytics, isLoading, error } = useGetMembershipAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Analytics</h1>
          <p className="text-gray-600">
            Failed to load membership analytics. Please check your permissions and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { summary, recentActivity } = analytics;

  const statsCards = [
    {
      title: 'Total Members',
      value: summary.totalSubscriptions,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Active memberships'
    },
    {
      title: 'Paid Members',
      value: summary.paidMemberships,
      icon: CreditCard,
      color: 'bg-green-500',
      description: 'Payment & donation-based'
    },
    {
      title: 'Monthly Revenue',
      value: `$${summary.monthlyRecurringRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      description: 'Recurring monthly'
    },
    {
      title: 'Annual Revenue',
      value: `$${summary.annualRecurringRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-teal-500',
      description: 'Projected yearly'
    }
  ];

  const activationMethodCards = [
    {
      name: 'Direct Payment',
      count: summary.activationCounts.payment,
      icon: CreditCard,
      color: 'bg-green-100 text-green-800',
      description: 'Paid $360 annually'
    },
    {
      name: 'Volunteer-Based',
      count: summary.activationCounts.volunteer,
      icon: HandHeart,
      color: 'bg-blue-100 text-blue-800',
      description: 'Earned through 30 hours'
    },
    {
      name: 'Donation-Based',
      count: summary.activationCounts.donation,
      icon: Gift,
      color: 'bg-purple-100 text-purple-800',
      description: 'Activated via $360+ donation'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Membership Analytics
          </h1>
          <p className="text-gray-600">
            Overview of Individual Membership ($360/year) subscriptions and revenue
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Activation Methods Breakdown */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Membership Activation Methods</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {activationMethodCards.map((method, index) => {
              const Icon = method.icon;
              return (
                <div key={index} className="p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 text-gray-600" />
                    <Badge className={method.color}>
                      {method.count} members
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{method.name}</h3>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {activity.action.replace(/_/g, ' ')}
                    </p>
                    {activity.to_tier && (
                      <p className="text-sm text-gray-600">
                        New Individual Membership
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    {activity.amount !== null && activity.amount !== undefined && (
                      <p className="font-semibold text-green-600">
                        ${activity.amount}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Revenue Projections */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Revenue Projections</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Current MRR</p>
              <p className="text-3xl font-bold text-blue-600">
                ${summary.monthlyRecurringRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">Monthly Recurring Revenue</p>
            </div>
            <div className="text-center p-6 bg-emerald-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Year 1 Target</p>
              <p className="text-3xl font-bold text-emerald-600">
                $180,000
              </p>
              <p className="text-sm text-gray-500 mt-2">500 paid members goal</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Year 3 Target</p>
              <p className="text-3xl font-bold text-purple-600">
                $1,800,000
              </p>
              <p className="text-sm text-gray-500 mt-2">5,000 paid members goal</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
