import React from 'react';
import { Home, Calendar, Users, Heart, LayoutDashboard, FileCheck, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className = '' }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home, public: true },
    { name: 'Events', path: '/events', icon: Calendar, public: true },
    { name: 'Community', path: '/volunteers', icon: Users, roles: ['admin', 'board', 'member', 'student'] },
    { name: 'Donations', path: '/donations', icon: Heart, public: true },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin', 'board'] },
    { name: 'Applications', path: '/admin/applications', icon: FileCheck, roles: ['admin', 'board'] },
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
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {navItems.filter(canAccess).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
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
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
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

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
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
        </div>
      </div>
    </nav>
  );
}
