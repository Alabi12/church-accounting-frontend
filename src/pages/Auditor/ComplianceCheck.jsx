// pages/Auditor/ComplianceCheck.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  CalendarIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ComplianceCheck() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    warning: 0
  });
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedChecks, setExpandedChecks] = useState({});
  const [runningCheck, setRunningCheck] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleCheckId, setScheduleCheckId] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    fetchComplianceData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchComplianceData(true), 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchComplianceData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      
      const response = await api.get('/audit/compliance-checks');
      const data = response.data;
      
      setChecks(data.checks || []);
      setSummary(data.summary || {
        total: 0,
        passed: 0,
        failed: 0,
        warning: 0
      });
      
      // Extract unique categories from real data
      const categories = [...new Set((data.checks || []).map(c => c.category).filter(Boolean))];
      setAvailableCategories(categories);
      
      if (showToast) toast.success('Compliance data refreshed');
      
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast.error('Failed to load compliance data');
      
      // Set empty data on error
      setChecks([]);
      setSummary({
        total: 0,
        passed: 0,
        failed: 0,
        warning: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRunCheck = async (checkId, checkName) => {
    if (!window.confirm(`Run compliance check "${checkName}"? This may take a few moments.`)) return;
    
    setRunningCheck(checkId);
    try {
      const response = await api.post(`/audit/compliance-checks/${checkId}/run`);
      toast.success(response.data.message || 'Compliance check completed');
      fetchComplianceData(true);
    } catch (error) {
      console.error('Error running check:', error);
      toast.error(error.response?.data?.error || 'Failed to run compliance check');
    } finally {
      setRunningCheck(null);
    }
  };

  const handleScheduleCheck = async (checkId, checkName) => {
    setScheduleCheckId(checkId);
    setScheduleDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setShowScheduleModal(true);
  };

  const confirmSchedule = async () => {
    if (!scheduleDate) {
      toast.error('Please select a schedule date');
      return;
    }
    
    try {
      await api.post(`/audit/compliance-checks/${scheduleCheckId}/schedule`, {
        schedule_date: scheduleDate
      });
      toast.success(`Compliance check scheduled for ${formatDate(scheduleDate)}`);
      setShowScheduleModal(false);
      setScheduleCheckId(null);
      setScheduleDate('');
    } catch (error) {
      console.error('Error scheduling check:', error);
      toast.error('Failed to schedule compliance check');
    }
  };

  const getUniqueCategories = () => {
    return ['all', ...availableCategories];
  };

  const getUniqueStatuses = () => {
    return ['all', 'passed', 'failed', 'warning'];
  };

  const filteredChecks = checks.filter(check => {
    if (categoryFilter !== 'all' && check.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && check.status !== statusFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return check.name.toLowerCase().includes(searchLower) ||
             check.category.toLowerCase().includes(searchLower) ||
             (check.findings && check.findings.some(f => f.toLowerCase().includes(searchLower)));
    }
    return true;
  });

  const toggleExpand = (checkId) => {
    setExpandedChecks(prev => ({
      ...prev,
      [checkId]: !prev[checkId]
    }));
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'passed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const complianceScore = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Checks</h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor and manage regulatory compliance across all departments
            </p>
          </div>
          <button
            onClick={() => fetchComplianceData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Checks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Passed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{summary.passed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.warning}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{summary.failed}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                {getUniqueCategories().map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                {getUniqueStatuses().map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Checks List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Compliance Checks
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredChecks.length} of {checks.length})
              </span>
            </h2>
          </div>
          {filteredChecks.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No compliance checks found</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-4 text-[rgb(31,178,86)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredChecks.map((check) => (
                <div key={check.id} className="hover:bg-gray-50 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(check.status)}
                          <h3 className="text-base font-semibold text-gray-900">{check.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(check.status)}`}>
                            {check.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{check.description || 'Compliance check for regulatory requirements'}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>Category: {check.category}</span>
                          <span>Last Check: {formatDate(check.lastCheck)}</span>
                          <span>Next Due: {formatDate(check.nextDue)}</span>
                          {check.lastRunBy && <span>Last Run By: {check.lastRunBy}</span>}
                        </div>
                        
                        {/* Expandable Findings Section */}
                        {check.findings && check.findings.length > 0 && (
                          <div className="mt-3">
                            <button
                              onClick={() => toggleExpand(check.id)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              {expandedChecks[check.id] ? (
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )}
                              {expandedChecks[check.id] ? 'Hide' : 'Show'} Findings ({check.findings.length})
                            </button>
                            {expandedChecks[check.id] && (
                              <div className="mt-2 pl-4 border-l-2 border-yellow-300">
                                {check.findings.map((finding, idx) => (
                                  <div key={idx} className="flex items-start gap-2 mb-2">
                                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5" />
                                    <span className="text-xs text-gray-600">{finding}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCheck(check);
                            setShowDetails(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleScheduleCheck(check.id, check.name)}
                          className="px-3 py-1.5 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <CalendarIcon className="h-4 w-4 inline mr-1" />
                          Schedule
                        </button>
                        <button
                          onClick={() => handleRunCheck(check.id, check.name)}
                          disabled={runningCheck === check.id}
                          className="px-3 py-1.5 text-sm text-white bg-[rgb(31,178,86)] rounded-lg hover:bg-[rgb(25,142,69)] transition-colors disabled:opacity-50"
                        >
                          {runningCheck === check.id ? 'Running...' : 'Run Check'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compliance Score */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Compliance Score</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    complianceScore >= 90 ? 'bg-green-500' :
                    complianceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${complianceScore}%` }}
                />
              </div>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-3xl font-bold text-gray-900">{Math.round(complianceScore)}%</span>
              <p className="text-sm text-gray-500 mt-1">
                {summary.passed} out of {summary.total} compliance checks passed
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Passed: {summary.passed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">Warnings: {summary.warning}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Failed: {summary.failed}</span>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {showDetails && selectedCheck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedCheck.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">Compliance Check Details</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedCheck.status)}`}>
                        {getStatusIcon(selectedCheck.status)}
                        {selectedCheck.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedCheck.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Last Check</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedCheck.lastCheck)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Next Due</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedCheck.nextDue)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Last Run By</dt>
                    <dd className="mt-1 text-sm text-gray-900">{selectedCheck.lastRunBy || 'System'}</dd>
                  </div>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-600">{selectedCheck.description || 'No description available'}</dd>
                </div>
                
                {selectedCheck.findings && selectedCheck.findings.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-700">Findings</dt>
                    <dd className="mt-2 space-y-2">
                      {selectedCheck.findings.map((finding, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-yellow-800">{finding}</span>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleRunCheck(selectedCheck.id, selectedCheck.name);
                    setShowDetails(false);
                  }}
                  disabled={runningCheck === selectedCheck.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-lg hover:bg-[rgb(25,142,69)]"
                >
                  {runningCheck === selectedCheck.id ? 'Running...' : 'Run Check'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Compliance Check</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  The compliance check will be scheduled for the selected date. You will receive a notification when it's time to run the check.
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSchedule}
                  className="px-4 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-lg hover:bg-[rgb(25,142,69)]"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}