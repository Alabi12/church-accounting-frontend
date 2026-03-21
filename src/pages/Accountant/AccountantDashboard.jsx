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
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
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
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const AccountantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data
      const [
        statsData,
        recentData,
        trendsData,
        balancesData,
        alertsData,
        accountBalancesData
      ] = await Promise.all([
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
        accountantService.getMonthlyTrend().catch(() => []),
        accountantService.getAccountBalances().catch(() => ({
          ASSET: 0, LIABILITY: 0, EQUITY: 0, REVENUE: 0, EXPENSE: 0
        })),
        accountantService.getAlerts().catch(() => ({ alerts: [] })),
        accountantService.getAccounts({ perPage: 100 }).catch(() => ({ accounts: [] }))
      ]);

      // Set stats
      setStats(statsData);

      // Set balance data
      setBalanceData(balancesData);

      // Process recent entries
      const processedEntries = (recentData.entries || []).map(entry => ({
        id: entry.id,
        date: entry.date,
        account: entry.lines?.[0]?.account_name || 'Various',
        description: entry.description,
        debit: entry.lines?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0,
        credit: entry.lines?.reduce((sum, line) => sum + (line.credit || 0), 0) || 0,
        status: entry.status
      }));
      setRecentEntries(processedEntries);

      // Process trend data for charts
      const processedTrends = (trendsData || []).map(item => ({
        month: item.month,
        income: item.income || 0,
        expenses: item.expenses || 0,
        net: (item.income || 0) - (item.expenses || 0)
      }));
      setTrendData(processedTrends);
      setChartData(processedTrends.length ? processedTrends : getDefaultChartData());

      // Process account balances for pie chart
      const accountsList = accountBalancesData.accounts || [];
      const topAccounts = accountsList
        .filter(acc => Math.abs(acc.balance) > 0)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
        .slice(0, 6)
        .map(acc => ({
          name: acc.name,
          balance: Math.abs(acc.balance),
          type: acc.type
        }));
      setAccountBalances(topAccounts);

      // Process alerts - remove duplicates
      const uniqueAlerts = Array.from(
        new Map((alertsData.alerts || []).map(alert => [alert.id, alert])).values()
      );
      setAlerts(uniqueAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
      setChartData(getDefaultChartData());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChartData = () => [
    { month: 'Jan', income: 0, expenses: 0 },
    { month: 'Feb', income: 0, expenses: 0 },
    { month: 'Mar', income: 0, expenses: 0 },
    { month: 'Apr', income: 0, expenses: 0 },
    { month: 'May', income: 0, expenses: 0 },
    { month: 'Jun', income: 0, expenses: 0 }
  ];

  const getAlertColor = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      posted: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      void: 'bg-gray-100 text-gray-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Calculate summary metrics
  const totalTransactions = stats.journalEntryStats?.posted + stats.journalEntryStats?.draft || 0;
  const pendingEntries = stats.journalEntryStats?.pending || 0;
  const totalAccounts = Object.values(stats.accountCounts || {}).reduce((a, b) => a + b, 0);
  const netIncome = stats.netIncome || 0;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Accountant Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back, {user?.fullName || user?.name || 'Accountant'} | Overview of accounting activities
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/accountant/journal-entries/add"
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              New Journal Entry
            </Link>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id || `alert-${index}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 flex items-start ${getAlertColor(alert.severity)}`}
              >
                <ExclamationTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{alert.message}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalIncome)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Net Income: {formatCurrency(netIncome)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats.totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {stats.expenseByCategory?.length || 0} expense categories
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Entries</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingEntries}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-yellow-600">
              Awaiting approval
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalAccounts}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <ScaleIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-purple-600">
              {stats.accountCounts?.ASSET || 0} Assets, {stats.accountCounts?.LIABILITY || 0} Liabilities
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Income vs Expenses Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses Trend</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Income" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="1" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    name="Expenses" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Account Balances by Type */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Balances by Account Type</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Assets', value: balanceData.ASSET, color: '#0088FE' },
                      { name: 'Liabilities', value: balanceData.LIABILITY, color: '#00C49F' },
                      { name: 'Equity', value: balanceData.EQUITY, color: '#FFBB28' },
                      { name: 'Revenue', value: balanceData.REVENUE, color: '#FF8042' },
                      { name: 'Expenses', value: balanceData.EXPENSE, color: '#8884D8' },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {[
                      { name: 'Assets', value: balanceData.ASSET, color: '#0088FE' },
                      { name: 'Liabilities', value: balanceData.LIABILITY, color: '#00C49F' },
                      { name: 'Equity', value: balanceData.EQUITY, color: '#FFBB28' },
                      { name: 'Revenue', value: balanceData.REVENUE, color: '#FF8042' },
                      { name: 'Expenses', value: balanceData.EXPENSE, color: '#8884D8' },
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-[#0088FE] rounded-full mr-2"></span>
                <span>Assets: {formatCurrency(balanceData.ASSET)}</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-[#00C49F] rounded-full mr-2"></span>
                <span>Liabilities: {formatCurrency(balanceData.LIABILITY)}</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-[#FFBB28] rounded-full mr-2"></span>
                <span>Equity: {formatCurrency(balanceData.EQUITY)}</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-[#FF8042] rounded-full mr-2"></span>
                <span>Revenue: {formatCurrency(balanceData.REVENUE)}</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-[#8884D8] rounded-full mr-2"></span>
                <span>Expenses: {formatCurrency(balanceData.EXPENSE)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Income/Expense Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h3>
            <div className="space-y-3">
              {stats.incomeByCategory?.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.category}</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
              {(!stats.incomeByCategory || stats.incomeByCategory.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No income data available</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
            <div className="space-y-3">
              {stats.expenseByCategory?.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.category}</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
              {(!stats.expenseByCategory || stats.expenseByCategory.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No expense data available</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            to="/accountant/journal-entries"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Journal Entries</h3>
            <p className="text-sm text-gray-500 mt-1">Manage journal entries</p>
          </Link>
          <Link
            to="/accountant/ledger"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <CalculatorIcon className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Ledger</h3>
            <p className="text-sm text-gray-500 mt-1">View general ledger</p>
          </Link>
          <Link
            to="/accountant/trial-balance"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <ScaleIcon className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Trial Balance</h3>
            <p className="text-sm text-gray-500 mt-1">Check trial balance</p>
          </Link>
          <Link
            to="/accountant/reconciliation"
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900">Reconciliation</h3>
            <p className="text-sm text-gray-500 mt-1">Reconcile accounts</p>
          </Link>
        </div>

        {/* Recent Journal Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Journal Entries</h2>
            <Link to="/accountant/journal-entries" className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        {entry.debit ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        {entry.credit ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No recent journal entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountantDashboard;