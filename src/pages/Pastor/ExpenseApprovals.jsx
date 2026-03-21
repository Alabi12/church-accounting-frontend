import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ExpenseApprovals() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
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
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/pastor/expense-approvals?${params}`);
      setExpenses(response.data.expenses || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setMockExpenses();
    } finally {
      setLoading(false);
    }
  };

  const setMockExpenses = () => {
    setExpenses([
      {
        id: 1,
        date: '2024-03-15',
        description: 'Youth Ministry Event Supplies',
        amount: 850.00,
        category: 'Ministry',
        department: 'Youth Ministry',
        requestedBy: 'John Youth Pastor',
        submittedDate: '2024-03-10',
        status: 'pending',
        justification: 'Supplies for upcoming youth retreat including games, snacks, and materials.',
        attachments: ['receipt.pdf', 'event_proposal.docx']
      },
      {
        id: 2,
        date: '2024-03-14',
        description: 'Worship Sound Equipment',
        amount: 1250.00,
        category: 'Equipment',
        department: 'Worship',
        requestedBy: 'Sarah Worship Leader',
        submittedDate: '2024-03-12',
        status: 'pending',
        justification: 'Replacement microphone and cables for sanctuary sound system.',
        attachments: ['quote.pdf']
      },
      {
        id: 3,
        date: '2024-03-10',
        description: 'Outreach Program Materials',
        amount: 450.00,
        category: 'Outreach',
        department: 'Outreach',
        requestedBy: 'Mike Outreach',
        submittedDate: '2024-03-08',
        status: 'approved',
        approvedBy: 'Pastor John',
        approvedDate: '2024-03-11',
        justification: 'Bibles and pamphlets for community outreach event.'
      },
    ]);

    setStats({
      pending: 5,
      approved: 12,
      rejected: 2,
      totalAmount: 8750
    });
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/pastor/expense-approvals/${id}/approve`);
      toast.success('Expense approved successfully');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to approve expense');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await api.post(`/pastor/expense-approvals/${id}/reject`, { reason });
      toast.success('Expense rejected');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to reject expense');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expense Approvals</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Departments</option>
              <option value="Youth Ministry">Youth Ministry</option>
              <option value="Worship">Worship</option>
              <option value="Outreach">Outreach</option>
              <option value="Missions">Missions</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">{expense.description}</h3>
                  {getStatusBadge(expense.status)}
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm text-gray-900">{formatDate(expense.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm text-gray-900">{expense.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Requested By</p>
                    <p className="text-sm text-gray-900">{expense.requestedBy}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-4">
                  <span className="font-medium">Justification:</span> {expense.justification}
                </p>

                {expense.attachments && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                    <div className="flex space-x-2">
                      {expense.attachments.map((file, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-6 flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setSelectedExpense(expense);
                    setShowDetails(true);
                  }}
                  className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </button>
                {expense.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(expense.id)}
                      className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(expense.id)}
                      className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {showDetails && selectedExpense && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Expense Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="text-sm font-medium">{selectedExpense.description}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Amount</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCurrency(selectedExpense.amount)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date</dt>
                  <dd className="text-sm">{formatDate(selectedExpense.date)}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Department</dt>
                  <dd className="text-sm">{selectedExpense.department}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd className="text-sm">{selectedExpense.category}</dd>
                </div>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Requested By</dt>
                <dd className="text-sm">{selectedExpense.requestedBy} on {formatDate(selectedExpense.submittedDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Justification</dt>
                <dd className="text-sm bg-gray-50 p-3 rounded">{selectedExpense.justification}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedExpense.id);
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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