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
} from '@heroicons/react/24/outline';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { budgetService } from '../../services/budgets';
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
  
  const { socket, connected } = useSocket(); // Get connected status too

  const fetchBudgets = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      const response = await budgetService.getBudgets({ 
        fiscalYear: new Date().getFullYear(),
        department: 'all',
        status: 'all'
      });
      
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
  }, []);

  const filterBudgets = (budgetList = budgets) => {
    if (!searchTerm) {
      setFilteredBudgets(budgetList);
      return;
    }
    
    const filtered = budgetList.filter(b => 
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBudgets(filtered);
  };

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    filterBudgets();
  }, [searchTerm, budgets]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) {
      console.log('Socket not available, using polling only');
      return;
    }

    const handleBudgetUpdate = (data) => {
      console.log('🔔 Real-time budget update received:', data);
      
      toast.success(`Budget ${data.status}`, {
        icon: data.status === 'APPROVED' ? '✅' : '❌'
      });

      // Update the specific budget in state
      setBudgets(prev => prev.map(budget => 
        budget.id === data.budget_id 
          ? { ...budget, status: data.status }
          : budget
      ));
      
      // Also refresh the full list to ensure consistency
      fetchBudgets(true);
    };

    socket.on('budget_updated', handleBudgetUpdate);

    return () => {
      socket.off('budget_updated', handleBudgetUpdate);
    };
  }, [socket, fetchBudgets]);

  // Polling as fallback (every 10 seconds)
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm">
            <span className={`h-2 w-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="text-gray-600">{connected ? 'Live' : 'Polling'}</span>
          </div>
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

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search budgets by name or department..."
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
                      <p className="text-sm text-gray-500">{budget.department}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(budget.status)}`}>
                    {budget.status}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center text-gray-600">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    {formatCurrency(budget.amount, 'GHS')}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    FY {budget.fiscal_year || budget.fiscalYear}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                    {formatDate(budget.created_at)}
                  </div>
                </div>

                {budget.description && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{budget.description}</p>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => navigate(`/treasurer/budgets/${budget.id}`)}
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
                        onClick={() => {/* Handle delete */}}
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
            <p className="text-gray-500">Get started by creating your first budget.</p>
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