// pages/Accountant/AccountantDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DocumentTextIcon,
  CalculatorIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
  EyeIcon,
  ChevronRightIcon,
  BanknotesIcon,
  ArrowPathIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = {
  primary: '#1FB256',
  income: '#10b981',
  expense: '#ef4444',
  asset: '#3b82f6',
  liability: '#f59e0b',
  equity: '#8b5cf6',
  revenue: '#06b6d4',
  chart: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
};

const AccountantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    accountCounts: {},
    journalEntryStats: { posted: 0, draft: 0, pending: 0, void: 0 },
    recentEntries: 0,
    incomeByCategory: [],
    expenseByCategory: []
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [accountBalances, setAccountBalances] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [balanceData, setBalanceData] = useState({
    ASSET: 0,
    LIABILITY: 0,
    EQUITY: 0,
    REVENUE: 0,
    EXPENSE: 0
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 300000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      
      const [pendingJournalRes, statsData, recentData, trendsData, balancesData, alertsData, accountBalancesData] = await Promise.all([
        accountantService.getJournalEntries({ status: 'PENDING' }).catch(() => ({ entries: [] })),
        accountantService.getDashboardStats().catch(() => ({
          totalIncome: 0,
          totalExpenses: 0,
          netIncome: 0,
          accountCounts: {},
          journalEntryStats: { posted: 0, draft: 0, pending: 0, void: 0 },
          recentEntries: 0,
          incomeByCategory: [],
          expenseByCategory: []
        })),
        accountantService.getRecentEntries(10).catch(() => ({ entries: [] })),
        getTrendData(),
        accountantService.getAccountBalances().catch(() => ({
          ASSET: 0, LIABILITY: 0, EQUITY: 0, REVENUE: 0, EXPENSE: 0
        })),
        accountantService.getAlerts().catch(() => ({ alerts: [] })),
        accountantService.getAccounts({ perPage: 100 }).catch(() => ({ accounts: [] }))
      ]);

      const pendingEntries = pendingJournalRes.entries || [];
      setPendingApprovals(pendingEntries);
      setPendingCount(pendingEntries.length);
      
      const totalPendingAmount = pendingEntries.reduce((sum, entry) => {
        const amount = entry.total_debit || entry.total_credit || 0;
        return sum + amount;
      }, 0);
      setPendingAmount(totalPendingAmount);

      setStats({
        ...statsData,
        journalEntryStats: {
          ...statsData.journalEntryStats,
          pending: pendingEntries.length
        }
      });

      setBalanceData(balancesData);

      const processedEntries = (recentData.entries || []).map(entry => ({
        id: entry.id,
        date: entry.entry_date || entry.date,
        entry_number: entry.entry_number,
        description: entry.description,
        debit: entry.total_debit || entry.lines?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0,
        credit: entry.total_credit || entry.lines?.reduce((sum, line) => sum + (line.credit || 0), 0) || 0,
        status: entry.status
      }));
      setRecentEntries(processedEntries);

      setTrendData(trendsData);
      setChartData(trendsData.length ? trendsData : getDefaultChartData());

      const accountsList = accountBalancesData.accounts || [];
      const topAccounts = accountsList
        .filter(acc => Math.abs(acc.balance) > 0)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
        .slice(0, 6)
        .map(acc => ({
          id: acc.id,
          name: acc.name,
          balance: Math.abs(acc.balance),
          type: acc.type || acc.account_type,
          code: acc.code || acc.account_code
        }));
      setAccountBalances(topAccounts);

      const uniqueAlerts = Array.from(
        new Map((alertsData.alerts || []).map(alert => [alert.id, alert])).values()
      );
      setAlerts(uniqueAlerts);

      if (showToast) toast.success('Dashboard refreshed');

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
      setChartData(getDefaultChartData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTrendData = async () => {
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

  const getDefaultChartData = () => [
    { month: 'Jan', income: 0, expenses: 0, net: 0 },
    { month: 'Feb', income: 0, expenses: 0, net: 0 },
    { month: 'Mar', income: 0, expenses: 0, net: 0 },
    { month: 'Apr', income: 0, expenses: 0, net: 0 },
    { month: 'May', income: 0, expenses: 0, net: 0 },
    { month: 'Jun', income: 0, expenses: 0, net: 0 }
  ];

  const getAlertColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'POSTED': 'bg-green-100 text-green-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'VOID': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'REJECTED': 'bg-red-100 text-red-800',
    };
    return styles[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, isCurrency = true, onClick }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-${color}-50`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
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

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const totalTransactions = stats.journalEntryStats?.posted + stats.journalEntryStats?.draft || 0;
  const totalAccounts = Object.values(stats.accountCounts || {}).reduce((a, b) => a + b, 0);
  const netIncome = stats.netIncome || 0;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Accountant Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.fullName || user?.name || 'Accountant'} | Financial overview and accounting activities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link
                to="/accountant/journal-entries/add"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-xl hover:bg-[rgb(25,142,69)] transition-colors shadow-sm"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                New Journal Entry
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id || `alert-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border rounded-xl p-4 flex items-start ${getAlertColor(alert.severity)}`}
              >
                <ExclamationTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
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

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Income (YTD)"
            value={stats.totalIncome}
            subtitle="Year to date"
            icon={ArrowTrendingUpIcon}
            color="green"
            trend={12.5}
            isCurrency={true}
          />
          <StatCard
            title="Total Expenses (YTD)"
            value={stats.totalExpenses}
            subtitle="Year to date"
            icon={ArrowTrendingDownIcon}
            color="red"
            trend={-8.2}
            isCurrency={true}
          />
          <StatCard
            title="Net Surplus/(Deficit)"
            value={netIncome}
            subtitle={netIncome >= 0 ? 'Favorable' : 'Unfavorable'}
            icon={CurrencyDollarIcon}
            color={netIncome >= 0 ? "blue" : "orange"}
            isCurrency={true}
          />
          <StatCard
            title="Pending Approvals"
            value={pendingCount}
            subtitle={`${formatCurrency(pendingAmount)} awaiting review`}
            icon={ClockIcon}
            color="yellow"
            isCurrency={false}
            onClick={() => window.location.href = '/accountant/pending-approvals'}
          />
        </div>

        {/* Pending Approvals List */}
        {pendingApprovals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8"
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
                </div>
                <Link
                  to="/accountant/pending-approvals"
                  className="text-sm text-[rgb(31,178,86)] hover:underline flex items-center"
                >
                  View all pending
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {pendingCount} journal entries awaiting your review
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingApprovals.slice(0, 5).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/accountant/journal-entries/view/${entry.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="h-4 w-4 text-yellow-500" />
                        <h3 className="text-sm font-medium text-gray-900">
                          {entry.description || `Journal Entry #${entry.entry_number}`}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {entry.entry_number}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {formatDate(entry.entry_date || entry.created_at)}
                        </span>
                        <span className="font-medium text-purple-600">
                          Amount: {formatCurrency(entry.total_debit || entry.total_credit || 0)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/accountant/journal-entries/view/${entry.id}`;
                      }}
                      className="ml-4 px-3 py-1.5 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-lg hover:bg-[rgb(25,142,69)] transition-colors flex items-center gap-1"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Review
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            {pendingApprovals.length > 5 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
                <Link
                  to="/accountant/pending-approvals"
                  className="text-sm text-[rgb(31,178,86)] hover:underline"
                >
                  +{pendingApprovals.length - 5} more pending approvals
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Accounts"
            value={totalAccounts}
            subtitle={`${stats.accountCounts?.ASSET || 0} Assets, ${stats.accountCounts?.LIABILITY || 0} Liabilities`}
            icon={ScaleIcon}
            color="purple"
            isCurrency={false}
          />
          <StatCard
            title="Journal Entries"
            value={totalTransactions}
            subtitle={`${stats.journalEntryStats?.posted || 0} posted, ${stats.journalEntryStats?.draft || 0} draft`}
            icon={DocumentTextIcon}
            color="indigo"
            isCurrency={false}
          />
          <StatCard
            title="Approval Rate"
            value={totalTransactions > 0 ? ((stats.journalEntryStats?.posted / totalTransactions) * 100).toFixed(1) : 0}
            subtitle="Of total entries"
            icon={CheckCircleIcon}
            color="teal"
            isCurrency={false}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Financial Trend Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
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
                  <ChartBarIcon className="h-12 w-12 mb-3 opacity-50" />
                  <p>No trend data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Balance Sheet Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance Sheet Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Assets', value: balanceData.ASSET, color: COLORS.asset },
                      { name: 'Liabilities', value: balanceData.LIABILITY, color: COLORS.liability },
                      { name: 'Equity', value: balanceData.EQUITY, color: COLORS.equity },
                      { name: 'Revenue', value: balanceData.REVENUE, color: COLORS.revenue },
                      { name: 'Expenses', value: balanceData.EXPENSE, color: COLORS.expense },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Assets', value: balanceData.ASSET, color: COLORS.asset },
                      { name: 'Liabilities', value: balanceData.LIABILITY, color: COLORS.liability },
                      { name: 'Equity', value: balanceData.EQUITY, color: COLORS.equity },
                      { name: 'Revenue', value: balanceData.REVENUE, color: COLORS.revenue },
                      { name: 'Expenses', value: balanceData.EXPENSE, color: COLORS.expense },
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Income/Expense Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h3>
            <div className="space-y-3">
              {stats.incomeByCategory?.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.category}</span>
                    <span className="font-medium text-green-600">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 rounded-full h-2"
                      style={{ width: `${Math.min((item.total / stats.totalIncome) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!stats.incomeByCategory || stats.incomeByCategory.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No income data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
            <div className="space-y-3">
              {stats.expenseByCategory?.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.category}</span>
                    <span className="font-medium text-red-600">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 rounded-full h-2"
                      style={{ width: `${Math.min((item.total / stats.totalExpenses) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!stats.expenseByCategory || stats.expenseByCategory.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <BanknotesIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No expense data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Accounts */}
        {accountBalances.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Accounts by Balance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accountBalances.map((account, index) => (
                <motion.div
                  key={account.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => window.location.href = `/accountant/ledger?account=${account.code}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 truncate">{account.code}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      account.type === 'ASSET' ? 'bg-blue-100 text-blue-700' :
                      account.type === 'LIABILITY' ? 'bg-orange-100 text-orange-700' :
                      account.type === 'EQUITY' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {account.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{account.name}</p>
                  <p className={`text-lg font-bold mt-1 ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(account.balance)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Journal Entries */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500" />
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
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/accountant/journal-entries/view/${entry.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {entry.entry_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {entry.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {entry.debit ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                        {entry.credit ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm mb-2">No recent journal entries found</p>
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

export default AccountantDashboard;