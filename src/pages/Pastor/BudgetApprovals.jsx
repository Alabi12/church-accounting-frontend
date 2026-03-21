// pages/Pastor/BudgetApprovals.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon, // Add this
} from '@heroicons/react/24/outline';
import { pastorService } from '../../services/pastor';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetApprovals = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchPendingBudgets();
  }, []);

  useEffect(() => {
    filterBudgets();
  }, [searchTerm, statusFilter, priorityFilter, budgets]);

  const fetchPendingBudgets = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching pending budgets...');
      const response = await pastorService.getPendingBudgets();
      console.log('📦 Response:', response);
      
      const pendingBudgets = response.budgets || [];
      setBudgets(pendingBudgets);
      setFilteredBudgets(pendingBudgets);
      
      // Calculate stats from the actual data
      const highPriority = pendingBudgets.filter(b => b.priority === 'HIGH').length;
      const mediumPriority = pendingBudgets.filter(b => b.priority === 'MEDIUM').length;
      const lowPriority = pendingBudgets.filter(b => b.priority === 'LOW').length;
      const totalAmount = pendingBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
      
      setStats({
        total: response.stats?.total || pendingBudgets.length,
        pending: pendingBudgets.length,
        approved: response.stats?.approved || 0,
        rejected: response.stats?.rejected || 0,
        highPriority: response.stats?.highPriority || highPriority,
        mediumPriority: mediumPriority,
        lowPriority: lowPriority,
        totalAmount: response.stats?.totalAmount || totalAmount
      });
      
      if (pendingBudgets.length === 0) {
        toast.success('No pending budgets found');
      }
    } catch (error) {
      console.error('❌ Error fetching pending budgets:', error);
      toast.error(error.response?.data?.error || 'Failed to load pending budgets');
    } finally {
      setLoading(false);
    }
  };

  const filterBudgets = () => {
    let filtered = [...budgets];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter.toUpperCase());
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(b => b.priority === priorityFilter.toUpperCase());
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.name?.toLowerCase().includes(term) ||
        b.department?.toLowerCase().includes(term) ||
        b.description?.toLowerCase().includes(term) ||
        b.submittedBy?.toLowerCase().includes(term)
      );
    }

    setFilteredBudgets(filtered);
  };

  const handleApprove = async (budgetId) => {
    if (!window.confirm('Are you sure you want to approve this budget?')) return;
    
    setActionLoading(prev => ({ ...prev, [budgetId]: 'approve' }));
    try {
      console.log(`✅ Approving budget ${budgetId}...`);
      await pastorService.approveBudget(budgetId);
      toast.success('Budget approved successfully');
      
      // Refresh the list
      await fetchPendingBudgets();
      
    } catch (error) {
      console.error('❌ Error approving budget:', error);
      toast.error(error.response?.data?.error || 'Failed to approve budget');
    } finally {
      setActionLoading(prev => ({ ...prev, [budgetId]: null }));
    }
  };

  const handleReject = async (budgetId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    setActionLoading(prev => ({ ...prev, [budgetId]: 'reject' }));
    try {
      console.log(`❌ Rejecting budget ${budgetId} with reason: ${reason}`);
      await pastorService.rejectBudget(budgetId, reason);
      toast.success('Budget rejected');
      
      // Refresh the list
      await fetchPendingBudgets();
      
    } catch (error) {
      console.error('❌ Error rejecting budget:', error);
      toast.error(error.response?.data?.error || 'Failed to reject budget');
    } finally {
      setActionLoading(prev => ({ ...prev, [budgetId]: null }));
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'DRAFT': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'REJECTED': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      'HIGH': 'bg-red-100 text-red-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/pastor/dashboard')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Budget Approvals</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Pending</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-yellow-200">
            <p className="text-sm text-gray-500">Medium Priority</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.mediumPriority}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-green-200">
            <p className="text-sm text-gray-500">Low Priority</p>
            <p className="text-2xl font-bold text-green-600">{stats.lowPriority}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, department, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] w-full"
            />
          </div>

          {/* Filter Buttons */}
          <div className="space-y-4">
            {/* Status Filters */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">STATUS</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-[rgb(31,178,86)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'approved'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>

            {/* Priority Filters */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">PRIORITY</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPriorityFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    priorityFilter === 'all'
                      ? 'bg-[rgb(31,178,86)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPriorityFilter('high')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    priorityFilter === 'high'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  High
                </button>
                <button
                  onClick={() => setPriorityFilter('medium')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    priorityFilter === 'medium'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setPriorityFilter('low')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    priorityFilter === 'low'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Low
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(27,158,76)] font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {filteredBudgets.length} of {budgets.length} budgets
          </p>
          <button
            onClick={fetchPendingBudgets}
            className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(27,158,76)] font-medium"
          >
            Refresh
          </button>
        </div>

        {/* Budget List */}
        <div className="space-y-4">
          {filteredBudgets.length > 0 ? (
            filteredBudgets.map((budget) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(budget.status)}
                        <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(budget.status)}`}>
                          {budget.status}
                        </span>
                        {budget.priority && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(budget.priority)}`}>
                            {budget.priority}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {budget.department}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          FY {budget.fiscalYear || budget.fiscal_year}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {formatCurrency(budget.amount, 'GHS')}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {budget.daysPending || 0} {budget.daysPending === 1 ? 'day' : 'days'} pending
                        </div>
                      </div>

                      {budget.description && (
                        <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                          {budget.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-400">
                          Submitted by: {budget.submittedBy || 'Unknown'} on {formatDate(budget.submittedDate)}
                        </p>
                        {budget.commentCount > 0 && (
                          <p className="text-xs text-gray-400">
                            {budget.commentCount} comment{budget.commentCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/pastor/budgets/${budget.id}`)}
                        className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {budget.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(budget.id)}
                            disabled={actionLoading[budget.id] === 'approve'}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                          >
                            {actionLoading[budget.id] === 'approve' ? (
                              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(budget.id)}
                            disabled={actionLoading[budget.id] === 'reject'}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                          >
                            {actionLoading[budget.id] === 'reject' ? (
                              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <XCircleIcon className="h-4 w-4 mr-2" />
                            )}
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Budgets Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No budgets match your filters. Try adjusting your search criteria.'
                  : 'No budgets awaiting approval at this time.'}
              </p>
              {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)]"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={fetchPendingBudgets}
                className="mt-4 ml-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetApprovals;