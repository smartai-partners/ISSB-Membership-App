import React, { useEffect, useState } from 'react';
import { Heart, DollarSign, Building, BookOpen, Users as UsersIcon, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Donation } from '@/types';

export function DonationsPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    amount: '',
    donor_name: '',
    donor_email: '',
    donation_type: 'one_time' as 'one_time' | 'recurring',
    purpose: 'general' as string,
  });

  useEffect(() => {
    if (user) {
      loadMyDonations();
    }
  }, [user]);

  async function loadMyDonations() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('donations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setDonations(data);
        const total = data.reduce((sum, d) => sum + d.amount, 0);
        setTotalDonated(total);
      }
    } catch (error) {
      console.error('Error loading donations:', error);
    }
  }

  const donationCategories = [
    {
      id: 'zakat',
      title: 'Zakat',
      description: 'Obligatory charity - Fulfill your religious duty of Zakat',
      icon: Heart,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'sadaqah',
      title: 'Sadaqah',
      description: 'Voluntary charity - Give generously for Allah\'s pleasure',
      icon: Heart,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      id: 'building_fund',
      title: 'Building Fund',
      description: 'Support mosque expansion and facility maintenance',
      icon: Building,
      color: 'teal',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-500',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-700',
      buttonColor: 'bg-teal-600 hover:bg-teal-700',
    },
    {
      id: 'education',
      title: 'Educational Programs',
      description: 'Fund Islamic education and youth programs',
      icon: BookOpen,
      color: 'cyan',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-500',
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-700',
      buttonColor: 'bg-cyan-600 hover:bg-cyan-700',
    },
    {
      id: 'community_services',
      title: 'Community Services',
      description: 'Support community outreach and social services',
      icon: UsersIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'general',
      title: 'General Fund',
      description: 'Support overall mosque operations and programs',
      icon: DollarSign,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    },
  ];

  function handleDonateClick(purpose: string) {
    setDonationForm({ ...donationForm, purpose });
    setShowDonateModal(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donations Portal</h1>
          <p className="text-gray-600 mt-2">Support ISSB mosque and community services</p>
        </div>
      </div>

      {/* Islamic Giving Reminder */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-3">The Virtue of Giving</h2>
        <p className="text-green-50 text-lg">
          "The example of those who spend their wealth in the way of Allah is like a seed of grain that sprouts seven ears; 
          in every ear there are a hundred grains. Allah multiplies for whom He wills." (Quran 2:261)
        </p>
      </div>

      {/* Donation Impact */}
      {user && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Your Contribution</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold">${totalDonated.toFixed(2)}</div>
              <div className="text-green-100">Total Donated</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{donations.length}</div>
              <div className="text-green-100">Donations Made</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {donations.filter(d => d.donation_type === 'recurring').length}
              </div>
              <div className="text-green-100">Recurring Donations</div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Categories */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6">Support Our Mission</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donationCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className={`border-2 ${category.borderColor} ${category.bgColor} rounded-lg p-6 hover:shadow-lg transition`}
              >
                <div className={`flex items-center justify-center w-12 h-12 ${category.iconBg} rounded-lg mb-4`}>
                  <Icon className={`w-6 h-6 ${category.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{category.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
                <button
                  onClick={() => handleDonateClick(category.id)}
                  className={`w-full px-4 py-2 text-white rounded-md ${category.buttonColor}`}
                >
                  Donate Now
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recurring Donation Option */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-green-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Become a Sustaining Donor</h3>
            <p className="text-gray-600 mb-4">
              Set up monthly recurring donations to provide consistent support for our programs and operations.
              Recurring donations help us plan better and ensure continuous service to the community.
            </p>
            <button
              onClick={() => {
                setDonationForm({ ...donationForm, donation_type: 'recurring' });
                setShowDonateModal(true);
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Set Up Monthly Donation
            </button>
          </div>
        </div>
      </div>

      {/* My Donations History */}
      {user && donations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Donation History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donations.map((donation) => (
                  <tr key={donation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${donation.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {donation.donation_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                      {donation.purpose?.replace('_', ' ') || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          donation.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : donation.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {donation.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Make a Donation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Note: Payment processing will be implemented with Stripe integration.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donation Purpose</label>
                <select
                  value={donationForm.purpose}
                  onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {donationCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  min="1"
                  value={donationForm.amount}
                  onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type</label>
                <select
                  value={donationForm.donation_type}
                  onChange={(e) => setDonationForm({ ...donationForm, donation_type: e.target.value as 'one_time' | 'recurring' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="one_time">One-Time</option>
                  <option value="recurring">Monthly Recurring</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Payment processing will be implemented with Stripe');
                    setShowDonateModal(false);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
