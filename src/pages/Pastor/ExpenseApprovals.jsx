// src/pages/Pastor/ExpenseApprovals.jsx
import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ExpenseApprovals() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending',
    department: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchExpenses();
    fetchDepartments();
  }, [filters]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/pastor/departments');
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchExpenses = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.department !== 'all') params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/pastor/expense-approvals?${params.toString()}`);
      const expensesData = response.data.expenses || [];
      setExpenses(expensesData);
      setStats(response.data.stats || {
        pending: expensesData.filter(e => e.status === 'pending').length,
        approved: expensesData.filter(e => e.status === 'approved').length,
        rejected: expensesData.filter(e => e.status === 'rejected').length,
        totalAmount: expensesData.reduce((sum, e) => sum + (e.amount || 0), 0)
      });
      
      if (showToast) toast.success('Expenses refreshed');
      
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
      setStats({
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0
      });
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/pastor/expense-approvals/${id}/approve`);
      toast.success('Expense approved successfully');
      fetchExpenses(true);
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error(error.response?.data?.error || 'Failed to approve expense');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await api.post(`/pastor/expense-approvals/${id}/reject`, { reason });
      toast.success('Expense rejected');
      fetchExpenses(true);
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast.error(error.response?.data?.error || 'Failed to reject expense');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3" /> Approved
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
          <XCircleIcon className="h-3 w-3" /> Rejected
        </span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3" /> Pending
        </span>;
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Approvals</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and approve expense requests from departments
            </p>
          </div>
          <button
            onClick={() => fetchExpenses(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by description, requester..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9 w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        {expenses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No expense requests found</p>
            <p className="text-sm text-gray-400 mt-1">Try changing your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-base font-semibold text-gray-900">{expense.description}</h3>
                      {getStatusBadge(expense.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-sm text-gray-900">{formatDate(expense.date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm text-gray-900">{expense.department || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Requested By</p>
                        <p className="text-sm text-gray-900">{expense.requestedBy || 'Unknown'}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Justification:</span> {expense.justification || 'No justification provided'}
                    </p>

                    {expense.approvedBy && expense.approvedDate && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Approved by {expense.approvedBy} on {formatDate(expense.approvedDate)}
                        </p>
                      </div>
                    )}

                    {expense.rejectionReason && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-red-600">
                          Rejection reason: {expense.rejectionReason}
                        </p>
                      </div>
                    )}

                    {expense.attachments && expense.attachments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {expense.attachments.map((file, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              📎 {file}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowDetails(true);
                      }}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View
                    </button>
                    {expense.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(expense.id)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(expense.id)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Expense Details</h2>
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
              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="text-sm font-medium text-gray-900">{selectedExpense.description}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Amount</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCurrency(selectedExpense.amount)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date</dt>
                  <dd className="text-sm text-gray-900">{formatDate(selectedExpense.date)}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Department</dt>
                  <dd className="text-sm text-gray-900">{selectedExpense.department || 'General'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd className="text-sm text-gray-900">{selectedExpense.category || 'Other'}</dd>
                </div>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Requested By</dt>
                <dd className="text-sm text-gray-900">{selectedExpense.requestedBy} on {formatDate(selectedExpense.submittedDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Justification</dt>
                <dd className="text-sm bg-gray-50 p-3 rounded-lg text-gray-700">{selectedExpense.justification || 'No justification provided'}</dd>
              </div>
              {selectedExpense.approvedBy && (
                <div>
                  <dt className="text-sm text-gray-500">Approval Details</dt>
                  <dd className="text-sm text-gray-700">Approved by {selectedExpense.approvedBy} on {formatDate(selectedExpense.approvedDate)}</dd>
                </div>
              )}
              {selectedExpense.rejectionReason && (
                <div>
                  <dt className="text-sm text-gray-500">Rejection Reason</dt>
                  <dd className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{selectedExpense.rejectionReason}</dd>
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
              {selectedExpense.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleReject(selectedExpense.id);
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedExpense.id);
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}