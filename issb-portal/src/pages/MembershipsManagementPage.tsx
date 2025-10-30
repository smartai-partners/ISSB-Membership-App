import React, { useEffect, useState } from 'react';
import { DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Membership } from '@/types';

export function MembershipsManagementPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!profile || !['admin', 'board'].includes(profile.role)) {
      navigate('/');
      return;
    }
    loadMemberships();
  }, [profile, navigate]);

  async function loadMemberships() {
    try {
      const { data } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setMemberships(data);
        
        // Calculate stats
        const active = data.filter(m => m.status === 'active').length;
        const expired = data.filter(m => m.status === 'expired').length;
        const totalRevenue = data
          .filter(m => m.payment_status === 'paid')
          .reduce((sum, m) => sum + m.amount, 0);

        setStats({
          total: data.length,
          active,
          expired,
          totalRevenue,
        });
      }
    } catch (error) {
      console.error('Error loading memberships:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRenewMembership(membershipId: string) {
    if (!confirm('Renew this membership for another year?')) return;

    try {
      const membership = memberships.find(m => m.id === membershipId);
      if (!membership) return;

      const newEndDate = new Date(membership.end_date);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);

      const { error } = await supabase
        .from('memberships')
        .update({
          end_date: newEndDate.toISOString().split('T')[0],
          status: 'active',
        })
        .eq('id', membershipId);

      if (error) throw error;
      loadMemberships();
    } catch (error) {
      console.error('Error renewing membership:', error);
      alert('Failed to renew membership');
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Membership Management</h1>
        <p className="text-gray-600 mt-2">Manage member subscriptions and renewals</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Memberships</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
          <div className="text-sm text-gray-600">Active Members</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-3">
            <Calendar className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.expired}</div>
          <div className="text-sm text-gray-600">Expired</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
      </div>

      {/* Memberships Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memberships.map((membership) => (
                <tr key={membership.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {membership.user_id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                      {membership.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        membership.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : membership.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {membership.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${membership.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(membership.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(membership.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        membership.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {membership.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {membership.status === 'expired' && (
                      <button
                        onClick={() => handleRenewMembership(membership.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Renew
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
