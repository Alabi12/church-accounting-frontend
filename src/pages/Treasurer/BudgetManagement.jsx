import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  FolderIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { budgetService } from '../../services/budgets';
import { accountService } from '../../services/account';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetManagement = () => {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    fiscalYear: new Date().getFullYear(),
    accountType: 'all',
    category: 'all',
    status: 'all'
  });
  const [accountCategories, setAccountCategories] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  // Fetch Chart of Accounts categories
  const fetchChartOfAccounts = useCallback(async () => {
    try {
      // Get all accounts to build categories
      const response = await accountService.getAccounts({ 
        church_id: user?.church_id,
        per_page: 1000
      });
      
      const accounts = response.accounts || [];
      
      // Extract unique categories and types from Chart of Accounts
      const categories = [...new Set(accounts
        .filter(a => a.category)
        .map(a => a.category)
      )].sort();
      
      const types = [...new Set(accounts
        .filter(a => a.account_type)
        .map(a => a.account_type)
      )].sort();
      
      setAccountCategories(categories);
      setAccountTypes(types);
      
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
    }
  }, [user?.church_id]);

  const fetchBudgets = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      const params = {
        fiscalYear: filters.fiscalYear,
        status: filters.status !== 'all' ? filters.status : undefined,
        accountType: filters.accountType !== 'all' ? filters.accountType : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
      };
      
      const response = await budgetService.getBudgets(params);
      
      const newBudgets = response.budgets || [];
      setBudgets(newBudgets);
      filterBudgets(newBudgets);
      setLastUpdate(Date.now());
      
    } catch (error) {
      console.error('Error fetching budgets:', error);
      if (showToast) {
        toast.error('Failed to refresh budgets');
      }
    } finally {
      setLoading(false);
      if (showToast) setRefreshing(false);
    }
  }, [filters]);

  const filterBudgets = (budgetList = budgets) => {
    let filtered = [...budgetList];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.account_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.account_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBudgets(filtered);
  };

  useEffect(() => {
    fetchChartOfAccounts();
  }, [fetchChartOfAccounts]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    filterBudgets();
  }, [searchTerm, budgets]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleBudgetUpdate = (data) => {
      console.log('🔔 Real-time budget update received:', data);
      
      toast.success(`Budget ${data.status}`, {
        icon: data.status === 'APPROVED' ? '✅' : '❌'
      });

      setBudgets(prev => prev.map(budget => 
        budget.id === data.budget_id 
          ? { ...budget, status: data.status }
          : budget
      ));
      
      fetchBudgets(true);
    };

    socket.on('budget_updated', handleBudgetUpdate);

    return () => {
      socket.off('budget_updated', handleBudgetUpdate);
    };
  }, [socket, fetchBudgets]);

  // Polling as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (!connected) {
        fetchBudgets(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [connected, fetchBudgets]);

  const handleRefresh = async () => {
    await fetchBudgets(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Debounce the fetch
    setTimeout(() => fetchBudgets(), 100);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'DRAFT': return <ClockIcon className="h-4 w-4 text-gray-500" />;
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'REJECTED': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getAccountTypeIcon = (type) => {
    switch(type?.toUpperCase()) {
      case 'ASSET':
        return <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />;
      case 'REVENUE':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'EXPENSE':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      case 'LIABILITY':
        return <BuildingOfficeIcon className="h-4 w-4 text-purple-500" />;
      case 'EQUITY':
        return <ChartBarIcon className="h-4 w-4 text-indigo-500" />;
      default:
        return <FolderIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-sm text-gray-600 mt-1">Based on Chart of Accounts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm">
            <span className={`h-2 w-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="text-gray-600">{connected ? 'Live' : 'Polling'}</span>
          </div>
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
            onClick={() => navigate('/treasurer/budgets/create')}
            className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Budget
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiscal Year
              </label>
              <select
                value={filters.fiscalYear}
                onChange={(e) => handleFilterChange('fiscalYear', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                value={filters.accountType}
                onChange={(e) => handleFilterChange('accountType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value="all">All Types</option>
                {accountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value="all">All Categories</option>
                {accountCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value="all">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search budgets by name, department, account code, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
          />
        </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(budget.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-gray-500">{budget.department}</p>
                        {budget.account_code && (
                          <>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center text-sm text-gray-500">
                              {getAccountTypeIcon(budget.account_type)}
                              <span className="ml-1">{budget.account_code}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(budget.status)}`}>
                    {budget.status}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center text-gray-600">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Budget Amount</p>
                      <p className="font-medium">{formatCurrency(budget.amount, 'GHS')}</p>
                    </div>
                  </div>
                  
                  {budget.account_category && (
                    <div className="flex items-center text-gray-600">
                      <FolderIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="font-medium">{budget.account_category}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Fiscal Year</p>
                      <p className="font-medium">FY {budget.fiscal_year || budget.fiscalYear}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-medium text-sm">{formatDate(budget.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Actual vs Budget Progress */}
                {budget.actual_spent !== undefined && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Actual vs Budget</span>
                      <span className="text-gray-600">
                        {formatCurrency(budget.actual_spent || 0)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ((budget.actual_spent || 0) / budget.amount) > 0.9 
                            ? 'bg-red-500' 
                            : ((budget.actual_spent || 0) / budget.amount) > 0.7 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(((budget.actual_spent || 0) / budget.amount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {budget.description && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{budget.description}</p>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => navigate(`/treasurer/budgets/edit/${budget.id}`)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  {budget.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => navigate(`/treasurer/budgets/edit/${budget.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this budget?')) {
                            try {
                              await budgetService.deleteBudget(budget.id);
                              toast.success('Budget deleted successfully');
                              fetchBudgets(true);
                            } catch (error) {
                              console.error('Error deleting budget:', error);
                              toast.error('Failed to delete budget');
                            }
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Budgets Found</h3>
            <p className="text-gray-500">
              {searchTerm || filters.category !== 'all' 
                ? 'No budgets match your search criteria.' 
                : 'Get started by creating your first budget based on the Chart of Accounts.'}
            </p>
            <button
              onClick={() => navigate('/treasurer/budgets/create')}
              className="mt-4 inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Budget
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetManagement;