import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  BellIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  HomeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Mock notifications - replace with real data from your backend
  const notifications = [
    {
      id: 1,
      type: 'pending',
      title: 'Journal Entry Pending Approval',
      description: 'Journal Entry #JE-2026-03-001 requires your approval',
      time: '5 minutes ago',
      read: false,
      link: '/accountant/pending-approvals'
    },
    {
      id: 2,
      type: 'success',
      title: 'Payroll Processed',
      description: 'March 2026 payroll has been processed successfully',
      time: '1 hour ago',
      read: false,
      link: '/payroll/runs'
    },
    {
      id: 3,
      type: 'info',
      title: 'Budget Review',
      description: 'New budget proposals ready for review',
      time: '3 hours ago',
      read: true,
      link: '/treasurer/budgets'
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.firstName && user?.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const getUserRoleDisplay = () => {
    const roleMap = {
      super_admin: 'Super Admin',
      admin: 'Administrator',
      treasurer: 'Treasurer',
      accountant: 'Accountant',
      auditor: 'Auditor',
      pastor: 'Pastor',
      finance_committee: 'Finance Committee',
      user: 'User'
    };
    return roleMap[user?.role] || user?.role?.replace(/_/g, ' ') || 'User';
  };

  // Updated quick actions with correct payroll link
  const quickActions = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Journal Entry', icon: DocumentTextIcon, path: '/accountant/journal-entries/add' },
    { name: 'Calculate Payroll', icon: CalculatorIcon, path: '/payroll/calculate' }, // Updated from /payroll/process to /payroll/calculate
    { name: 'Payroll Runs', icon: ChartBarIcon, path: '/payroll/runs' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo/Brand */}
          <div className="flex items-center">
          </div>

          {/* Center - Quick Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-2">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.path}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-[rgb(31,178,86)] hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                <action.icon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-[rgb(31,178,86)]" />
                {action.name}
              </Link>
            ))}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button (Mobile) */}
            <button
              onClick={() => setShowSearch(true)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:block relative">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-64 pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent transition-all"
                  />
                </div>
              </form>
            </div>

            {/* Notifications */}
            <Menu as="div" className="relative">
              <Menu.Button className="relative p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <button className="text-xs text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <Link
                            to={notification.link}
                            className={`${active ? 'bg-gray-50' : ''} block px-4 py-3 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {notification.description}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <Link
                      to="/notifications"
                      className="block text-center text-xs text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]"
                    >
                      View all notifications
                    </Link>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Profile Dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors group">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] flex items-center justify-center text-white font-bold text-sm">
                  {getUserInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700 leading-tight">
                    {user?.full_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {getUserRoleDisplay()}
                  </p>
                </div>
                <ChevronDownIcon className="hidden md:block h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.full_name || user?.username}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.email}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Role</p>
                        <p className="font-medium text-gray-900 capitalize">{getUserRoleDisplay()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Church ID</p>
                        <p className="font-medium text-gray-900">{user?.church_id || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`${active ? 'bg-gray-50' : ''} flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors`}
                      >
                        <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Profile Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`${active ? 'bg-gray-50' : ''} flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-500" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      {/* Mobile Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="bg-white p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}