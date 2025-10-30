import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Heart, FileCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function HomePage() {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-xl p-8 md:p-12 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to ISSB Portal
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-blue-100">
          International Society for Somali Brothers - Membership Management System
        </p>
        {!user && (
          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
            >
              Become a Member
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        )}
        {user && profile && (
          <div className="bg-blue-700 rounded-lg p-4 inline-block">
            <p className="text-lg">
              Welcome back, <span className="font-bold">{profile.first_name}!</span>
            </p>
            <p className="text-blue-200 capitalize">
              Role: {profile.role} {profile.membership_tier && `| Tier: ${profile.membership_tier}`}
            </p>
          </div>
        )}
      </div>

      {/* Membership Tiers */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Membership Tiers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition">
            <h3 className="text-2xl font-bold mb-2 text-blue-600">Student</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900">$60<span className="text-lg text-gray-500">/year</span></p>
            <ul className="space-y-2 text-gray-700">
              <li>Full member benefits</li>
              <li>20 volunteer hours required</li>
              <li>Access to all events</li>
              <li>Networking opportunities</li>
            </ul>
          </div>

          <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50 relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg text-sm font-medium">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2 text-blue-600">Individual</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900">$360<span className="text-lg text-gray-500">/year</span></p>
            <ul className="space-y-2 text-gray-700">
              <li>All student benefits</li>
              <li>No volunteer hours required</li>
              <li>Priority event registration</li>
              <li>Voting rights</li>
            </ul>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition">
            <h3 className="text-2xl font-bold mb-2 text-blue-600">Family</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900">$560<span className="text-lg text-gray-500">/year</span></p>
            <ul className="space-y-2 text-gray-700">
              <li>All individual benefits</li>
              <li>Up to 5 family members</li>
              <li>Family event discounts</li>
              <li>Shared voting rights</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Access Features */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Portal Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/events"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Events</h3>
            <p className="text-gray-600">Browse and register for upcoming community events</p>
          </Link>

          <Link
            to="/volunteers"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Volunteers</h3>
            <p className="text-gray-600">Find opportunities and track your volunteer hours</p>
          </Link>

          <Link
            to="/donations"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4 group-hover:bg-red-200">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Donations</h3>
            <p className="text-gray-600">Support our community with one-time or recurring donations</p>
          </Link>

          {user && profile && ['admin', 'board'].includes(profile.role) && (
            <Link
              to="/admin"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200">
                <FileCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Admin</h3>
              <p className="text-gray-600">Manage users, memberships, and applications</p>
            </Link>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-gray-100 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">About ISSB</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          The International Society for Somali Brothers (ISSB) is a community organization dedicated to
          bringing together individuals of Somali heritage and supporters to foster cultural exchange,
          professional development, and community service. Our mission is to create a supportive network
          that empowers members to achieve their goals while contributing to the broader community.
        </p>
      </div>
    </div>
  );
}
