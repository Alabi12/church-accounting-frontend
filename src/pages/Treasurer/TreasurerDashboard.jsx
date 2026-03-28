// pages/Treasurer/TreasurerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ChartBarIcon,
  CalendarIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  ReceiptPercentIcon,
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
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { treasurerService } from '../../services/treasurer';
import { accountantService } from '../../services/accountant';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  primary: '#1FB256',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  chart: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
};

const TreasurerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    pendingApprovals: 0,
    pendingAmount: 0,
    accountBalance: 0,
    incomeChange: 0,
    expenseChange: 0,
    approvalRate: 0
  });
  const [pendingBudgets, setPendingBudgets] = useState([]);
  const [pendingPayrollRuns, setPendingPayrollRuns] = useState([]);
  const [pendingJournalEntries, setPendingJournalEntries] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

 const fetchDashboardData = async (showToast = false) => {
  try {
    if (showToast) setRefreshing(true);
    else setLoading(true);
    setError(null);

    console.log('📊 FETCHING TREASURER DASHBOARD DATA');

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    const [
      incomeStatementRes,
      balanceSheetRes,
      budgetsRes,
      pendingJournalRes,
      pendingPayrollRes,
      trendsRes,
      categoriesRes,
      recentEntriesRes
    ] = await Promise.allSettled([
      accountantService.getIncomeStatement(startDate, endDate),
      accountantService.getBalanceSheet(endDate),
      treasurerService.getBudgets({ status: 'PENDING', perPage: 10 }),
      accountantService.getJournalEntries({ status: 'PENDING' }),
      payrollService.getPayrollRuns({ status: 'submitted' }),
      getTrendData(),
      accountantService.getCategoryBreakdown?.('month') || Promise.resolve([]),
      accountantService.getRecentEntries(10)
    ]);

    // Process Income Statement
    if (incomeStatementRes.status === 'fulfilled' && incomeStatementRes.value) {
      const income = incomeStatementRes.value.revenue?.total || 0;
      const expenses = incomeStatementRes.value.expenses?.total || 0;
      setStats(prev => ({
        ...prev,
        totalIncome: income,
        totalExpenses: expenses,
        netBalance: income - expenses
      }));
    }

    // Process Balance Sheet
    if (balanceSheetRes.status === 'fulfilled' && balanceSheetRes.value) {
      const totalAssets = balanceSheetRes.value.assets?.total || 0;
      const totalLiabilities = balanceSheetRes.value.liabilities?.total || 0;
      setStats(prev => ({
        ...prev,
        accountBalance: totalAssets - totalLiabilities
      }));
    }

    // Process Pending Payroll Runs
    let formattedRuns = [];
    if (pendingPayrollRes.status === 'fulfilled' && pendingPayrollRes.value) {
      const runs = pendingPayrollRes.value.runs || [];
      formattedRuns = runs.map(run => ({
        id: run.id,
        runNumber: run.run_number,
        periodStart: run.period_start,
        periodEnd: run.period_end,
        totalGross: run.total_gross,
        totalNet: run.total_net,
        submittedBy: run.submitted_by_name || 'Accountant',
        submittedAt: run.submitted_at || run.created_at
      }));
      setPendingPayrollRuns(formattedRuns);
    }

    // Process Pending Journal Entries
    let formattedEntries = [];
    if (pendingJournalRes.status === 'fulfilled' && pendingJournalRes.value) {
      const entries = pendingJournalRes.value.entries || [];
      formattedEntries = entries.map(entry => ({
        id: entry.id,
        entryNumber: entry.entry_number,
        description: entry.description,
        amount: entry.total_debit || entry.total_credit || 0,
        status: entry.status,
        submittedBy: entry.created_by_name || 'Accountant',
        submittedAt: entry.created_at || entry.entry_date,
        reference: entry.reference
      }));
      
      setPendingJournalEntries(formattedEntries);
      const totalAmount = formattedEntries.reduce((sum, e) => sum + e.amount, 0);
      const payrollAmount = formattedRuns.reduce((sum, r) => sum + (r.totalNet || 0), 0);
      const pendingCount = formattedRuns.length + formattedEntries.length;
      
      setStats(prev => ({
        ...prev,
        pendingApprovals: pendingCount,
        pendingAmount: totalAmount + payrollAmount,
        approvalRate: prev.totalIncome > 0 ? ((prev.totalIncome - totalAmount) / prev.totalIncome) * 100 : 0
      }));
    }

    // Process Budgets
    if (budgetsRes.status === 'fulfilled' && budgetsRes.value) {
      setPendingBudgets(budgetsRes.value.budgets || []);
    }

    // Process Trends
    if (trendsRes.status === 'fulfilled' && trendsRes.value) {
      setTrendData(trendsRes.value);
    }

    // Process Categories
    if (categoriesRes.status === 'fulfilled' && categoriesRes.value) {
      setCategoryData(categoriesRes.value);
    }

    // Process Recent Activity
    if (recentEntriesRes.status === 'fulfilled' && recentEntriesRes.value) {
      setRecentActivity(recentEntriesRes.value.entries || []);
    }

    if (showToast) toast.success('Dashboard refreshed');

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    setError(error.message);
    toast.error('Failed to load dashboard data');
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

  const handleApprovePayroll = async (runId) => {
    if (!window.confirm('Approve this payroll run?')) return;
    setProcessingId(runId);
    try {
      await payrollService.approvePayrollRun(runId);
      toast.success('Payroll run approved successfully');
      fetchDashboardData(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve payroll run');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayroll = async (runId) => {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;
    setProcessingId(runId);
    try {
      await payrollService.rejectPayrollRun(runId, { reason });
      toast.success('Payroll run rejected');
      fetchDashboardData(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject payroll run');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveJournal = async (entryId) => {
    if (!window.confirm('Approve this journal entry?')) return;
    setProcessingId(entryId);
    try {
      await accountantService.approveJournalEntry(entryId);
      toast.success('Journal entry approved successfully');
      fetchDashboardData(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve journal entry');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectJournal = async (entryId) => {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;
    setProcessingId(entryId);
    try {
      await accountantService.rejectJournalEntry(entryId, { reason });
      toast.success('Journal entry rejected');
      fetchDashboardData(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject journal entry');
    } finally {
      setProcessingId(null);
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

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Treasurer Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor financial health, review approvals, and manage budgets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link
                to="/treasurer/budgets/create"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-xl hover:bg-[rgb(25,142,69)] transition-colors shadow-sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Budget
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            value={stats.netBalance}
            subtitle={stats.netBalance >= 0 ? 'Favorable' : 'Unfavorable'}
            icon={CurrencyDollarIcon}
            color={stats.netBalance >= 0 ? "blue" : "orange"}
            isCurrency={true}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            subtitle={`${formatCurrency(stats.pendingAmount)} awaiting review`}
            icon={ClockIcon}
            color="yellow"
            isCurrency={false}
          />
        </div>

        {/* Pending Payroll Runs Section */}
        {pendingPayrollRuns.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-yellow-600" />
              Pending Payroll Approvals ({pendingPayrollRuns.length})
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Gross</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Net</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pendingPayrollRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {run.runNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(run.periodStart)} - {formatDate(run.periodEnd)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          {formatCurrency(run.totalGross)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[rgb(31,178,86)]">
                          {formatCurrency(run.totalNet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {run.submittedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/payroll/runs/${run.id}`)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleApprovePayroll(run.id)}
                              disabled={processingId === run.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectPayroll(run.id)}
                              disabled={processingId === run.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pending Journal Entries Section */}
        {pendingJournalEntries.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-yellow-600" />
              Pending Journal Approvals ({pendingJournalEntries.length})
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pendingJournalEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.entryNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(entry.submittedAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {entry.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.submittedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/accounting/journal-entries/${entry.id}`)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleApproveJournal(entry.id)}
                              disabled={processingId === entry.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRejectJournal(entry.id)}
                              disabled={processingId === entry.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
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
                <div className="flex items-center justify-center h-full text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Expense Distribution</h2>
            <p className="text-xs text-gray-500 mb-6">Breakdown by category</p>
            <div className="h-80">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No category data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity & Budgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity, idx) => (
                  <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.status === 'POSTED' ? 'bg-green-50' : 'bg-yellow-50'
                      }`}>
                        {activity.status === 'POSTED' ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <ClockIcon className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description || 'Journal Entry'}</p>
                        <p className="text-xs text-gray-500">{activity.entry_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(activity.total_debit || activity.total_credit)}</p>
                        <p className="text-xs text-gray-400">{formatDate(activity.date)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-gray-400">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Budgets */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Pending Budgets</h2>
              {pendingBudgets.length > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                  {pendingBudgets.length} pending
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {pendingBudgets.length > 0 ? (
                pendingBudgets.map((budget) => (
                  <div key={budget.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{budget.name || 'Budget'}</p>
                        <p className="text-xs text-gray-500">{budget.department || 'General'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-600">{formatCurrency(budget.amount || 0)}</p>
                        <p className="text-xs text-gray-400">{budget.period || 'Annual'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-gray-400">
                  <ReceiptPercentIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending budgets</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary Footer */}
        <div className="mt-8 bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <WalletIcon className="h-5 w-5 opacity-90" />
                <span className="text-sm font-medium opacity-90">Total Net Assets</span>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(stats.accountBalance)}</p>
              <p className="text-xs opacity-75 mt-1">As of {formatDate(new Date())}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <ChartBarIcon className="h-5 w-5 opacity-90" />
                <span className="text-sm font-medium opacity-90">Approval Rate</span>
              </div>
              <p className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</p>
              <p className="text-xs opacity-75 mt-1">of transactions approved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasurerDashboard;