import React, { useEffect, useState } from 'react';
import { Heart, DollarSign, Building, BookOpen, Users as UsersIcon, TrendingUp, HandHeart, Target, Zap, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Donation } from '@/types';

export function DonationsPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
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

  async function handlePaymentSubmit() {
    setProcessing(true);
    setPaymentError(null);

    try {
      const amount = parseFloat(donationForm.amount);
      
      if (!amount || amount < 1) {
        throw new Error('Please enter a valid donation amount');
      }

      // Call the edge function to create payment intent
      const { data, error } = await supabase.functions.invoke('create-donation-payment', {
        body: {
          amount: amount,
          purpose: donationForm.purpose,
          donationType: donationForm.donation_type,
          donorEmail: donationForm.donor_email || user?.email,
          donorName: donationForm.donor_name || ''
        }
      });

      if (error) {
        // Check if Stripe is not configured
        if (error.message?.includes('STRIPE_NOT_CONFIGURED') || error.message?.includes('not configured')) {
          setPaymentError('Payment processing is not yet configured. Please contact the administrator to activate Stripe integration.');
        } else {
          throw error;
        }
        return;
      }

      if (data?.error) {
        if (data.error.code === 'STRIPE_NOT_CONFIGURED') {
          setPaymentError('Payment processing is not yet configured. Stripe API keys are required to activate this feature.');
        } else {
          throw new Error(data.error.message || 'Payment failed');
        }
        return;
      }

      // Success - in production, redirect to Stripe checkout or show success
      alert(`Payment intent created successfully!\n\nIn production, you would be redirected to Stripe checkout.\n\nPayment Intent ID: ${data?.data?.paymentIntentId}\nDonation ID: ${data?.data?.donationId}\n\nThank you for your generosity!`);
      
      // Close modal and refresh donations
      setShowDonateModal(false);
      setDonationForm({ ...donationForm, amount: '', purpose: 'general' });
      
      if (user) {
        loadMyDonations();
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'An error occurred while processing your donation');
    } finally {
      setProcessing(false);
    }
  }

  const donationCategories = [
    {
      id: 'zakat',
      title: 'Zakat',
      subtitle: 'Obligatory Charity',
      description: 'Fulfill your religious duty - Purify your wealth through Zakat',
      impact: '$100 helps 4 families in need',
      icon: Heart,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'sadaqah',
      title: 'Sadaqah',
      subtitle: 'Voluntary Charity',
      description: 'Give generously for Allah\'s pleasure and continuous reward',
      impact: '$50 provides meals for families',
      icon: HandHeart,
      color: 'emerald',
      bgGradient: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50',
      borderColor: 'border-emerald-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      id: 'building_fund',
      title: 'Building Fund',
      subtitle: 'Facility Development',
      description: 'Support mosque expansion and facility maintenance',
      impact: '$500 contributes to facility upgrades',
      icon: Building,
      color: 'teal',
      bgGradient: 'from-teal-500 to-cyan-500',
      bgLight: 'bg-teal-50',
      borderColor: 'border-teal-500',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-700',
      buttonColor: 'bg-teal-600 hover:bg-teal-700',
    },
    {
      id: 'education',
      title: 'Educational Programs',
      subtitle: 'Knowledge Investment',
      description: 'Fund Islamic education and youth development programs',
      impact: '$100 supports monthly youth programs',
      icon: BookOpen,
      color: 'cyan',
      bgGradient: 'from-cyan-500 to-blue-500',
      bgLight: 'bg-cyan-50',
      borderColor: 'border-cyan-500',
      iconBg: 'bg-cyan-100',
      iconColor: 'text-cyan-700',
      buttonColor: 'bg-cyan-600 hover:bg-cyan-700',
    },
    {
      id: 'community_services',
      title: 'Community Services',
      subtitle: 'Social Impact',
      description: 'Support community outreach and social welfare programs',
      impact: '$250 funds community initiatives',
      icon: UsersIcon,
      color: 'blue',
      bgGradient: 'from-blue-500 to-indigo-500',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'general',
      title: 'General Fund',
      subtitle: 'Operational Support',
      description: 'Support overall mosque operations and daily programs',
      impact: 'Every dollar helps daily operations',
      icon: DollarSign,
      color: 'indigo',
      bgGradient: 'from-indigo-500 to-purple-500',
      bgLight: 'bg-indigo-50',
      borderColor: 'border-indigo-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    },
  ];

  function handleDonateClick(category: typeof donationCategories[0]) {
    setSelectedCategory(category.id);
    setDonationForm({ ...donationForm, purpose: category.id });
    setShowDonateModal(true);
  }

  const quickAmounts = [25, 50, 100, 250, 500, 1000];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-2xl p-8 md:p-12 text-white">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Donation Portal</h1>
          <p className="text-2xl text-amber-100 mb-6">
            Your contribution multiplies rewards and strengthens our community
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-lg text-amber-50">
              "The example of those who spend their wealth in the way of Allah is like a seed of grain that sprouts seven ears; 
              in every ear there are a hundred grains. Allah multiplies for whom He wills." - Quran 2:261
            </p>
          </div>
        </div>
      </div>

      {/* Urgency & Social Proof */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Fundraising Goal */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-amber-500">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 text-amber-600 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Ramadan Building Fund</h3>
              <p className="text-sm text-gray-600">Help us reach our goal!</p>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-bold text-amber-600">$125,000</span>
              <span className="text-sm text-gray-600">of $150,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-4 rounded-full" style={{ width: '83%' }}></div>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            <span className="font-semibold text-amber-700">$25,000 remaining!</span> 185 donors have contributed this month.
          </p>
          <button
            onClick={() => handleDonateClick(donationCategories[2])}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-bold"
          >
            Contribute Now
          </button>
        </div>

        {/* Your Impact (if logged in) */}
        {user ? (
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 mr-3" />
              <h3 className="text-lg font-bold">Your Generosity</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-3xl font-bold">${totalDonated.toFixed(0)}</div>
                <div className="text-sm text-green-100">Total Given</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{donations.length}</div>
                <div className="text-sm text-green-100">Donations</div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {donations.filter(d => d.donation_type === 'recurring').length}
                </div>
                <div className="text-sm text-green-100">Monthly</div>
              </div>
            </div>
            <p className="text-green-100 mt-4 text-sm">May Allah multiply your rewards</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center mb-4">
              <Heart className="w-8 h-8 mr-3" />
              <h3 className="text-lg font-bold">Community Impact</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-green-100">This Month</span>
                <span className="text-2xl font-bold">$45,200</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-100">Active Donors</span>
                <span className="text-2xl font-bold">185</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-100">Monthly Supporters</span>
                <span className="text-2xl font-bold">67</span>
              </div>
            </div>
            <Link
              to="/login"
              className="mt-4 block text-center py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition font-semibold"
            >
              Sign in to track your impact
            </Link>
          </div>
        )}
      </div>

      {/* Impact Calculator */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-200">
        <div className="flex items-start">
          <Zap className="w-8 h-8 text-purple-600 mr-4 mt-1" />
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">See Your Impact</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-xl font-bold text-purple-600">$50</div>
                <div className="text-sm text-gray-700 mt-1">Provides meals for 2 families</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-xl font-bold text-purple-600">$100</div>
                <div className="text-sm text-gray-700 mt-1">Supports youth programs for a month</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-xl font-bold text-purple-600">$250</div>
                <div className="text-sm text-gray-700 mt-1">Funds community outreach initiatives</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-xl font-bold text-purple-600">$500+</div>
                <div className="text-sm text-gray-700 mt-1">Contributes to facility upgrades</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Categories - Enhanced Cards */}
      <div>
        <h2 className="text-3xl font-bold mb-2 text-gray-900 text-center">Choose Your Sadaqah Category</h2>
        <p className="text-gray-600 text-center mb-8">Every donation makes a lasting impact</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donationCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className={`${category.bgLight} border-2 ${category.borderColor} rounded-xl p-6 hover:shadow-2xl transition transform hover:scale-105 relative overflow-hidden group`}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center justify-center w-14 h-14 ${category.iconBg} rounded-xl`}>
                      <Icon className={`w-7 h-7 ${category.iconColor}`} />
                    </div>
                    <span className={`text-xs font-bold ${category.iconColor} uppercase tracking-wide`}>
                      {category.subtitle}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">{category.title}</h3>
                  <p className="text-gray-700 mb-3 leading-relaxed">{category.description}</p>
                  
                  <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-700">{category.impact}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDonateClick(category)}
                    className={`w-full py-3 text-white rounded-lg font-bold shadow-md ${category.buttonColor} transform group-hover:scale-105 transition`}
                  >
                    Donate Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recurring Donation - Emphasized */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <TrendingUp className="w-10 h-10" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-bold mb-2">Become a Sustaining Donor</h3>
            <p className="text-green-100 text-lg mb-4">
              Set up monthly recurring donations to provide consistent support. Recurring donations help us plan better 
              and ensure continuous service to the community.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-sm text-green-100">Monthly</div>
                <div className="text-xl font-bold">$25/month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-sm text-green-100">Monthly</div>
                <div className="text-xl font-bold">$50/month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-sm text-green-100">Monthly</div>
                <div className="text-xl font-bold">$100/month</div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => {
                setDonationForm({ ...donationForm, donation_type: 'recurring' });
                setShowDonateModal(true);
              }}
              className="px-8 py-4 bg-white text-green-700 rounded-lg hover:bg-green-50 font-bold text-lg shadow-xl transform hover:scale-105 transition"
            >
              Set Up Monthly Donation
            </button>
          </div>
        </div>
      </div>

      {/* Tax Information */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
        <div className="flex items-start">
          <Shield className="w-6 h-6 text-blue-600 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">Tax-Deductible Donations</h3>
            <p className="text-blue-800">
              ISSB is a 501(c)(3) non-profit organization. All donations are tax-deductible to the extent permitted by law. 
              You will receive a receipt for your records after each donation.
            </p>
          </div>
        </div>
      </div>

      {/* Donor Recognition */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-900 text-center">Recent Donors (Last 24 Hours)</h3>
        <div className="space-y-3 max-w-3xl mx-auto">
          {[
            { name: 'Anonymous', amount: 500, time: '2 hours ago', purpose: 'Building Fund' },
            { name: 'Ahmed M.', amount: 100, time: '5 hours ago', purpose: 'Zakat' },
            { name: 'Fatima K.', amount: 250, time: '8 hours ago', purpose: 'Education' },
            { name: 'Anonymous', amount: 150, time: '12 hours ago', purpose: 'General Fund' },
            { name: 'Omar S.', amount: 75, time: '18 hours ago', purpose: 'Sadaqah' },
          ].map((donor, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Heart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{donor.name}</div>
                  <div className="text-sm text-gray-600">{donor.purpose}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">${donor.amount}</div>
                <div className="text-xs text-gray-500">{donor.time}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 mt-6">
          Join these generous donors and be part of building our community
        </p>
      </div>

      {/* My Donations History */}
      {user && donations.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Donation History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">${donation.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {donation.donation_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                      {donation.purpose?.replace('_', ' ') || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          donation.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : donation.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {donation.payment_status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {donation.payment_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-amber-700 to-orange-700 rounded-xl shadow-2xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Every Donation Makes a Difference</h2>
        <p className="text-amber-100 text-lg mb-6">
          Your generosity today creates lasting impact for our community tomorrow
        </p>
        <button
          onClick={() => setShowDonateModal(true)}
          className="inline-flex items-center px-10 py-4 bg-white text-amber-700 rounded-lg hover:bg-amber-50 font-bold text-xl shadow-xl transform hover:scale-105 transition"
        >
          <Heart className="mr-3 w-6 h-6" />
          Make a Donation Today
          <ArrowRight className="ml-3 w-6 h-6" />
        </button>
      </div>

      {/* Donation Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Make a Donation</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Donation Purpose</label>
                <select
                  value={donationForm.purpose}
                  onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {donationCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title} - {cat.subtitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Amount Selection</label>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDonationForm({ ...donationForm, amount: amount.toString() })}
                      className={`py-3 rounded-lg font-semibold transition ${
                        donationForm.amount === amount.toString()
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <input
                    type="number"
                    min="1"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter custom amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Donation Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDonationForm({ ...donationForm, donation_type: 'one_time' })}
                    className={`py-3 rounded-lg font-semibold transition ${
                      donationForm.donation_type === 'one_time'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    One-Time
                  </button>
                  <button
                    onClick={() => setDonationForm({ ...donationForm, donation_type: 'recurring' })}
                    className={`py-3 rounded-lg font-semibold transition ${
                      donationForm.donation_type === 'recurring'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {donationForm.amount && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-green-900">Your Impact</span>
                  </div>
                  <p className="text-sm text-green-800">
                    {donationCategories.find(c => c.id === donationForm.purpose)?.impact || 'Supporting our community programs'}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Your donation is tax-deductible. You will receive a receipt via email.
                </p>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-semibold">Payment Error:</p>
                  <p className="text-sm text-red-700 mt-1">{paymentError}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  {processing ? 'Processing your donation...' : 'Secure payment processing via Stripe'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowDonateModal(false);
                    setDonationForm({ ...donationForm, amount: '', purpose: 'general' });
                    setPaymentError(null);
                  }}
                  disabled={processing}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={!donationForm.amount || parseFloat(donationForm.amount) < 1 || processing}
                  className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
