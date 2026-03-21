import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { budgetService } from '../../services/budgets';
import { approvalService } from '../../services/approval';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BudgetApprovalPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const budgetId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingBudgets, setPendingBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    department: 'all',
    fiscalYear: new Date().getFullYear(),
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });
  const [approvalDialog, setApprovalDialog] = useState({ 
    isOpen: false, 
    id: null, 
    action: null, 
    comments: '' 
  });

  const departments = [
    'Worship Ministry',
    'Youth Ministry',
    'Children Ministry',
    'Outreach',
    'Missions',
    'Facilities',
    'Administration',
    'Education',
    'Pastoral',
    'Technology',
    'Events',
    'Media'
  ];

  const fiscalYears = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
    new Date().getFullYear() + 2
  ];

  useEffect(() => {
    fetchPendingBudgets();
  }, [filters]);

  useEffect(() => {
    if (budgetId && pendingBudgets.length > 0) {
      const budget = pendingBudgets.find(b => b.id === parseInt(budgetId));
      if (budget) {
        handleViewDetails(budget);
      }
    }
  }, [budgetId, pendingBudgets]);

  const fetchPendingBudgets = async () => {
    try {
      setLoading(true);
      
      // Get pending approvals from approval service
      const approvalsRes = await approvalService.getPendingApprovals('budget');
      const approvals = approvalsRes.approvals || [];
      
      // Transform to match component expectations
      const budgets = approvals.map(approval => ({
        id: approval.entity_id,
        requestId: approval.id,
        name: approval.budgetName || `Budget #${approval.entity_id}`,
        department: approval.department || 'General',
        amount: approval.amount || 0,
        fiscalYear: approval.fiscalYear || new Date().getFullYear(),
        status: approval.status,
        submittedBy: approval.requester || 'Unknown',
        submittedDate: approval.submittedAt || new Date().toISOString(),
        notes: approval.notes || '',
        description: approval.description || '',
        justification: approval.justification || '',
        currentStep: approval.currentStep || 0,
        totalSteps: approval.totalSteps || 1
      }));

      // Apply filters
      let filtered = budgets;
      if (filters.status !== 'all') {
        filtered = filtered.filter(b => b.status.toLowerCase() === filters.status);
      }
      if (filters.department !== 'all') {
        filtered = filtered.filter(b => b.department === filters.department);
      }
      if (filters.fiscalYear) {
        filtered = filtered.filter(b => b.fiscalYear === filters.fiscalYear);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(b => 
          b.name.toLowerCase().includes(searchLower) ||
          b.department.toLowerCase().includes(searchLower) ||
          b.description?.toLowerCase().includes(searchLower)
        );
      }

      setPendingBudgets(filtered);
      
      // Calculate stats
      setStats({
        total: filtered.length,
        pending: filtered.filter(b => b.status === 'pending').length,
        approved: filtered.filter(b => b.status === 'approved').length,
        rejected: filtered.filter(b => b.status === 'rejected').length,
        totalAmount: filtered.reduce((sum, b) => sum + b.amount, 0)
      });

    } catch (error) {
      console.error('Error fetching pending budgets:', error);
      toast.error('Failed to load pending budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (budget) => {
    setSelectedBudget(budget);
    setShowDetails(true);
  };

  const handleApprovalAction = async () => {
    const { id, action, comments } = approvalDialog;
    
    setSubmitting(true);
    try {
      let response;
      
      if (action === 'approve') {
        response = await approvalService.approveRequest(id, comments);
        toast.success('Budget approved successfully');
      } else if (action === 'reject') {
        response = await approvalService.rejectRequest(id, comments);
        toast.success('Budget rejected');
      } else if (action === 'return') {
        response = await approvalService.returnForCorrection(id, comments);
        toast.success('Budget returned for revision');
      }

      // Update budget status if needed
      if (response && response.entity_id) {
        if (action === 'approve') {
          await budgetService.approveBudget(response.entity_id);
        } else if (action === 'reject') {
          await budgetService.rejectBudget(response.entity_id, { reason: comments });
        }
      }

      fetchPendingBudgets();
      setShowDetails(false);
      setApprovalDialog({ isOpen: false, id: null, action: null, comments: '' });
    } catch (error) {
      console.error('Error in approval action:', error);
      toast.error(error.response?.data?.error || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'RETURNED': 'bg-orange-100 text-orange-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'returned': 'bg-orange-100 text-orange-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'returned':
        return <ArrowPathIcon className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getProgressSteps = (current, total) => {
    return `${current} of ${total}`;
  };

  if (loading && pendingBudgets.length === 0) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Budget Approvals</h1>
              <p className="mt-2 text-sm text-gray-600">
                Review and approve budgets submitted by the treasurer
              </p>
            </div>
          </div>
          <button
            onClick={fetchPendingBudgets}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Fiscal Year</label>
                <select
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters({ ...filters, fiscalYear: parseInt(e.target.value) })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                >
                  {fiscalYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search budgets..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Budgets List */}
        <div className="space-y-4">
          {pendingBudgets.length > 0 ? (
            pendingBudgets.map((budget) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusBadge(budget.status)}`}>
                        {getStatusIcon(budget.status)}
                        <span className="ml-1">{budget.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm font-medium text-gray-900">{budget.department}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fiscal Year</p>
                        <p className="text-sm text-gray-900">{budget.fiscalYear}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-bold text-purple-600">{formatCurrency(budget.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Submitted By</p>
                        <p className="text-sm text-gray-900">{budget.submittedBy}</p>
                      </div>
                    </div>

                    {budget.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{budget.notes}"</p>
                    )}

                    <div className="flex items-center mt-3 text-xs text-gray-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Submitted: {formatDate(budget.submittedDate)}
                      <span className="mx-2">•</span>
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Progress: {getProgressSteps(budget.currentStep, budget.totalSteps)}
                    </div>
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => handleViewDetails(budget)}
                      className="inline-flex items-center justify-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] text-sm"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Review
                    </button>
                    
                    <button
                      onClick={() => setApprovalDialog({ 
                        isOpen: true, 
                        id: budget.requestId, 
                        action: 'approve',
                        comments: ''
                      })}
                      className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <CheckBadgeIcon className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    
                    <button
                      onClick={() => setApprovalDialog({ 
                        isOpen: true, 
                        id: budget.requestId, 
                        action: 'return',
                        comments: ''
                      })}
                      className="inline-flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      Return
                    </button>
                    
                    <button
                      onClick={() => setApprovalDialog({ 
                        isOpen: true, 
                        id: budget.requestId, 
                        action: 'reject',
                        comments: ''
                      })}
                      className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <ScaleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Budgets</h3>
              <p className="text-gray-500">
                All budgets have been processed. Check back later for new submissions.
              </p>
            </div>
          )}
        </div>

        {/* Budget Details Modal */}
        {showDetails && selectedBudget && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Budget Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Budget Name</p>
                    <p className="font-medium">{selectedBudget.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{selectedBudget.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fiscal Year</p>
                    <p className="font-medium">{selectedBudget.fiscalYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(selectedBudget.amount)}</p>
                  </div>
                </div>

                {selectedBudget.description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium bg-gray-50 p-3 rounded">{selectedBudget.description}</p>
                  </div>
                )}

                {selectedBudget.justification && (
                  <div>
                    <p className="text-sm text-gray-500">Justification</p>
                    <p className="font-medium bg-gray-50 p-3 rounded">{selectedBudget.justification}</p>
                  </div>
                )}

                {selectedBudget.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes from Submitter</p>
                    <p className="font-medium bg-blue-50 p-3 rounded text-blue-800">{selectedBudget.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Approval Progress</p>
                  <div className="flex items-center">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[rgb(31,178,86)]"
                        style={{ width: `${(selectedBudget.currentStep / selectedBudget.totalSteps) * 100}%` }}
                      />
                    </div>
                    <span className="ml-3 text-sm font-medium">
                      {selectedBudget.currentStep}/{selectedBudget.totalSteps}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Submitted by</p>
                      <p className="font-medium">{selectedBudget.submittedBy}</p>
                      <p className="text-xs text-gray-400">{formatDate(selectedBudget.submittedDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setApprovalDialog({ 
                      isOpen: true, 
                      id: selectedBudget.requestId, 
                      action: 'reject',
                      comments: ''
                    })}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setApprovalDialog({ 
                      isOpen: true, 
                      id: selectedBudget.requestId, 
                      action: 'return',
                      comments: ''
                    })}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Return for Revision
                  </button>
                  <button
                    onClick={() => setApprovalDialog({ 
                      isOpen: true, 
                      id: selectedBudget.requestId, 
                      action: 'approve',
                      comments: ''
                    })}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Action Dialog */}
        {approvalDialog.isOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {approvalDialog.action === 'approve' && 'Approve Budget'}
                {approvalDialog.action === 'reject' && 'Reject Budget'}
                {approvalDialog.action === 'return' && 'Return for Revision'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {approvalDialog.action === 'approve' && 'This budget will be approved and can be activated for the fiscal year.'}
                {approvalDialog.action === 'reject' && 'This budget will be rejected. Please provide a reason.'}
                {approvalDialog.action === 'return' && 'This budget will be returned to the treasurer for revision.'}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments {approvalDialog.action !== 'approve' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={approvalDialog.comments}
                  onChange={(e) => setApprovalDialog({ ...approvalDialog, comments: e.target.value })}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  placeholder={
                    approvalDialog.action === 'approve' 
                      ? 'Optional approval notes...' 
                      : 'Please provide a reason...'
                  }
                  required={approvalDialog.action !== 'approve'}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setApprovalDialog({ isOpen: false, id: null, action: null, comments: '' })}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalAction}
                  disabled={
                    (approvalDialog.action !== 'approve' && !approvalDialog.comments.trim()) ||
                    submitting
                  }
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                    approvalDialog.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : approvalDialog.action === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {submitting ? 'Processing...' : 
                    approvalDialog.action === 'approve' ? 'Approve' :
                    approvalDialog.action === 'reject' ? 'Reject' : 'Return'
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetApprovalPage;