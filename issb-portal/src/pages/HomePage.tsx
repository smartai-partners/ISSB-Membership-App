import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Heart, FileCheck, ArrowRight, MapPin, Phone, Mail, HandHeart, TrendingUp, Award, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function HomePage() {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState({
    totalVolunteerHours: 850,
    totalDonations: 125000,
    activeVolunteers: 120,
    totalMembers: 450,
    volunteerGoal: 1000,
    isRealData: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data, error } = await supabase.functions.invoke('get-community-metrics');
        
        if (error) throw error;
        
        if (data?.data) {
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Keep default placeholder values on error
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section - Volunteer & Prayer Times Focus */}
      <div className="relative rounded-lg shadow-xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/mosque-exterior.jpg"
            alt="Islamic Society of Sarasota and Bradenton Mosque"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/95 to-emerald-800/90"></div>
        </div>
        <div className="relative p-8 md:p-16 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            As-Salamu Alaykum
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Islamic Society of Sarasota and Bradenton
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-green-50">
            Be Part of Our Community Mission
          </p>
          
          {/* Primary CTAs - Volunteer & Donate Above the Fold */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Link
              to="/volunteers"
              className="inline-flex items-center px-8 py-4 border-4 border-white text-lg font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-xl transform hover:scale-105 transition"
            >
              <Users className="mr-3 w-6 h-6" />
              Volunteer Today
            </Link>
            <Link
              to="/donations"
              className="inline-flex items-center px-8 py-4 border-4 border-white text-lg font-bold rounded-lg text-green-700 bg-white hover:bg-green-50 shadow-xl transform hover:scale-105 transition"
            >
              <Heart className="mr-3 w-6 h-6" />
              Donate Now
            </Link>
          </div>

          {user && profile ? (
            <div className="bg-green-800/80 backdrop-blur-sm rounded-lg p-4 inline-block border-2 border-green-300">
              <p className="text-lg">
                Welcome back, <span className="font-bold">{profile.first_name}!</span>
              </p>
              <p className="text-green-200 capitalize">
                Role: {profile.role} {profile.membership_tier && `| Membership: ${profile.membership_tier}`}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
              >
                Become a Member
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-5 py-2 border-2 border-white text-base font-medium rounded-md text-white hover:bg-green-800/50"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Impact Metrics - Social Proof */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg shadow-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Our Community Impact</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">{metrics.totalVolunteerHours}+</div>
            <div className="text-green-100 text-sm md:text-base">Volunteer Hours This Year</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">${(metrics.totalDonations / 1000).toFixed(0)}K</div>
            <div className="text-green-100 text-sm md:text-base">Raised for Community</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">{metrics.activeVolunteers}</div>
            <div className="text-green-100 text-sm md:text-base">Active Volunteers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2">{metrics.totalMembers}+</div>
            <div className="text-green-100 text-sm md:text-base">Community Members</div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-green-100 text-lg">
            Join {metrics.activeVolunteers} volunteers who are making a difference this month
            {!metrics.isRealData && (
              <span className="text-xs opacity-75 block mt-1">(Demo data - will update with real metrics)</span>
            )}
          </p>
        </div>
      </div>

      {/* Featured Opportunities - Top 3 Cards */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">Get Involved Today</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Volunteer Now - Featured */}
          <Link
            to="/volunteers"
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-500 rounded-xl shadow-xl p-8 hover:shadow-2xl transition transform hover:scale-105 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-green-600 text-white px-4 py-1 rounded-bl-xl text-sm font-bold">
              Most Popular
            </div>
            <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-xl mb-4 group-hover:bg-green-700 transition">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Volunteer Now</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Join our community service projects and make a real difference. Help us reach our goal of 1,000 volunteer hours.
            </p>
            <div className="flex items-center text-green-700 font-semibold">
              View Opportunities
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Donate Today */}
          <Link
            to="/donations"
            className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-500 rounded-xl shadow-xl p-8 hover:shadow-2xl transition transform hover:scale-105 group"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-amber-600 rounded-xl mb-4 group-hover:bg-amber-700 transition">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Donate Today</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Support our mosque and community programs. Every donation helps us serve the community better.
            </p>
            <div className="flex items-center text-amber-700 font-semibold">
              Make a Donation
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Upcoming Events */}
          <Link
            to="/events"
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border-4 border-blue-500 rounded-xl shadow-xl p-8 hover:shadow-2xl transition transform hover:scale-105 group"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 group-hover:bg-blue-700 transition">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Upcoming Events</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Prayer times, Islamic programs, and community gatherings. Stay connected with your community.
            </p>
            <div className="flex items-center text-blue-700 font-semibold">
              View Calendar
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>

      {/* Volunteer Spotlight - Current Opportunities */}
      <div className="bg-white rounded-lg shadow-xl p-8 border-t-4 border-green-600">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Current Volunteer Opportunities</h2>
            <p className="text-gray-600 mt-2">
              Help us reach our goal of {metrics.volunteerGoal || 1000} volunteer hours
              {metrics.isRealData && metrics.totalVolunteerHours > 0 && (
                <span className="text-green-700 font-semibold ml-2">
                  ({metrics.totalVolunteerHours} completed!)
                </span>
              )}
            </p>
          </div>
          <Link
            to="/volunteers"
            className="hidden md:inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            View All Opportunities
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Opportunity Card 1 */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 hover:border-green-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">High Priority</span>
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Event Setup & Teardown</h3>
            <p className="text-gray-700 mb-3">Help prepare for Friday prayers and community events</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Time Needed: 2-4 hours</div>
              <div>Volunteers Needed: 8 more</div>
            </div>
          </div>

          {/* Opportunity Card 2 */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6 hover:border-emerald-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-semibold">Ongoing</span>
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Youth Mentorship</h3>
            <p className="text-gray-700 mb-3">Guide and inspire our younger generation</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Time Needed: 3-5 hours/week</div>
              <div>Volunteers Needed: 5 more</div>
            </div>
          </div>

          {/* Opportunity Card 3 */}
          <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-6 hover:border-teal-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm font-semibold">New</span>
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Educational Programs</h3>
            <p className="text-gray-700 mb-3">Assist with Quran and Arabic classes</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Time Needed: 1-3 hours</div>
              <div>Volunteers Needed: 4 more</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center md:hidden">
          <Link
            to="/volunteers"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            View All Opportunities
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Value Propositions - Why Volunteer & Donate */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Volunteering Benefits */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg shadow-xl p-8 text-white">
          <div className="flex items-center mb-4">
            <HandHeart className="w-12 h-12 mr-4" />
            <h3 className="text-2xl font-bold">Why Volunteer?</h3>
          </div>
          <ul className="space-y-3 text-green-50">
            <li className="flex items-start">
              <Award className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
              <span>Earn rewards in this life and the hereafter</span>
            </li>
            <li className="flex items-start">
              <Users className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
              <span>Build meaningful connections with your community</span>
            </li>
            <li className="flex items-start">
              <TrendingUp className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
              <span>Develop new skills and leadership experience</span>
            </li>
            <li className="flex items-start">
              <Heart className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
              <span>Make a real difference in people's lives</span>
            </li>
          </ul>
          <Link
            to="/volunteers"
            className="mt-6 inline-flex items-center px-6 py-3 bg-white text-green-700 rounded-lg hover:bg-green-50 font-bold"
          >
            Join Our Volunteer Team
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>

        {/* Donation Impact */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg shadow-xl p-8 text-white">
          <div className="flex items-center mb-4">
            <Heart className="w-12 h-12 mr-4" />
            <h3 className="text-2xl font-bold">Your Impact</h3>
          </div>
          <ul className="space-y-3 text-amber-50">
            <li className="flex items-start">
              <span className="font-bold mr-3">$50</span>
              <span>Provides meals for families in need</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-3">$100</span>
              <span>Supports youth educational programs</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-3">$250</span>
              <span>Funds community outreach initiatives</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-3">$500+</span>
              <span>Contributes to mosque facility upgrades</span>
            </li>
          </ul>
          <Link
            to="/donations"
            className="mt-6 inline-flex items-center px-6 py-3 bg-white text-amber-700 rounded-lg hover:bg-amber-50 font-bold"
          >
            Support Our Mosque
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
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

      {/* Membership Tiers - Streamlined */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Membership Plans</h2>
        <p className="text-gray-600 text-center mb-6">Join our community and get access to all facilities and programs</p>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-green-500 transition">
            <h3 className="text-xl font-bold mb-2 text-green-700">Student</h3>
            <p className="text-2xl font-bold mb-3 text-gray-900">$60<span className="text-sm text-gray-500">/year</span></p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>Full facility access</li>
              <li>Educational programs</li>
              <li>Youth activities</li>
            </ul>
          </div>

          <div className="bg-white border-2 border-green-500 rounded-lg p-5 relative">
            <div className="absolute top-0 right-0 bg-green-600 text-white px-2 py-1 rounded-bl-lg text-xs font-bold">
              Popular
            </div>
            <h3 className="text-xl font-bold mb-2 text-green-700">Resident</h3>
            <p className="text-2xl font-bold mb-3 text-gray-900">$360<span className="text-sm text-gray-500">/year</span></p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>All student benefits</li>
              <li>Priority registration</li>
              <li>Voting rights</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-green-500 transition">
            <h3 className="text-xl font-bold mb-2 text-green-700">Associate</h3>
            <p className="text-2xl font-bold mb-3 text-gray-900">$240<span className="text-sm text-gray-500">/year</span></p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>Extended member</li>
              <li>Most programs</li>
              <li>Event participation</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-green-500 transition">
            <h3 className="text-xl font-bold mb-2 text-green-700">Family</h3>
            <p className="text-2xl font-bold mb-3 text-gray-900">$560<span className="text-sm text-gray-500">/year</span></p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>All resident benefits</li>
              <li>Up to 5 members</li>
              <li>Family discounts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* About Section - Compact */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-3 text-gray-900">About ISSB</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          The Islamic Society of Sarasota and Bradenton (ISSB) serves as the heart of the Muslim community
          in Sarasota and Bradenton, Florida. We are committed to fostering Islamic knowledge, strengthening 
          family bonds, supporting youth development, and building bridges with the broader community.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-2">
            <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Location</h3>
              <p className="text-sm text-gray-700">Sarasota and Bradenton, FL</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Phone className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Contact</h3>
              <p className="text-sm text-gray-700">Available during office hours</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Email</h3>
              <p className="text-sm text-gray-700">info@issb-fl.org</p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Plan Highlights - Compact */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Strategic Plan 2025-2035</h2>
        <p className="text-gray-700 mb-4">
          Our comprehensive strategic plan focuses on sustainable growth, community engagement, and operational excellence.
        </p>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-600">
            <h3 className="font-semibold text-sm text-green-900">Budget Monitoring</h3>
            <p className="text-xs text-gray-600 mt-1">Financial oversight</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-600">
            <h3 className="font-semibold text-sm text-emerald-900">Risk Management</h3>
            <p className="text-xs text-gray-600 mt-1">Risk identification</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-lg border-l-4 border-teal-600">
            <h3 className="font-semibold text-sm text-teal-900">Community Engagement</h3>
            <p className="text-xs text-gray-600 mt-1">Member participation</p>
          </div>
          <div className="p-3 bg-cyan-50 rounded-lg border-l-4 border-cyan-600">
            <h3 className="font-semibold text-sm text-cyan-900">Resource Allocation</h3>
            <p className="text-xs text-gray-600 mt-1">Resource tracking</p>
          </div>
        </div>
      </div>

      {/* Final CTA - Sticky Bottom Banner */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-700 rounded-lg shadow-2xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Every Contribution Matters</h2>
        <p className="text-green-100 text-lg mb-6">Whether you give your time or resources, you are building a stronger community</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/volunteers"
            className="inline-flex items-center px-8 py-4 bg-white text-green-700 rounded-lg hover:bg-green-50 font-bold text-lg shadow-xl transform hover:scale-105 transition"
          >
            <Users className="mr-3 w-6 h-6" />
            Start Volunteering
          </Link>
          <Link
            to="/donations"
            className="inline-flex items-center px-8 py-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-bold text-lg shadow-xl transform hover:scale-105 transition"
          >
            <Heart className="mr-3 w-6 h-6" />
            Make a Donation
          </Link>
        </div>
      </div>
    </div>
  );
}
