import React, { useEffect, useState } from 'react';
import { Heart, DollarSign, TrendingUp } from 'lucide-react';
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
    purpose: '',
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Donations Portal</h1>
          <p className="text-gray-600 mt-2">Support ISSB community initiatives</p>
        </div>
        <button
          onClick={() => setShowDonateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          <Heart className="w-4 h-4 mr-2" />
          Make a Donation
        </button>
      </div>

      {/* Donation Impact */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg shadow-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Your Impact</h2>
        {user ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold">${totalDonated.toFixed(2)}</div>
              <div className="text-red-100">Total Donated</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{donations.length}</div>
              <div className="text-red-100">Donations Made</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {donations.filter(d => d.donation_type === 'recurring').length}
              </div>
              <div className="text-red-100">Recurring Donations</div>
            </div>
          </div>
        ) : (
          <p className="text-lg">Sign in to track your donation history</p>
        )}
      </div>

      {/* Donation Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Ways to Give</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-red-500 transition">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">One-Time Donation</h3>
            <p className="text-gray-600 mb-4">Make a single contribution to support our programs</p>
            <button
              onClick={() => setShowDonateModal(true)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Donate Now
            </button>
          </div>

          <div className="border-2 border-red-500 bg-red-50 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-200 rounded-lg mb-4">
              <TrendingUp className="w-6 h-6 text-red-700" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Monthly Giving</h3>
            <p className="text-gray-700 mb-4">Provide sustained support with automatic monthly donations</p>
            <button
              onClick={() => setShowDonateModal(true)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Set Up Monthly
            </button>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-red-500 transition">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Corporate Matching</h3>
            <p className="text-gray-600 mb-4">Double your impact with employer matching programs</p>
            <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
              Learn More
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
                    <td className="px-6 py-4 text-sm text-gray-900">{donation.purpose || 'General'}</td>
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
              Note: This is a demo. Payment processing will be implemented with Stripe integration.
            </p>
            <div className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose (Optional)</label>
                <input
                  type="text"
                  value={donationForm.purpose}
                  onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Education Fund"
                />
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
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
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
