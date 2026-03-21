import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { approvalService } from '../../services/approval';
import { journalService } from '../../services/journal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PendingApprovals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingItems, setPendingItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    returned: 0
  });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // In PendingApprovals.jsx, replace the fetchPendingApprovals function:

const fetchPendingApprovals = async () => {
  try {
    setLoading(true);
    
    console.log('📋 Fetching pending journal entries...');
    
    // Fetch journal entries with status PENDING directly
    const response = await journalService.getJournalEntries({
      status: 'PENDING',
      perPage: 100
    });
    
    console.log('📊 Pending journal entries:', response);
    
    const entries = response.entries || [];
    
    // Transform to match the expected format
    const itemsWithDetails = entries.map(entry => ({
      id: `je-${entry.id}`,
      entityId: entry.id,
      entityType: 'journal_entry',
      description: entry.description,
      amount: entry.total_debit || entry.total_credit || 0,
      status: entry.status,
      currentStep: 1,
      totalSteps: 2,
      submittedBy: entry.created_by_name || 'Unknown',
      submittedAt: entry.created_at,
      notes: '',
      comments: [],
      entryNumber: entry.entry_number,
      currentApprover: 'Treasurer',
      workflowName: 'Journal Entry Approval'
    }));
    
    console.log('✅ Transformed items:', itemsWithDetails);
    setPendingItems(itemsWithDetails);
    
    // Calculate stats
    setStats({
      total: itemsWithDetails.length,
      pending: itemsWithDetails.filter(i => i.status === 'PENDING').length,
      approved: itemsWithDetails.filter(i => i.status === 'APPROVED').length,
      rejected: itemsWithDetails.filter(i => i.status === 'REJECTED').length,
      returned: itemsWithDetails.filter(i => i.status === 'RETURNED').length
    });
    
  } catch (error) {
    console.error('❌ Error fetching pending entries:', error);
    toast.error('Failed to load pending entries');
    
    setPendingItems([]);
    setStats({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      returned: 0
    });
  } finally {
    setLoading(false);
  }
};

  // Helper function to create approval item from basic approval data
  const createApprovalItem = (approval) => {
    return {
      id: approval.id,
      entityId: approval.entity_id || approval.entityId,
      entityType: approval.entity_type || approval.entityType || 'journal_entry',
      description: approval.description || 'Journal Entry',
      amount: 0,
      status: approval.status || 'PENDING',
      currentStep: approval.current_step || approval.currentStep || 1,
      totalSteps: approval.total_steps || approval.totalSteps || 2,
      submittedBy: approval.requester_name || approval.requester || 'Unknown',
      submittedAt: approval.submitted_at || approval.submittedAt || new Date().toISOString(),
      notes: approval.notes || '',
      comments: approval.comments || [],
      entryNumber: approval.entry_number || `JE-${approval.entity_id || approval.entityId}`,
      currentApprover: approval.current_approver_name || approval.currentApprover || 'Treasurer',
      workflowName: approval.workflow_name || approval.workflowName || 'Approval Workflow'
    };
  };

  const getFilteredItems = () => {
    let filtered = pendingItems;
    
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.status === filter.toUpperCase());
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.description?.toLowerCase().includes(term) ||
        item.entryNumber?.toLowerCase().includes(term) ||
        item.submittedBy?.toLowerCase().includes(term) ||
        item.workflowName?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'APPROVED': 'bg-green-100 text-green-800 border-green-200',
      'REJECTED': 'bg-red-100 text-red-800 border-red-200',
      'RETURNED': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'RETURNED':
        return <ArrowPathIcon className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track the status of your submitted journal entries
            </p>
          </div>
          <button
            onClick={fetchPendingApprovals}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-yellow-200">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-green-200">
            <p className="text-xs text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-red-200">
            <p className="text-xs text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-orange-200">
            <p className="text-xs text-gray-500">Returned</p>
            <p className="text-2xl font-bold text-orange-600">{stats.returned}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex space-x-2 flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-[rgb(31,178,86)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'approved'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'rejected'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejected
                </button>
                <button
                  onClick={() => setFilter('returned')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'returned'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Returned
                </button>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3 flex-wrap gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Submitted {formatDate(item.submittedAt)}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {item.submittedBy}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.description || `Journal Entry #${item.entityId}`}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">Entry Number</p>
                        <p className="font-medium text-gray-900">{item.entryNumber || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">Amount</p>
                        <p className="font-medium text-purple-600">
                          <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                          {formatCurrency(item.amount || 0)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">Progress</p>
                        <p className="font-medium text-gray-900">
                          Step {item.currentStep || 0} of {item.totalSteps || 1}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-[rgb(31,178,86)] h-1.5 rounded-full" 
                            style={{ width: `${((item.currentStep || 0) / (item.totalSteps || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">Current Approver</p>
                        <p className="font-medium text-gray-900">{item.currentApprover || 'Treasurer'}</p>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Your notes:</span> {item.notes}
                        </p>
                      </div>
                    )}

                    {item.comments && item.comments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Approval Comments:</p>
                        <div className="space-y-2">
                          {item.comments.map((comment, idx) => (
                            <div key={idx} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center mb-1">
                                <span className="font-medium text-gray-800">{comment.user || 'System'}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {comment.createdAt ? formatDate(comment.createdAt) : ''}
                                </span>
                              </div>
                              <p className="text-gray-700">{comment.text || comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.status === 'RETURNED' && (
                      <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-start">
                          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">Returned for Correction</p>
                            <p className="text-sm text-orange-700 mt-1">
                              Please review the comments above and make the necessary changes.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => navigate(`/accountant/journal-entries/view/${item.entityId}`)}
                      className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] text-sm transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    
                    {item.status === 'RETURNED' && (
                      <button
                        onClick={() => navigate(`/accountant/journal-entries/edit/${item.entityId}`)}
                        className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Edit & Resubmit
                      </button>
                    )}
                    
                    {item.status === 'PENDING' && (
                      <button
                        onClick={() => navigate(`/accountant/journal-entries/${item.entityId}`)}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-colors"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your filters or search term'
                  : 'You haven\'t submitted any journal entries yet'}
              </p>
              {!searchTerm && filter === 'all' && (
                <button
                  onClick={() => navigate('/accountant/journal-entries/new')}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Create New Journal Entry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingApprovals;