import React, { useState, useRef, useEffect } from 'react';
import { Home, Calendar, Users, Heart, LayoutDashboard, FileCheck, LogOut, Menu, X, MessageSquare, CheckSquare, BarChart3, CreditCard, Bell, Settings, ChevronDown, Shield, FileText, TrendingUp, User, ArrowUpRight } from 'lucide-react';
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
  const [openAdminDropdown, setOpenAdminDropdown] = useState<string | null>(null);
  const [openUserDropdown, setOpenUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenAdminDropdown(null);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setOpenUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Modern, simplified primary navigation
  const primaryNavItems = [
    { name: 'Home', path: '/', icon: Home, public: true },
    { name: 'Events', path: '/events', icon: Calendar, public: true },
    { name: 'Membership', path: '/membership', icon: CreditCard, public: true },
  ];

  // Quick actions for key user journeys
  const quickActions = [
    { name: 'Volunteer', path: '/volunteers', icon: Users, highlight: true },
    { name: 'Donate', path: '/donations', icon: Heart, highlight: true },
  ];

  // Member-specific navigation
  const memberItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['member', 'student'] },
    { name: 'Announcements', path: '/announcements', icon: Bell, roles: ['admin', 'board', 'member', 'student'] },
  ];

  // Modern admin navigation structure
  const adminMenuItems = [
    {
      name: 'Admin',
      icon: Shield,
      groups: [
        {
          name: 'Overview',
          items: [
            { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin', 'board'] },
          ]
        },
        {
          name: 'User Management',
          items: [
            { name: 'Users', path: '/admin/users', icon: Users, roles: ['admin', 'board'] },
            { name: 'Applications', path: '/admin/applications', icon: FileCheck, roles: ['admin', 'board'] },
          ]
        },
        {
          name: 'Content',
          items: [
            { name: 'Events', path: '/admin/events', icon: Calendar, roles: ['admin', 'board'] },
            { name: 'Announcements', path: '/admin/announcements', icon: Bell, roles: ['admin', 'board'] },
          ]
        },
        {
          name: 'Analytics',
          items: [
            { name: 'Analytics', path: '/admin/accessibility-analytics', icon: BarChart3, roles: ['admin', 'board'] },
            { name: 'Membership Analytics', path: '/admin/membership-analytics', icon: CreditCard, roles: ['admin', 'board'] },
          ]
        },
        {
          name: 'Tools',
          items: [
            { name: 'Volunteer Management', path: '/admin/volunteers', icon: Users, roles: ['admin', 'board'] },
            { name: 'Volunteer Hours', path: '/admin/volunteer-hours', icon: CheckSquare, roles: ['admin', 'board'] },
            { name: 'Help Assistant', path: '/admin/help-assistant', icon: MessageSquare, roles: ['admin', 'board'] },
            { name: 'Accessibility', path: '/admin/accessibility-audit', icon: Settings, roles: ['admin', 'board'] },
          ]
        }
      ]
    }
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
    <nav className={`bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent group-hover:from-green-600 group-hover:to-green-500 transition-all duration-300">
                  ISSB
                </span>
                <span className="text-xs text-gray-500 font-medium">Sarasota & Bradenton</span>
              </div>
            </Link>
          </div>
          
          {/* Center: Primary Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {primaryNavItems.filter(canAccess).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-green-500 rounded-full" />
                )}
              </Link>
            ))}
            
            {/* Member Navigation */}
            {user && profile && memberItems.filter(canAccess).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-green-500 rounded-full" />
                )}
              </Link>
            ))}
            
            {/* Admin Menu */}
            {user && profile && (
              <div className="relative" ref={dropdownRef}>
                {adminMenuItems.map((menu) => {
                  const allItems = menu.groups.flatMap(group => group.items);
                  const accessibleItems = allItems.filter(canAccess);
                  if (accessibleItems.length === 0) return null;
                  
                  const hasActiveItem = accessibleItems.some(item => isActive(item.path));
                  const isOpen = openAdminDropdown === menu.name;
                  
                  return (
                    <div key={menu.name} className="relative">
                      <button
                        onClick={() => setOpenAdminDropdown(isOpen ? null : menu.name)}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 group ${
                          hasActiveItem
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <menu.icon className="w-4 h-4 mr-2" />
                        {menu.name}
                        <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Admin Dropdown Menu */}
                      {isOpen && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                          <div className="p-4">
                            {menu.groups.map((group) => {
                              const groupItems = group.items.filter(canAccess);
                              if (groupItems.length === 0) return null;
                              
                              return (
                                <div key={group.name} className="mb-4 last:mb-0">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    {group.name}
                                  </h4>
                                  <div className="space-y-1">
                                    {groupItems.map((item) => (
                                      <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setOpenAdminDropdown(null)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                                          isActive(item.path)
                                            ? 'bg-green-50 text-green-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        <div className="flex items-center">
                                          <item.icon className="w-4 h-4 mr-3" />
                                          {item.name}
                                        </div>
                                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Right: Quick Actions & Auth */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className={`hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  action.highlight
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-sm hover:shadow-md transform hover:scale-105'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <action.icon className="w-4 h-4 mr-2" />
                {action.name}
              </Link>
            ))}

            {/* User Profile & Auth */}
            {user && profile ? (
              <div className="flex items-center space-x-3" ref={userDropdownRef}>
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{profile.role}</div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenUserDropdown(!openUserDropdown)}
                    className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center text-white font-medium text-sm hover:shadow-md transition-all duration-200"
                  >
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {openUserDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999]">
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-gray-100 mb-2">
                          <div className="text-sm font-medium text-gray-900">
                            {profile.first_name} {profile.last_name}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">{profile.role}</div>
                        </div>
                        <div className="space-y-1">
                          <Link
                            to="/admin/help-assistant"
                            onClick={() => setOpenUserDropdown(false)}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                          >
                            <MessageSquare className="w-4 h-4 mr-3" />
                            Help Assistant
                          </Link>
                          <Link
                            to="/admin/accessibility-audit"
                            onClick={() => setOpenUserDropdown(false)}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                          >
                            <CheckSquare className="w-4 h-4 mr-3" />
                            Accessibility
                          </Link>
                          <hr className="my-2" />
                          <button
                            onClick={() => {
                              handleSignOut();
                              setOpenUserDropdown(false);
                            }}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-lg shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
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
      </div>

      {/* Modern Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm">
          <div className="px-4 py-6 space-y-2">
            {/* Primary Navigation */}
            <div className="space-y-1">
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Navigation
              </h3>
              {primaryNavItems.filter(canAccess).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-1">
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </h3>
              {quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                    action.highlight
                      ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <action.icon className="w-5 h-5 mr-3" />
                  {action.name}
                </Link>
              ))}
            </div>

            {/* Member Navigation */}
            {user && profile && memberItems.filter(canAccess).length > 0 && (
              <div className="space-y-1">
                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Member
                </h3>
                {memberItems.filter(canAccess).map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Admin Navigation */}
            {user && profile && (
              <div className="space-y-2">
                {adminMenuItems.map((menu) => {
                  const allItems = menu.groups.flatMap(group => group.items);
                  const accessibleItems = allItems.filter(canAccess);
                  if (accessibleItems.length === 0) return null;
                  
                  return (
                    <div key={menu.name} className="space-y-1">
                      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {menu.name}
                      </h3>
                      {menu.groups.map((group) => {
                        const groupItems = group.items.filter(canAccess);
                        if (groupItems.length === 0) return null;
                        
                        return (
                          <div key={group.name} className="space-y-1">
                            <div className="px-4 py-1">
                              <span className="text-xs font-medium text-gray-400">{group.name}</span>
                            </div>
                            {groupItems.map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center px-8 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                                  isActive(item.path)
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <item.icon className="w-4 h-4 mr-3" />
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Mobile Auth Section */}
            <div className="border-t border-gray-100 pt-6 mt-6">
              {user && profile ? (
                <div className="space-y-4">
                  <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {profile.first_name} {profile.last_name}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">{profile.role}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modern Floating Action Buttons - Mobile Only */}
      <div className="fixed bottom-6 right-6 lg:hidden flex flex-col gap-3 z-50">
        <Link
          to="/volunteers"
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full shadow-2xl hover:from-green-700 hover:to-green-600 hover:shadow-green-500/25 transform hover:scale-110 transition-all duration-300 group"
          title="Volunteer"
        >
          <Users className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        <Link
          to="/donations"
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-2xl hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/25 transform hover:scale-110 transition-all duration-300 group"
          title="Donate"
        >
          <Heart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>
    </nav>
  );
}
