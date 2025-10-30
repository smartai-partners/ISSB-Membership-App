import React, { useEffect, useState } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Users, BookOpen, Heart, Award, TrendingUp, Star, HandHeart, ArrowRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { VolunteerOpportunity, VolunteerHours } from '@/types';

export function VolunteersPage() {
  const { user, profile } = useAuth();
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [myHours, setMyHours] = useState<VolunteerHours[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    hours: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      // Load opportunities
      const { data: opps } = await supabase
        .from('volunteer_opportunities')
        .select('*')
        .eq('status', 'open')
        .order('start_date', { ascending: true });

      if (opps) setOpportunities(opps);

      // Load my hours
      if (user) {
        const { data: hours } = await supabase
          .from('volunteer_hours')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (hours) {
          setMyHours(hours);
          const approved = hours.filter(h => h.status === 'approved');
          const total = approved.reduce((sum, h) => sum + h.hours, 0);
          setTotalHours(total);
        }
      }
    } catch (error) {
      console.error('Error loading volunteer data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogHours() {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('log-volunteer-hours', {
        body: {
          hours: parseFloat(logForm.hours),
          date: logForm.date,
          description: logForm.description,
        },
      });

      if (error) throw error;

      setShowLogModal(false);
      setLogForm({ hours: '', date: new Date().toISOString().split('T')[0], description: '' });
      loadData();
    } catch (error) {
      console.error('Error logging hours:', error);
      alert('Failed to log volunteer hours. Please try again.');
    }
  }

  if (!user) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-green-600" />
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
            <ArrowRight className="ml-2 w-5 h-5" />
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

  if (loading) {
    return <div className="text-center py-12">Loading volunteer opportunities...</div>;
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

      {/* Community Impact & Personal Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Community Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-600">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Community Goal</h3>
              <p className="text-sm text-gray-600">Help us reach 1,000 volunteer hours!</p>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-bold text-green-600">850 hours</span>
              <span className="text-sm text-gray-600">85% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-green-700">150 hours needed!</span> Join 120 active volunteers today.
          </p>
        </div>

        {/* Personal Impact */}
        <div className="bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center mb-4">
            <Award className="w-8 h-8 mr-3" />
            <h3 className="text-lg font-bold">Your Impact</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold">{totalHours}</div>
              <div className="text-sm text-green-100">Total Hours</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {myHours.filter(h => h.status === 'approved').length}
              </div>
              <div className="text-sm text-green-100">Contributions</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {totalHours >= 50 ? 'Gold' : totalHours >= 20 ? 'Silver' : 'Bronze'}
              </div>
              <div className="text-sm text-green-100">Level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgency Message */}
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
        <div className="flex items-start">
          <Clock className="w-6 h-6 text-amber-600 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-amber-900">Help Needed This Week!</h3>
            <p className="text-amber-800 mt-1">
              We have 8 urgent opportunities that need volunteers. Sign up today and make a difference in your community.
            </p>
          </div>
        </div>
      </div>

      {/* Volunteer Opportunities - Featured Cards */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Current Opportunities</h2>
            <p className="text-gray-600 mt-1">One-click sign-up for all opportunities</p>
          </div>
        </div>
        
        {opportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No open volunteer opportunities at this time.</p>
            <p className="text-gray-500 mt-2">Check back soon or contact us to propose new initiatives!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Event Setup & Teardown',
                description: 'Help prepare the mosque for Friday prayers and community events',
                hours: '2-4 hours',
                volunteers: '8 volunteers needed',
                priority: 'High Priority',
                color: 'green',
                icon: Users
              },
              {
                title: 'Community Service Projects',
                description: 'Food pantry assistance and community outreach programs',
                hours: '3-6 hours',
                volunteers: '6 volunteers needed',
                priority: 'Ongoing',
                color: 'emerald',
                icon: Heart
              },
              {
                title: 'Educational Program Assistance',
                description: 'Help with Quran and Arabic classes for youth',
                hours: '1-3 hours',
                volunteers: '4 volunteers needed',
                priority: 'New',
                color: 'teal',
                icon: BookOpen
              },
              {
                title: 'Facility Maintenance',
                description: 'General cleaning and maintenance of mosque facilities',
                hours: '2-5 hours',
                volunteers: '5 volunteers needed',
                priority: 'Weekly',
                color: 'cyan',
                icon: HandHeart
              },
              {
                title: 'Youth Mentorship',
                description: 'Guide and inspire our younger generation',
                hours: '3-5 hours/week',
                volunteers: '5 volunteers needed',
                priority: 'Long-term',
                color: 'blue',
                icon: Star
              },
              ...opportunities.map((opp) => ({
                title: opp.title,
                description: opp.description || 'Help make a difference',
                hours: `${opp.hours_required} hours`,
                volunteers: 'Multiple spots',
                priority: 'Open',
                color: 'indigo',
                icon: Users
              }))
            ].slice(0, 6).map((opp, index) => {
              const Icon = opp.icon;
              const colorClasses = {
                green: 'bg-green-50 border-green-200 hover:border-green-500',
                emerald: 'bg-emerald-50 border-emerald-200 hover:border-emerald-500',
                teal: 'bg-teal-50 border-teal-200 hover:border-teal-500',
                cyan: 'bg-cyan-50 border-cyan-200 hover:border-cyan-500',
                blue: 'bg-blue-50 border-blue-200 hover:border-blue-500',
                indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-500',
              };
              const badgeColors = {
                green: 'bg-green-600',
                emerald: 'bg-emerald-600',
                teal: 'bg-teal-600',
                cyan: 'bg-cyan-600',
                blue: 'bg-blue-600',
                indigo: 'bg-indigo-600',
              };
              const iconColors = {
                green: 'bg-green-100 text-green-700',
                emerald: 'bg-emerald-100 text-emerald-700',
                teal: 'bg-teal-100 text-teal-700',
                cyan: 'bg-cyan-100 text-cyan-700',
                blue: 'bg-blue-100 text-blue-700',
                indigo: 'bg-indigo-100 text-indigo-700',
              };
              
              return (
                <div
                  key={index}
                  className={`border-2 rounded-xl p-6 hover:shadow-xl transition transform hover:scale-105 ${colorClasses[opp.color as keyof typeof colorClasses]}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 ${badgeColors[opp.color as keyof typeof badgeColors]} text-white rounded-full text-xs font-bold`}>
                      {opp.priority}
                    </span>
                    <div className={`p-2 rounded-lg ${iconColors[opp.color as keyof typeof iconColors]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{opp.title}</h3>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">{opp.description}</p>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{opp.hours}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{opp.volunteers}</span>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold shadow-md">
                    Sign Up Now
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Volunteer Recognition Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-amber-500">
        <div className="flex items-center mb-6">
          <Trophy className="w-8 h-8 text-amber-600 mr-3" />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Community Champions</h3>
            <p className="text-gray-600">Top volunteers this month</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Ahmed M.', hours: 45, rank: 1, badge: 'Gold' },
            { name: 'Fatima K.', hours: 38, rank: 2, badge: 'Silver' },
            { name: 'Omar S.', hours: 32, rank: 3, badge: 'Bronze' },
            { name: profile ? `${profile.first_name} ${profile.last_name?.charAt(0)}.` : 'You', hours: totalHours, rank: totalHours >= 30 ? 2 : 5, badge: 'Member' },
          ].map((volunteer, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg ${
                volunteer.name.includes(profile?.first_name || 'You')
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mr-4 ${
                  volunteer.rank === 1 ? 'bg-amber-500' :
                  volunteer.rank === 2 ? 'bg-gray-400' :
                  volunteer.rank === 3 ? 'bg-amber-700' :
                  'bg-gray-300'
                }`}>
                  {volunteer.rank}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{volunteer.name}</div>
                  <div className="text-sm text-gray-600">{volunteer.badge} Member</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{volunteer.hours}</div>
                <div className="text-sm text-gray-600">hours</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Program Categories */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-4">
            <BookOpen className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900">Islamic Education</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Quran study circles
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Arabic language classes
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Youth Islamic education
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              Adult learning programs
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-500">
          <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-xl mb-4">
            <Users className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900">Community Service</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Food pantry assistance
            </li>
            <li className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Community outreach
            </li>
            <li className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Interfaith dialogue
            </li>
            <li className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Social welfare programs
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-teal-500">
          <div className="flex items-center justify-center w-14 h-14 bg-teal-100 rounded-xl mb-4">
            <Heart className="w-7 h-7 text-teal-600" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900">Family Programs</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-teal-600 mr-2">•</span>
              Family counseling
            </li>
            <li className="flex items-start">
              <span className="text-teal-600 mr-2">•</span>
              Youth mentorship
            </li>
            <li className="flex items-start">
              <span className="text-teal-600 mr-2">•</span>
              Marriage preparation
            </li>
            <li className="flex items-start">
              <span className="text-teal-600 mr-2">•</span>
              Parenting workshops
            </li>
          </ul>
        </div>
      </div>

      {/* My Hours Log */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">My Volunteer Log</h2>
        {myHours.length === 0 ? (
          <div className="text-center py-12">
            <HandHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No volunteer hours logged yet.</p>
            <p className="text-gray-500 mt-2">Start contributing to the community today!</p>
            <button
              onClick={() => setShowLogModal(true)}
              className="mt-6 inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Log Your First Hours
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myHours.map((hour) => (
                  <tr key={hour.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(hour.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-green-600">{hour.hours}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{hour.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          hour.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : hour.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {hour.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {hour.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {hour.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Hours Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Log Volunteer Hours</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Volunteered</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={logForm.hours}
                  onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter hours (e.g., 2.5)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe your volunteer work (e.g., Assisted with Friday prayer setup, Taught Quran class to youth)"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowLogModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogHours}
                  disabled={!logForm.hours || !logForm.description}
                  className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Log Hours
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Trophy icon component (add to imports if available or use alternative)
function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}
