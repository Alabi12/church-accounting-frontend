// pages/Expenses/ExpenseList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ExpenseList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    account: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const statuses = ['all', 'PENDING', 'APPROVED', 'REJECTED', 'POSTED'];
  const categories = [
    'Salaries',
    'Utilities',
    'Rent',
    'Office Supplies',
    'Equipment',
    'Maintenance',
    'Travel',
    'Training',
    'Ministry Programs',
    'Outreach',
    'Missions',
    'Other'
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses');
      setExpenses(response.data.expenses || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    // Apply account filter
    if (filters.account !== 'all') {
      filtered = filtered.filter(e => e.account_id === parseInt(filters.account));
    }

    // Apply date range
    if (filters.startDate) {
      filtered = filtered.filter(e => e.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(e => e.date <= filters.endDate);
    }

    // Apply search
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(term) ||
        e.reference?.toLowerCase().includes(term) ||
        e.vendor?.toLowerCase().includes(term)
      );
    }

    setFilteredExpenses(filtered);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteDialog.id}`);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(error.response?.data?.error || 'Failed to delete expense');
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'POSTED': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'REJECTED': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'POSTED': return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getAccountIcon = (accountType) => {
    return accountType === 'bank' ? BuildingOfficeIcon : BanknotesIcon;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and track all church expenses
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/expenses/add')}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Expense
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-yellow-200">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-green-200">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-200">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalAmount, 'GHS')}
            </p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search by description, reference..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setFilters({
                  status: 'all',
                  category: 'all',
                  account: 'all',
                  startDate: '',
                  endDate: '',
                  search: ''
                })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((expense) => {
                    const AccountIcon = getAccountIcon(expense.account_type);
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {expense.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center">
                            <AccountIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {expense.account_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                          {formatCurrency(expense.amount, 'GHS')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(expense.status)}`}>
                            {getStatusIcon(expense.status)}
                            <span className="ml-1">{expense.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedExpense(expense);
                                setShowDetails(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {expense.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => setDeleteDialog({ open: true, id: expense.id })}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No expenses found</p>
                      <p className="text-sm">Create your first expense to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {/* Expense Details Modal */}
      {showDetails && selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          onClose={() => {
            setShowDetails(false);
            setSelectedExpense(null);
          }}
          onRefresh={fetchExpenses}
        />
      )}
    </div>
  );
};

export default ExpenseList;