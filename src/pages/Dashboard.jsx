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
  WalletIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { accountantService } from '../services/accountant';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  primary: '#1FB256',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  chart: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  
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
    expenseBalance: 0,
    approvalRate: 0
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
        getMonthlyTrendData(),
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

        if (data.journalEntryStats) {
          const pending = data.journalEntryStats.pending || 0;
          const posted = data.journalEntryStats.posted || 0;
          setStats(prev => ({
            ...prev,
            postedCount: posted,
            draftCount: data.journalEntryStats.draft || 0,
            pendingCount: pending,
            voidCount: data.journalEntryStats.void || 0,
            approvalRate: (posted + (data.journalEntryStats.approved || 0)) > 0 
              ? ((posted / (posted + pending)) * 100) 
              : 0
          }));
        }

        if (data.accountCounts) {
          setStats(prev => ({
            ...prev,
            accountCount: Object.values(data.accountCounts).reduce((a, b) => a + b, 0)
          }));
        }
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

      // Process Recent Entries
      if (recentEntriesData.status === 'fulfilled' && recentEntriesData.value) {
        setRecentJournals(recentEntriesData.value.entries || recentEntriesData.value || []);
      } else if (journalEntriesData.status === 'fulfilled' && journalEntriesData.value) {
        const entries = journalEntriesData.value.entries || journalEntriesData.value.items || [];
        setRecentJournals(entries.slice(0, 5));
      }

      // Process Accounts for cash/bank balances
      if (accountsData.status === 'fulfilled' && accountsData.value) {
        const accounts = accountsData.value.accounts || [];
        
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
        toast.success('Dashboard refreshed');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getMonthlyTrendData = async () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const monthsToShow = selectedTimeframe === '3months' ? 3 : selectedTimeframe === '6months' ? 6 : 12;
    const trend = [];
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
      
      try {
        const statement = await accountantService.getIncomeStatement(startDate, endDate);
        trend.push({
          month: months[date.getMonth()],
          income: statement.revenue?.total || 0,
          expenses: statement.expenses?.total || 0,
          net: (statement.revenue?.total || 0) - (statement.expenses?.total || 0)
        });
      } catch {
        trend.push({ month: months[date.getMonth()], income: 0, expenses: 0, net: 0 });
      }
    }
    return trend;
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData, selectedTimeframe]);

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

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, isCurrency = true }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-${color}-50`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">
          {isCurrency ? formatCurrency(value) : value.toLocaleString()}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
      </div>
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-600">{entry.name}:</span>
              </div>
              <span className="font-semibold text-gray-900">{formatCurrency(entry.value)}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.fullName || user?.name || 'User'}! Here's your real-time church financial data.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border rounded-xl p-4 flex items-start ${getAlertColor(alert.severity)}`}
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
          <StatCard
            title="Total Income (YTD)"
            value={financialSummary.totalIncome}
            subtitle="Year to date"
            icon={ArrowTrendingUpIcon}
            color="green"
            trend={12.5}
            isCurrency={true}
          />
          <StatCard
            title="Total Expenses (YTD)"
            value={financialSummary.totalExpenses}
            subtitle="Year to date"
            icon={ArrowTrendingDownIcon}
            color="red"
            trend={-8.2}
            isCurrency={true}
          />
          <StatCard
            title="Net Surplus/(Deficit)"
            value={financialSummary.netIncome}
            subtitle={financialSummary.netIncome >= 0 ? 'Favorable' : 'Unfavorable'}
            icon={CurrencyDollarIcon}
            color={financialSummary.netIncome >= 0 ? "blue" : "orange"}
            isCurrency={true}
          />
        </div>

        {/* Secondary Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Journal Entries"
            value={stats.postedCount}
            subtitle={`${stats.pendingCount} pending, ${stats.draftCount} draft`}
            icon={BookOpenIcon}
            color="purple"
            isCurrency={false}
          />
          <StatCard
            title="Cash Balance"
            value={stats.cashBalance}
            subtitle="Petty Cash / Cash on Hand"
            icon={BanknotesIcon}
            color="green"
            isCurrency={true}
          />
          <StatCard
            title="Bank Balance"
            value={stats.bankBalance}
            subtitle="All Bank Accounts"
            icon={BuildingLibraryIcon}
            color="blue"
            isCurrency={true}
          />
          <StatCard
            title="Total Liquid Assets"
            value={stats.cashBalance + stats.bankBalance}
            subtitle="Cash + Bank"
            icon={WalletIcon}
            color="indigo"
            isCurrency={true}
          />
        </div>

        {/* Balance Sheet Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Assets"
            value={stats.assetBalance}
            subtitle="Resources owned by the church"
            icon={ScaleIcon}
            color="blue"
            isCurrency={true}
          />
          <StatCard
            title="Total Liabilities"
            value={stats.liabilityBalance}
            subtitle="Obligations and debts"
            icon={BuildingLibraryIcon}
            color="orange"
            isCurrency={true}
          />
          <StatCard
            title="Total Equity"
            value={stats.equityBalance}
            subtitle="Net assets / Accumulated fund"
            icon={CheckCircleIcon}
            color="purple"
            isCurrency={true}
          />
        </div>

        {/* Financial Trend Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Financial Trend</h2>
              <p className="text-xs text-gray-500 mt-1">Monthly income vs expenses</p>
            </div>
            <div className="flex gap-2">
              {['3months', '6months', '12months'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedTimeframe(period)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    selectedTimeframe === period
                      ? 'bg-[rgb(31,178,86)] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period === '3months' ? '3M' : period === '6months' ? '6M' : '12M'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.income} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis tickFormatter={(v) => `₵${v/1000}k`} stroke="#9ca3af" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke={COLORS.income} fill="url(#incomeGradient)" name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke={COLORS.expense} fill="url(#expenseGradient)" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No trend data available
              </div>
            )}
          </div>
        </div>

        {/* Income vs Expenses by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Income by Category */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
              <div className="text-center py-8 text-gray-400">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No income category data available</p>
              </div>
            )}
          </div>

          {/* Expenses by Category */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
              <div className="text-center py-8 text-gray-400">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No expense category data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Accounts Section */}
        {topAccounts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Accounts by Balance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topAccounts.map((account, index) => (
                <motion.div
                  key={account.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                >
                  <p className="text-xs text-gray-500 truncate">{account.name}</p>
                  <p className={`text-sm font-bold mt-1 ${
                    account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{account.type}</p>
                  {account.account_code && (
                    <p className="text-xs text-gray-400">{account.account_code}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Journal Entries */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DocumentDuplicateIcon className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Journal Entries</h2>
            </div>
            <Link
              to="/accountant/journal-entries"
              className="text-sm text-[rgb(31,178,86)] hover:underline flex items-center"
            >
              View all <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentJournals.length > 0 ? (
                  recentJournals.map((journal) => (
                    <tr key={journal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(journal.entry_date || journal.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {journal.entry_number || journal.journalNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {journal.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {journal.total_debit ? formatCurrency(journal.total_debit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                        {journal.total_credit ? formatCurrency(journal.total_credit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(journal.status)}`}>
                          {journal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm mb-2">No journal entries found</p>
                      <Link 
                        to="/accountant/journal-entries/add"
                        className="text-sm text-[rgb(31,178,86)] hover:underline"
                      >
                        Create your first journal entry
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-400 text-right">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;