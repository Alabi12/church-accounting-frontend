// pages/budgets/BudgetList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { budgetService } from '../../services/budgets';
import BudgetCard from '../../components/budgets/BudgetCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetList = () => {
  const navigate = useNavigate();
  const { isTreasurer, isSuperAdmin, user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalBudget: 0
  });
  const [filters, setFilters] = useState({
    fiscalYear: new Date().getFullYear(),
    department: 'all',
    status: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const departments = [
    'WORSHIP MINISTRY',
    'YOUTH MINISTRY',
    'CHILDREN MINISTRY',
    'OUTREACH',
    'MISSIONS',
    'FACILITIES',
    'ADMINISTRATION',
    'EDUCATION',
    'PASTORAL',
    'TECHNOLOGY',
    'EVENTS',
    'MEDIA'
  ];

  const statuses = ['all', 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

  useEffect(() => {
    fetchBudgets();
  }, [filters.fiscalYear, filters.department, filters.status]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      console.log('Fetching budgets with filters:', filters);
      const response = await budgetService.getBudgets(filters);
      console.log('Budgets response:', response);
      
      setBudgets(response.budgets || []);
      setStats(response.stats || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalBudget: 0
      });
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBudgets();
  };

  const clearFilters = () => {
    setFilters({
      fiscalYear: new Date().getFullYear(),
      department: 'all',
      status: 'all',
      search: ''
    });
  };

  const canCreateBudget = isTreasurer || isSuperAdmin;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and track departmental budgets
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
              onClick={fetchBudgets}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
            {canCreateBudget && (
              <button
                onClick={() => navigate('/treasurer/budgets/create')}
                className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Budget
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Budgets</p>
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
            <p className="text-sm text-gray-500">Total Budget</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalBudget, 'GHS')}
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
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiscal Year
                  </label>
                  <input
                    type="number"
                    value={filters.fiscalYear}
                    onChange={(e) => handleFilterChange('fiscalYear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    min="2000"
                    max="2100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Statuses' : status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search budgets..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-md hover:bg-[rgb(25,142,69)]"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Budget Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onUpdate={fetchBudgets}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Budgets Found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.department !== 'all' || filters.status !== 'all'
                ? 'No budgets match your filters. Try adjusting your search criteria.'
                : 'Get started by creating your first budget.'}
            </p>
            {canCreateBudget && (
              <button
                onClick={() => navigate('/treasurer/budgets/create')}
                className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Budget
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetList;