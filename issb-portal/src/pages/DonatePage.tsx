import React, { useState } from 'react';
import { Heart, Shield, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { EnhancedDonationForm, DonationSuccessModal } from '@/components/EnhancedDonationForm';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export function DonatePage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [donationAmount, setDonationAmount] = useState(0);
  const [donationCurrency, setDonationCurrency] = useState('usd');

  const handleSuccess = () => {
    setShowForm(false);
    setShowSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-2xl p-8 md:p-12 text-white mb-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Make a Difference</h1>
            <p className="text-xl text-green-100 mb-6">
              Your donation helps us serve the community and strengthen our mission
            </p>
            
            {/* Membership Benefit Highlight */}
            <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-6 mb-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-yellow-300 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Special Benefit: Donation Includes Membership!
                  </h3>
                  <p className="text-green-50">
                    When you donate <strong>$360 or more</strong>, the first $360 automatically covers your annual membership 
                    ($360 value), and the remainder goes toward your chosen cause. It's our way of saying thank you!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="px-8 py-4 bg-white text-green-700 rounded-lg hover:bg-green-50 font-bold text-lg shadow-xl transform hover:scale-105 transition flex items-center"
              >
                <Heart className="w-5 h-5 mr-2" />
                Donate Now
              </button>
              <Link
                to="/donations"
                className="px-8 py-4 bg-green-700 text-white rounded-lg hover:bg-green-800 font-bold text-lg shadow-xl transform hover:scale-105 transition"
              >
                View All Options
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600">
              All donations are processed securely through Stripe with bank-level encryption
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tax Deductible</h3>
            <p className="text-gray-600">
              ISSB is a 501(c)(3) organization. All donations are tax-deductible to the fullest extent of the law
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Transparent Impact</h3>
            <p className="text-gray-600">
              Track your giving history and see the real-world impact of your generosity
            </p>
          </div>
        </div>

        {/* Impact Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Impact</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">$50</div>
              <p className="text-gray-600">Provides meals for 2 families</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">$100</div>
              <p className="text-gray-600">Supports youth programs for a month</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">$250</div>
              <p className="text-gray-600">Funds community outreach initiatives</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
              <div className="text-4xl font-bold text-blue-600 mb-2">$360+</div>
              <p className="text-gray-700 font-semibold">Includes FREE Membership!</p>
              <p className="text-xs text-gray-600 mt-1">Plus supports chosen cause</p>
            </div>
          </div>
        </div>

        {/* Multi-Currency Support */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-12">
          <div className="flex items-start">
            <DollarSign className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">Multi-Currency Support</h3>
              <p className="text-blue-800">
                We accept donations in USD, EUR, GBP, and CAD. Choose your preferred currency during checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!showForm && (
          <div className="text-center">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-12 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold text-xl shadow-2xl transform hover:scale-105 transition"
            >
              <Heart className="mr-3 w-7 h-7" />
              Start Your Donation
            </button>
            <p className="text-gray-600 mt-4">
              Every contribution, no matter the size, makes a meaningful difference
            </p>
          </div>
        )}
      </div>

      {/* Donation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl my-8">
            <h3 className="text-3xl font-bold mb-6 text-gray-900">Complete Your Donation</h3>
            <EnhancedDonationForm 
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <DonationSuccessModal
          amount={donationAmount}
          currency={donationCurrency}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
}
