// pages/Pastor/PastorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  BellIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { pastorService } from '../../services/pastor';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const PastorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBudgets: 0,
    pendingBudgets: 0,
    approvedBudgets: 0,
    rejectedBudgets: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    highPriorityPending: 0
  });
  const [recentPending, setRecentPending] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch stats and pending budgets in parallel
      const [statsData, pendingData] = await Promise.all([
        pastorService.getDashboardStats(),
        pastorService.getPendingBudgets()
      ]);
      
      setStats(statsData);
      setRecentPending(pendingData.budgets?.slice(0, 5) || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </motion.div>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pastor Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review and approve church budgets
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              to="/pastor/budget-approvals"
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)]"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              View Pending ({stats.pendingBudgets})
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending Budgets"
            value={stats.pendingBudgets}
            icon={ClockIcon}
            color="yellow"
            subtitle={`${stats.highPriorityPending} high priority`}
          />
          <StatCard
            title="Approved Budgets"
            value={stats.approvedBudgets}
            icon={CheckCircleIcon}
            color="green"
            subtitle={formatCurrency(stats.approvedAmount, 'GHS')}
          />
          <StatCard
            title="Rejected Budgets"
            value={stats.rejectedBudgets}
            icon={XCircleIcon}
            color="red"
          />
          <StatCard
            title="Total Budgets"
            value={stats.totalBudgets}
            icon={DocumentTextIcon}
            color="blue"
            subtitle={`${formatCurrency(stats.pendingAmount, 'GHS')} pending`}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Budgets List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Recent Pending Budgets</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {recentPending.length > 0 ? (
                  recentPending.map((budget) => (
                    <div key={budget.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-sm font-medium text-gray-900">{budget.name}</h3>
                            {budget.priority === 'HIGH' && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                High Priority
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{budget.department}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(budget.amount, 'GHS')}
                            </span>
                            <span className="text-xs text-gray-400">
                              Submitted: {new Date(budget.submittedDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/pastor/budgets/${budget.id}`)}
                          className="ml-4 px-3 py-1 text-sm bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)]"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No pending budgets to review</p>
                  </div>
                )}
              </div>
              
              {recentPending.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <Link
                    to="/pastor/budget-approvals"
                    className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(27,158,76)] font-medium"
                  >
                    View all pending budgets →
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <Link
                  to="/pastor/budget-approvals"
                  className="block w-full px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Review Pending</span>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      {stats.pendingBudgets}
                    </span>
                  </div>
                </Link>
                
                <Link
                  to="/pastor/approved-budgets"
                  className="block w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">View Approved</span>
                    <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">
                      {stats.approvedBudgets}
                    </span>
                  </div>
                </Link>
                
                <Link
                  to="/pastor/rejected-budgets"
                  className="block w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">View Rejected</span>
                    <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs">
                      {stats.rejectedBudgets}
                    </span>
                  </div>
                </Link>
              </div>

              {/* Summary Card */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Approved Amount:</span>
                    <span className="font-medium text-blue-800">{formatCurrency(stats.approvedAmount, 'GHS')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Pending Amount:</span>
                    <span className="font-medium text-blue-800">{formatCurrency(stats.pendingAmount, 'GHS')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Avg Response Time:</span>
                    <span className="font-medium text-blue-800">{stats.averageResponseTime} days</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastorDashboard;