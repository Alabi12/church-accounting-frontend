// pages/Treasurer/BudgetList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    search: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    currentPage: 1
  });
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchBudgets();
  }, [filters.page]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await treasurerService.getBudgets({
        status: filters.status !== 'all' ? filters.status : undefined,
        department: filters.department !== 'all' ? filters.department : undefined,
        search: filters.search || undefined,
        page: filters.page,
        perPage: 10
      });
      
      setBudgets(response.budgets || []);
      setStats(response.stats || {});
      setPagination({
        total: response.total || 0,
        pages: response.pages || 1,
        currentPage: response.currentPage || 1
      });

      // Extract unique departments for filter
      if (response.budgets) {
        const depts = [...new Set(response.budgets.map(b => b.department).filter(Boolean))];
        setDepartments(depts);
      }

    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchBudgets();
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
    setTimeout(() => fetchBudgets(), 100);
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    
    setActionLoading(prev => ({ ...prev, [budgetId]: 'delete' }));
    try {
      await treasurerService.deleteBudget(budgetId);
      toast.success('Budget deleted');
      fetchBudgets();
    } catch (error) {
      toast.error('Failed to delete budget');
    } finally {
      setActionLoading(prev => ({ ...prev, [budgetId]: null }));
    }
  };

  const handleSubmit = async (budgetId) => {
    if (!window.confirm('Submit this budget for approval?')) return;
    
    setActionLoading(prev => ({ ...prev, [budgetId]: 'submit' }));
    try {
      await treasurerService.submitBudgetForApproval(budgetId);
      toast.success('Budget submitted for approval');
      fetchBudgets();
    } catch (error) {
      toast.error('Failed to submit budget');
    } finally {
      setActionLoading(prev => ({ ...prev, [budgetId]: null }));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'DRAFT': return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'REJECTED': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  if (loading && budgets.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <Link
            to="/treasurer/budgets/create"
            className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Budget
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-yellow-200">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-green-200">
            <p className="text-xs text-gray-500">Approved</p>
            <p className="text-xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <p className="text-xs text-gray-500">Rejected</p>
            <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-200">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-[rgb(31,178,86)] hover:underline flex items-center"
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search budgets..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Search
            </button>
          </form>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                >
                  <option value="all">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Budget List */}
        <div className="space-y-4">
          {budgets.length > 0 ? (
            budgets.map((budget) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(budget.status)}
                        <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(budget.status)}`}>
                          {budget.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Department:</span>
                          <span className="ml-2 font-medium">{budget.department}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fiscal Year:</span>
                          <span className="ml-2 font-medium">{budget.fiscalYear}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {formatCurrency(budget.amount)}
                          </span>
                        </div>
                      </div>

                      {budget.description && (
                        <p className="text-sm text-gray-600 mb-2">{budget.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>Created: {formatDate(budget.created_at)}</span>
                        {budget.submittedDate && (
                          <span>Submitted: {formatDate(budget.submittedDate)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => navigate(`/treasurer/budgets/${budget.id}`)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {budget.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => navigate(`/treasurer/budgets/${budget.id}/edit`)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleSubmit(budget.id)}
                            disabled={actionLoading[budget.id] === 'submit'}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
                            title="Submit for Approval"
                          >
                            {actionLoading[budget.id] === 'submit' ? (
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <PaperAirplaneIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            disabled={actionLoading[budget.id] === 'delete'}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            {actionLoading[budget.id] === 'delete' ? (
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
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
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Budgets Found</h3>
              <p className="text-gray-500 mb-4">
                {filters.search || filters.status !== 'all' || filters.department !== 'all'
                  ? 'No budgets match your filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first budget.'}
              </p>
              <Link
                to="/treasurer/budgets/create"
                className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)]"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Budget
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center space-x-2">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            {[...Array(pagination.pages).keys()].map(i => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                className={`px-3 py-1 border rounded-md text-sm ${
                  page === filters.page
                    ? 'bg-[rgb(31,178,86)] text-white border-[rgb(31,178,86)]'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetList;