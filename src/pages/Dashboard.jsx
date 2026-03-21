import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BookOpenIcon,
  DocumentDuplicateIcon,
  BuildingLibraryIcon,
  ScaleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { accountantService } from '../services/accountant';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Financial summary state
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyNet: 0,
    todayIncome: 0,
    todayExpenses: 0,
    todayNet: 0,
    incomeByCategory: [],
    expenseByCategory: []
  });
  
  // Stats state
  const [stats, setStats] = useState({
    pendingCount: 0,
    postedCount: 0,
    draftCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    memberCount: 0,
    accountCount: 0,
    cashBalance: 0,
    bankBalance: 0,
    totalBalance: 0,
    assetBalance: 0,
    liabilityBalance: 0,
    equityBalance: 0,
    revenueBalance: 0,
    expenseBalance: 0
  });
  
  // Data states
  const [recentJournals, setRecentJournals] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [topAccounts, setTopAccounts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [accountBalances, setAccountBalances] = useState({
    ASSET: 0,
    LIABILITY: 0,
    EQUITY: 0,
    REVENUE: 0,
    EXPENSE: 0
  });

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch data in parallel
      const [
        statsData,
        recentEntriesData,
        trendData,
        accountBalancesData,
        alertsData,
        journalEntriesData,
        accountsData
      ] = await Promise.allSettled([
        accountantService.getDashboardStats(),
        accountantService.getRecentEntries(10),
        accountantService.getMonthlyTrend(),
        accountantService.getAccountBalances(),
        accountantService.getAlerts(),
        accountantService.getJournalEntries({ perPage: 5 }),
        accountantService.getAccounts({ perPage: 100 })
      ]);

      // Process Dashboard Stats
      if (statsData.status === 'fulfilled' && statsData.value) {
        const data = statsData.value;
        setFinancialSummary(prev => ({
          ...prev,
          totalIncome: data.totalIncome || 0,
          totalExpenses: data.totalExpenses || 0,
          netIncome: (data.totalIncome || 0) - (data.totalExpenses || 0),
          incomeByCategory: data.incomeByCategory || [],
          expenseByCategory: data.expenseByCategory || []
        }));

        // Process journal entry stats
        if (data.journalEntryStats) {
          setStats(prev => ({
            ...prev,
            postedCount: data.journalEntryStats.posted || 0,
            draftCount: data.journalEntryStats.draft || 0,
            pendingCount: data.journalEntryStats.pending || 0,
            voidCount: data.journalEntryStats.void || 0
          }));
        }

        // Process account counts
        if (data.accountCounts) {
          setStats(prev => ({
            ...prev,
            accountCount: Object.values(data.accountCounts).reduce((a, b) => a + b, 0)
          }));
        }
      }

      // Process Recent Entries
      if (recentEntriesData.status === 'fulfilled' && recentEntriesData.value) {
        setRecentJournals(recentEntriesData.value.entries || recentEntriesData.value || []);
      } else if (journalEntriesData.status === 'fulfilled' && journalEntriesData.value) {
        const entries = journalEntriesData.value.entries || journalEntriesData.value.items || [];
        setRecentJournals(entries.slice(0, 5));
      }

      // Process Monthly Trend
      if (trendData.status === 'fulfilled' && trendData.value) {
        setMonthlyTrend(trendData.value);
      }

      // Process Account Balances
      if (accountBalancesData.status === 'fulfilled' && accountBalancesData.value) {
        const balances = accountBalancesData.value;
        setAccountBalances({
          ASSET: balances.ASSET || 0,
          LIABILITY: balances.LIABILITY || 0,
          EQUITY: balances.EQUITY || 0,
          REVENUE: balances.REVENUE || 0,
          EXPENSE: balances.EXPENSE || 0
        });

        setStats(prev => ({
          ...prev,
          assetBalance: balances.ASSET || 0,
          liabilityBalance: balances.LIABILITY || 0,
          equityBalance: balances.EQUITY || 0,
          revenueBalance: balances.REVENUE || 0,
          expenseBalance: balances.EXPENSE || 0
        }));
      }

      // Process Accounts for cash/bank balances
      if (accountsData.status === 'fulfilled' && accountsData.value) {
        const accounts = accountsData.value.accounts || [];
        
        // Calculate cash and bank balances
        let cashBalance = 0;
        let bankBalance = 0;
        
        accounts.forEach(acc => {
          if (acc.account_code && acc.account_code.startsWith('1010')) {
            cashBalance += acc.balance || 0;
          }
          if (acc.account_code && acc.account_code.startsWith('1020')) {
            bankBalance += acc.balance || 0;
          }
        });

        // Get top accounts by balance
        const sorted = [...accounts]
          .filter(acc => Math.abs(acc.balance || 0) > 0)
          .sort((a, b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0))
          .slice(0, 5);
        setTopAccounts(sorted);

        setStats(prev => ({
          ...prev,
          cashBalance,
          bankBalance,
          totalBalance: cashBalance + bankBalance
        }));
      }

      // Process Alerts
      if (alertsData.status === 'fulfilled' && alertsData.value) {
        setAlerts(alertsData.value.alerts || []);
      }

      if (showToast) {
        toast.success('Dashboard refreshed successfully');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'POSTED': 'bg-green-100 text-green-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'VOID': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'RETURNED': 'bg-orange-100 text-orange-800'
    };
    return styles[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  const getAlertColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center mr-4">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back, {user?.fullName || user?.name || 'User'}! Here's your real-time church financial data.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50 transition-colors"
          >
            <svg 
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Dynamic Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 flex items-start ${getAlertColor(alert.severity)}`}
              >
                <ExclamationTriangleIcon className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${
                  alert.severity === 'high' ? 'text-red-500' :
                  alert.severity === 'medium' ? 'text-yellow-500' :
                  'text-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.timestamp && (
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Main Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Income Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <ArrowTrendingUpIcon className="h-8 w-8" />
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Year to Date</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(financialSummary.totalIncome)}</p>
            <p className="text-sm text-white/80">Total Income</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span>Revenue Accounts</span>
                <span className="font-semibold">{formatCurrency(stats.revenueBalance)}</span>
              </div>
            </div>
          </motion.div>

          {/* Total Expenses Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <ArrowTrendingDownIcon className="h-8 w-8" />
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Year to Date</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(financialSummary.totalExpenses)}</p>
            <p className="text-sm text-white/80">Total Expenses</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span>Expense Accounts</span>
                <span className="font-semibold">{formatCurrency(stats.expenseBalance)}</span>
              </div>
            </div>
          </motion.div>

          {/* Net Income Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-gradient-to-br rounded-xl shadow-lg p-6 text-white ${
              financialSummary.netIncome >= 0 
                ? 'from-blue-500 to-blue-600' 
                : 'from-orange-500 to-orange-600'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {financialSummary.netIncome >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(Math.abs(financialSummary.netIncome))}</p>
            <p className="text-sm text-white/80">Net Income</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span>Profit Margin</span>
                <span className="font-semibold">
                  {financialSummary.totalIncome > 0 
                    ? `${((financialSummary.netIncome / financialSummary.totalIncome) * 100).toFixed(1)}%` 
                    : '0%'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Secondary Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Journal Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Journal Entries</p>
              <BookOpenIcon className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.postedCount}</p>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-500 flex items-center">
                <ClockIcon className="h-3 w-3 mr-1 text-yellow-500" />
                Pending: {stats.pendingCount}
              </span>
              <span className="text-gray-500 flex items-center">
                <DocumentTextIcon className="h-3 w-3 mr-1 text-gray-500" />
                Draft: {stats.draftCount}
              </span>
            </div>
          </motion.div>

          {/* Cash Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Cash Balance</p>
              <BanknotesIcon className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.cashBalance)}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>Petty Cash / Cash on Hand</span>
            </div>
          </motion.div>

          {/* Bank Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Bank Balance</p>
              <BuildingLibraryIcon className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.bankBalance)}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>All Bank Accounts</span>
            </div>
          </motion.div>

          {/* Total Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Total Liquid Assets</p>
              <CurrencyDollarIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.cashBalance + stats.bankBalance)}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span>Cash + Bank</span>
            </div>
          </motion.div>
        </div>

        {/* Balance Sheet Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Assets Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <ScaleIcon className="h-8 w-8" />
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Total Assets</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(stats.assetBalance)}</p>
            <p className="text-sm text-white/80">Assets</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span>Cash & Bank</span>
                <span className="font-semibold">{formatCurrency(stats.cashBalance + stats.bankBalance)}</span>
              </div>
            </div>
          </motion.div>

          {/* Liabilities Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <BuildingLibraryIcon className="h-8 w-8" />
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Total Liabilities</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(stats.liabilityBalance)}</p>
            <p className="text-sm text-white/80">Liabilities</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span>Debt Obligations</span>
                <span className="font-semibold">{formatCurrency(stats.liabilityBalance)}</span>
              </div>
            </div>
          </motion.div>

          {/* Equity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Total Equity</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(stats.equityBalance)}</p>
            <p className="text-sm text-white/80">Equity</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm">
                <span>Accumulated Fund</span>
                <span className="font-semibold">{formatCurrency(stats.equityBalance)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Monthly Financial Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Financial Trend</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span className="text-xs text-gray-600">Income</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <span className="text-xs text-gray-600">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)} 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="income" 
                  fill="#10b981" 
                  name="Income" 
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Bar 
                  dataKey="expenses" 
                  fill="#ef4444" 
                  name="Expenses" 
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Income vs Expenses by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Income by Category */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h2>
            {financialSummary.incomeByCategory && financialSummary.incomeByCategory.length > 0 ? (
              <div className="space-y-4">
                {financialSummary.incomeByCategory.map((item, index) => {
                  const total = financialSummary.incomeByCategory.reduce((sum, i) => sum + i.total, 0);
                  const percentage = total > 0 ? ((item.total / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.category}</span>
                        <div>
                          <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
                          <span className="text-gray-400 text-xs ml-2">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 rounded-full h-2" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-4 mt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-900">Total Income</span>
                    <span className="text-green-600">
                      {formatCurrency(financialSummary.incomeByCategory.reduce((sum, i) => sum + i.total, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p>No income category data available</p>
              </div>
            )}
          </motion.div>

          {/* Expenses by Category */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
            {financialSummary.expenseByCategory && financialSummary.expenseByCategory.length > 0 ? (
              <div className="space-y-4">
                {financialSummary.expenseByCategory.map((item, index) => {
                  const total = financialSummary.expenseByCategory.reduce((sum, i) => sum + i.total, 0);
                  const percentage = total > 0 ? ((item.total / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.category}</span>
                        <div>
                          <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
                          <span className="text-gray-400 text-xs ml-2">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 rounded-full h-2" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-4 mt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-900">Total Expenses</span>
                    <span className="text-red-600">
                      {formatCurrency(financialSummary.expenseByCategory.reduce((sum, i) => sum + i.total, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p>No expense category data available</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Top Accounts */}
        {topAccounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Accounts by Balance</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topAccounts.map((account, index) => (
                <motion.div
                  key={account.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <p className="text-xs text-gray-500 truncate">{account.name}</p>
                  <p className={`text-sm font-bold mt-1 ${
                    account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-xs text-gray-400">{account.type}</p>
                  {account.account_code && (
                    <p className="text-xs text-gray-400 mt-1">{account.account_code}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Journal Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Journal Entries</h2>
            </div>
            <Link
              to="/accountant/journal-entries"
              className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)] font-medium"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentJournals.length > 0 ? (
                  recentJournals.map((journal) => (
                    <tr key={journal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(journal.entry_date || journal.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {journal.entry_number || journal.journalNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {journal.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {journal.total_debit ? formatCurrency(journal.total_debit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                        {journal.total_credit ? formatCurrency(journal.total_credit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(journal.status)}`}>
                          {journal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm mb-2">No journal entries found</p>
                      <Link 
                        to="/accountant/journal-entries/add"
                        className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)] font-medium"
                      >
                        Create your first journal entry
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Last Updated */}
        <div className="mt-4 text-xs text-gray-400 text-right">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;