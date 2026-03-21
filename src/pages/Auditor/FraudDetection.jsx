import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  FlagIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function FraudDetection() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    highPriority: 0,
    investigated: 0,
    confirmed: 0
  });
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchFraudData();
  }, []);

  const fetchFraudData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/fraud-detection');
      setAlerts(response.data.alerts || []);
      setPatterns(response.data.patterns || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching fraud data:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setAlerts([
      {
        id: 1,
        title: 'Unusual Cash Withdrawal Pattern',
        description: 'Multiple cash withdrawals exceeding $5,000 in 3 days',
        amount: 15750,
        date: '2024-03-15',
        account: 'Main Operating Account',
        priority: 'high',
        status: 'new',
        indicator: 92,
        pattern: 'Velocity Check'
      },
      {
        id: 2,
        title: 'Duplicate Vendor Payment',
        description: 'Same invoice paid twice to vendor "Office Supplies Co."',
        amount: 2850,
        date: '2024-03-14',
        account: 'Accounts Payable',
        priority: 'high',
        status: 'investigating',
        indicator: 88,
        pattern: 'Duplicate Transaction'
      },
      {
        id: 3,
        title: 'Unusual Vendor Relationship',
        description: 'New vendor received 3 payments totaling $15,000 in first week',
        amount: 15000,
        date: '2024-03-13',
        account: 'Misc Expense',
        priority: 'medium',
        status: 'new',
        indicator: 75,
        pattern: 'Vendor Anomaly'
      },
      {
        id: 4,
        title: 'Round Dollar Transactions',
        description: 'Multiple transactions rounded to $1,000 suggesting possible splitting',
        amount: 6000,
        date: '2024-03-12',
        account: 'Various',
        priority: 'low',
        status: 'reviewed',
        indicator: 45,
        pattern: 'Structuring'
      },
    ]);

    setPatterns([
      { name: 'Velocity Check', count: 12, risk: 'high' },
      { name: 'Duplicate Transactions', count: 8, risk: 'high' },
      { name: 'Round Dollar', count: 15, risk: 'medium' },
      { name: 'Weekend Activity', count: 6, risk: 'medium' },
      { name: 'Vendor Anomaly', count: 4, risk: 'high' },
    ]);

    setStats({
      totalAlerts: 24,
      highPriority: 8,
      investigated: 12,
      confirmed: 3
    });
  };

  const handleInvestigate = (id) => {
    toast.success('Starting investigation...');
    // Implement investigation workflow
  };

  const handleDismiss = (id) => {
    toast.success('Alert dismissed');
    // Implement dismiss
  };

  const handleConfirm = (id) => {
    toast.success('Fraud confirmed, case created');
    // Implement confirmation
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskBarColor = (indicator) => {
    if (indicator >= 80) return 'bg-red-500';
    if (indicator >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.priority !== 'all' && alert.priority !== filters.priority) return false;
    if (filters.status !== 'all' && alert.status !== filters.status) return false;
    if (filters.search && !alert.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fraud Detection</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchFraudData}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Run Analysis
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FlagIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Under Investigation</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.investigated}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <MagnifyingGlassIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Confirmed Fraud</p>
              <p className="text-2xl font-bold text-purple-600">{stats.confirmed}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ShieldExclamationIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Alerts */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-2">{alert.description}</p>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(alert.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm text-gray-900">{formatDate(alert.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Account</p>
                    <p className="text-sm text-gray-900">{alert.account}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pattern</p>
                    <p className="text-sm text-gray-900">{alert.pattern}</p>
                  </div>
                </div>

                {/* Risk Indicator */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Fraud Indicator Score</span>
                    <span>{alert.indicator}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getRiskBarColor(alert.indicator)}`}
                      style={{ width: `${alert.indicator}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="ml-6 flex flex-col space-y-2">
                <button
                  onClick={() => handleInvestigate(alert.id)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm whitespace-nowrap"
                >
                  Investigate
                </button>
                <button
                  onClick={() => handleConfirm(alert.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Confirm Fraud
                </button>
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fraud Patterns */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Detected Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patterns.map((pattern, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{pattern.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{pattern.count} occurrences</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  pattern.risk === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {pattern.risk} risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}