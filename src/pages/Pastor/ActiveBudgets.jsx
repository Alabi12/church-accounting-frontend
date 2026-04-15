// src/pages/Pastor/ActiveBudgets.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  EyeIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ActiveBudgets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    revenueTotal: 0,
    expenseTotal: 0,
    revenueCount: 0,
    expenseCount: 0
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchActiveBudgets();
    fetchAvailableYears();
  }, [selectedYear]);

  const fetchAvailableYears = async () => {
    try {
      const response = await treasurerService.getBudgets({ perPage: 1 });
      const allBudgets = response.budgets || [];
      const years = [...new Set(allBudgets.map(b => b.fiscal_year).filter(Boolean))];
      const currentYear = new Date().getFullYear();
      const defaultYears = [currentYear - 1, currentYear, currentYear + 1];
      const uniqueYears = [...new Set([...defaultYears, ...years])].sort();
      setAvailableYears(uniqueYears);
    } catch (error) {
      console.error('Error fetching years:', error);
      setAvailableYears([2024, 2025, 2026, 2027]);
    }
  };

  const fetchActiveBudgets = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      
      // Fetch approved budgets (active budgets)
      const response = await treasurerService.getBudgets({ 
        status: 'APPROVED',
        year: selectedYear,
        perPage: 100
      });
      
      const budgetsData = response.budgets || [];
      setBudgets(budgetsData);
      
      // Calculate stats
      const totalAmount = budgetsData.reduce((sum, b) => sum + (b.amount || 0), 0);
      const revenueBudgets = budgetsData.filter(b => b.type === 'REVENUE');
      const expenseBudgets = budgetsData.filter(b => b.type === 'EXPENSE');
      const revenueTotal = revenueBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
      const expenseTotal = expenseBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
      
      setStats({
        total: budgetsData.length,
        totalAmount: totalAmount,
        revenueTotal: revenueTotal,
        expenseTotal: expenseTotal,
        revenueCount: revenueBudgets.length,
        expenseCount: expenseBudgets.length
      });
      
      if (showToast) toast.success('Budgets refreshed');
      
    } catch (error) {
      console.error('Error fetching active budgets:', error);
      toast.error('Failed to load active budgets');
      // Set empty data on error
      setBudgets([]);
      setStats({
        total: 0,
        totalAmount: 0,
        revenueTotal: 0,
        expenseTotal: 0,
        revenueCount: 0,
        expenseCount: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getBudgetTypeColor = (type) => {
    switch(type?.toUpperCase()) {
      case 'REVENUE':
        return 'bg-green-100 text-green-800';
      case 'EXPENSE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getBudgetTypeIcon = (type) => {
    switch(type?.toUpperCase()) {
      case 'REVENUE':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'EXPENSE':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ChartBarIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Budgets</h1>
            <p className="text-sm text-gray-500 mt-1">
              View all approved and active budgets for the church
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => fetchActiveBudgets(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Budgets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-400 mt-1">For year {selectedYear}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-gray-400 mt-1">All approved budgets</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue Budgets</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenueTotal)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.revenueCount} budget(s)</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expense Budgets</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.expenseTotal)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.expenseCount} budget(s)</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Budgets Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Approved Budgets</h2>
            <span className="text-sm text-gray-500">{stats.total} budget(s) found</span>
          </div>
          {budgets.length === 0 ? (
            <div className="p-12 text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active budgets found for {selectedYear}</p>
              <p className="text-sm text-gray-400 mt-1">Budgets that have been approved will appear here</p>
              <button
                onClick={() => navigate('/treasurer/budgets/create')}
                className="mt-4 text-[rgb(31,178,86)] hover:underline"
              >
                Create a budget
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {budgets.map((budget) => (
                    <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {budget.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {budget.department || 'General'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          {getBudgetTypeIcon(budget.type)}
                          <span className={`px-2 py-1 text-xs rounded-full ${getBudgetTypeColor(budget.type)}`}>
                            {budget.type || 'General'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        <span className={budget.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(budget.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {budget.fiscal_year || selectedYear}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {budget.created_at ? new Date(budget.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3" />
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/budgets/${budget.id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Section - Only show if there are budgets */}
        {budgets.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Budget Allocation</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Revenue Budgets</span>
                      <span className="font-medium text-green-600">{formatCurrency(stats.revenueTotal)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2"
                        style={{ width: `${stats.totalAmount > 0 ? (stats.revenueTotal / stats.totalAmount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Expense Budgets</span>
                      <span className="font-medium text-red-600">{formatCurrency(stats.expenseTotal)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 rounded-full h-2"
                        style={{ width: `${stats.totalAmount > 0 ? (stats.expenseTotal / stats.totalAmount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Net Budget Position</p>
                  <p className={`text-2xl font-bold ${stats.revenueTotal - stats.expenseTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.revenueTotal - stats.expenseTotal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.revenueTotal - stats.expenseTotal >= 0 ? 'Surplus' : 'Deficit'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveBudgets;