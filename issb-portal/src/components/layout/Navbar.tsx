import React, { useState } from 'react';
import { Home, Calendar, Users, Heart, LayoutDashboard, FileCheck, LogOut, Menu, X, MessageSquare, CheckSquare, BarChart3, CreditCard, Bell } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className = '' }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Reordered navigation with Volunteer and Donate prioritized
  const navItems = [
    { name: 'Home', path: '/', icon: Home, public: true },
    { name: 'Volunteer', path: '/volunteers', icon: Users, roles: ['admin', 'board', 'member', 'student'], highlight: true },
    { name: 'Donate', path: '/donations', icon: Heart, public: true, highlight: true },
    { name: 'Events', path: '/events', icon: Calendar, public: true },
    { name: 'Membership', path: '/membership', icon: CreditCard, public: true },
  ];

  const memberItems = [
    { name: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['member', 'student'] },
    { name: 'Announcements', path: '/announcements', icon: Bell, roles: ['admin', 'board', 'member', 'student'] },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin', 'board'] },
    { name: 'Applications', path: '/admin/applications', icon: FileCheck, roles: ['admin', 'board'] },
    { name: 'Users', path: '/admin/users', icon: Users, roles: ['admin', 'board'] },
    { name: 'Events', path: '/admin/events', icon: Calendar, roles: ['admin', 'board'] },
    { name: 'Volunteer Mgmt', path: '/admin/volunteers', icon: Users, roles: ['admin', 'board'] },
    { name: 'Volunteer Hours', path: '/admin/volunteer-hours', icon: CheckSquare, roles: ['admin', 'board'] },
    { name: 'Help Assistant', path: '/admin/help-assistant', icon: MessageSquare, roles: ['admin', 'board'] },
    { name: 'Accessibility', path: '/admin/accessibility-audit', icon: CheckSquare, roles: ['admin', 'board'] },
    { name: 'Analytics', path: '/admin/accessibility-analytics', icon: BarChart3, roles: ['admin', 'board'] },
    { name: 'Membership Analytics', path: '/admin/membership-analytics', icon: CreditCard, roles: ['admin', 'board'] },
    { name: 'Announcements', path: '/admin/announcements', icon: Bell, roles: ['admin', 'board'] },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const canAccess = (item: { public?: boolean; roles?: string[] }) => {
    if (item.public) return true;
    if (!user || !profile) return false;
    if (!item.roles) return true;
    return item.roles.includes(profile.role);
  };

  return (
    <nav className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex flex-col">
                <span className="text-xl font-bold text-green-700">ISSB</span>
                <span className="text-xs text-gray-600">Sarasota & Bradenton</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              {navItems.filter(canAccess).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.path)
                      ? 'border-green-600 text-gray-900'
                      : item.highlight
                      ? 'border-transparent text-green-700 hover:border-green-400 hover:text-green-800 font-bold'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <item.icon className={`w-4 h-4 mr-2 ${item.highlight ? 'text-green-600' : ''}`} />
                  {item.name}
                </Link>
              ))}
              {user && profile && memberItems.filter(canAccess).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.path)
                      ? 'border-green-600 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              ))}
              {user && profile && adminItems.filter(canAccess).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.path)
                      ? 'border-green-600 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:ml-6 md:flex md:items-center">
            {user && profile ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div className="text-gray-500 capitalize">{profile.role}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navItems.filter(canAccess).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-md text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-green-100 text-green-900'
                    : item.highlight
                    ? 'text-green-700 hover:bg-green-50 font-bold border-2 border-green-500'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${item.highlight ? 'text-green-600' : ''}`} />
                {item.name}
              </Link>
            ))}
            {user && profile && memberItems.filter(canAccess).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-md text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
            {user && profile && adminItems.filter(canAccess).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-md text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-green-100 text-green-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
            
            {/* Mobile Auth */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              {user && profile ? (
                <>
                  <div className="px-3 mb-3">
                    <div className="font-medium text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{profile.role}</div>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center w-full px-3 py-3 rounded-md text-base font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Floating Action Buttons - Mobile Only */}
      <div className="fixed bottom-6 right-6 md:hidden flex flex-col gap-3 z-50">
        <Link
          to="/volunteers"
          className="flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 hover:shadow-green-500/25 transform hover:scale-110 transition-all duration-300 hover-lift group"
          title="Volunteer"
        >
          <Users className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        <Link
          to="/donations"
          className="flex items-center justify-center w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl hover:bg-amber-600 hover:shadow-amber-500/25 transform hover:scale-110 transition-all duration-300 hover-lift group"
          title="Donate"
        >
          <Heart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>
    </nav>
  );
}
