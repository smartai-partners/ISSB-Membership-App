import React, { useState } from 'react';
import { Plus, HandHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { OpportunityBrowser, VolunteerDashboard, HourLogForm } from '@/features/volunteers';

export function VolunteersPage() {
  const { user } = useAuth();
  const [showLogModal, setShowLogModal] = useState(false);
  const [activeView, setActiveView] = useState<'opportunities' | 'dashboard'>('opportunities');

  if (!user) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <HandHeart className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Join Our Volunteer Community</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Sign in to access volunteer opportunities, track your impact, and connect with fellow community members.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center px-6 py-3 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-semibold"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-2xl p-8 md:p-12 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Volunteer Portal</h1>
            <p className="text-xl text-green-100">
              Make a real difference in your community. Every hour counts.
            </p>
            <p className="text-green-200 mt-2">
              "The believer's shade on the Day of Resurrection will be their charity." - Hadith (Tirmidhi)
            </p>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center px-8 py-4 bg-white text-green-700 rounded-lg hover:bg-green-50 font-bold text-lg shadow-xl transform hover:scale-105 transition"
          >
            <Plus className="w-6 h-6 mr-2" />
            Log Volunteer Hours
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
          <button
            onClick={() => setActiveView('opportunities')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeView === 'opportunities'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Browse Opportunities
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeView === 'dashboard'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'opportunities' ? (
        <OpportunityBrowser />
      ) : (
        <VolunteerDashboard />
      )}

      {/* Log Hours Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full my-8">
            <HourLogForm
              onSuccess={() => {
                setShowLogModal(false);
                if (activeView === 'dashboard') {
                  window.location.reload();
                }
              }}
              onCancel={() => setShowLogModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
