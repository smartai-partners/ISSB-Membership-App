import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Heart, FileCheck, ArrowRight, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function HomePage() {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section with Mosque Images */}
      <div className="relative rounded-lg shadow-xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/mosque-exterior.jpg"
            alt="Islamic Society of Sarasota and Bradenton Mosque"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 to-green-700/80"></div>
        </div>
        <div className="relative p-8 md:p-12 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            As-Salamu Alaykum
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Islamic Society of Sarasota and Bradenton
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-green-50">
            Welcome to ISSB - Your Community Center and Masjid
          </p>
          {!user && (
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
              >
                Become a Member
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-green-800"
              >
                Sign In
              </Link>
            </div>
          )}
          {user && profile && (
            <div className="bg-green-800 rounded-lg p-4 inline-block">
              <p className="text-lg">
                Welcome back, <span className="font-bold">{profile.first_name}!</span>
              </p>
              <p className="text-green-200 capitalize">
                Role: {profile.role} {profile.membership_tier && `| Membership: ${profile.membership_tier}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mosque Facility Showcase */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Beautiful Facility</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg overflow-hidden shadow-lg">
            <img
              src="/images/mosque-courtyard.jpg"
              alt="ISSB Courtyard with Islamic star pattern"
              className="w-full h-64 object-cover"
            />
            <div className="p-4 bg-green-50">
              <h3 className="font-semibold text-lg text-green-900">Main Courtyard</h3>
              <p className="text-gray-700">Beautiful Islamic star pattern courtyard with landscaping</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-6 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-lg text-green-900 mb-3">Facility Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Central dome prayer hall with separate spaces for men and women
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Islamic school and educational facilities
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Basketball court and playground for youth activities
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Multiple community rooms for events and gatherings
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Ample parking and accessible facilities
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Tiers */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Membership Plans</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition">
            <h3 className="text-2xl font-bold mb-2 text-green-700">Student</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900">$60<span className="text-lg text-gray-500">/year</span></p>
            <ul className="space-y-2 text-gray-700">
              <li>Full access to masjid facilities</li>
              <li>Islamic educational programs</li>
              <li>Youth activities</li>
              <li>Community service opportunities</li>
            </ul>
          </div>

          <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50 relative">
            <div className="absolute top-0 right-0 bg-green-600 text-white px-3 py-1 rounded-bl-lg text-sm font-medium">
              Popular
            </div>
            <h3 className="text-2xl font-bold mb-2 text-green-700">Resident</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900">$360<span className="text-lg text-gray-500">/year</span></p>
            <ul className="space-y-2 text-gray-700">
              <li>All student benefits</li>
              <li>Priority event registration</li>
              <li>Voting rights</li>
              <li>Full community participation</li>
            </ul>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition">
            <h3 className="text-2xl font-bold mb-2 text-green-700">Associate</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900">$240<span className="text-lg text-gray-500">/year</span></p>
            <ul className="space-y-2 text-gray-700">
              <li>Extended community member</li>
              <li>Access to most programs</li>
              <li>Event participation</li>
              <li>Newsletter subscription</li>
            </ul>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 transition">
            <h3 className="text-2xl font-bold mb-2 text-green-700">Family</h3>
            <p className="text-3xl font-bold mb-4 text-gray-900">$560<span className="text-lg text-gray-500">/year</span></p>
            <ul className="space-y-2 text-gray-700">
              <li>All resident benefits</li>
              <li>Up to 5 family members</li>
              <li>Family event discounts</li>
              <li>Shared voting rights</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Access Features */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Community Portal Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/events"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Events</h3>
            <p className="text-gray-600">Prayer times, Islamic programs, and community events</p>
          </Link>

          <Link
            to="/volunteers"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4 group-hover:bg-emerald-200">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Community</h3>
            <p className="text-gray-600">Service projects, educational programs, and volunteer opportunities</p>
          </Link>

          <Link
            to="/donations"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mb-4 group-hover:bg-amber-200">
              <Heart className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Donations</h3>
            <p className="text-gray-600">Zakat, Sadaqah, building fund, and community support</p>
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
              <p className="text-gray-600">Strategic plan monitoring, facility management, and member services</p>
            </Link>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">About ISSB</h2>
        <p className="text-lg text-gray-700 leading-relaxed mb-4">
          The Islamic Society of Sarasota and Bradenton (ISSB) serves as the heart of the Muslim community
          in Sarasota and Bradenton, Florida. Our masjid and community center provide a welcoming space for
          worship, education, and community engagement.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed mb-4">
          We are committed to fostering Islamic knowledge, strengthening family bonds, supporting youth development,
          and building bridges with the broader community. Our Strategic Plan 2025-2035 outlines our vision for
          continued growth and service excellence.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="flex items-start space-x-3">
            <MapPin className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Location</h3>
              <p className="text-gray-700">Sarasota and Bradenton, Florida</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Phone className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Contact</h3>
              <p className="text-gray-700">Available during office hours</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Mail className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Email</h3>
              <p className="text-gray-700">info@issb-fl.org</p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Plan Highlights */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">Strategic Plan 2025-2035</h2>
        <p className="text-gray-700 mb-6">
          Our comprehensive strategic plan focuses on sustainable growth, community engagement, and operational excellence.
        </p>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
            <h3 className="font-semibold text-green-900">Budget Monitoring</h3>
            <p className="text-sm text-gray-600 mt-1">Financial oversight and controls</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-600">
            <h3 className="font-semibold text-emerald-900">Risk Management</h3>
            <p className="text-sm text-gray-600 mt-1">Proactive risk identification</p>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg border-l-4 border-teal-600">
            <h3 className="font-semibold text-teal-900">Community Engagement</h3>
            <p className="text-sm text-gray-600 mt-1">Member participation metrics</p>
          </div>
          <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-600">
            <h3 className="font-semibold text-cyan-900">Resource Allocation</h3>
            <p className="text-sm text-gray-600 mt-1">Efficient resource tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
