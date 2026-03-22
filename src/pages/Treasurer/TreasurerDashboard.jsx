// pages/Treasurer/TreasurerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Cell
} from 'recharts';
import { treasurerService } from '../../services/treasurer';
import { approvalService } from '../../services/approval';
import { journalService } from '../../services/journal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

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
    accountBalance: 0
  });
  const [pendingBudgets, setPendingBudgets] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

 // In your fetchDashboardData function, update the calls to match the service:

const fetchDashboardData = async (showToast = false) => {
  try {
    if (showToast) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    console.log('📊 ========== FETCHING TREASURER DASHBOARD DATA ==========');

    // Fetch all data using your treasurerService
    const [
      statsRes,
      budgetsRes,
      trendsRes,
      categoriesRes,
      alertsRes,
      pendingItemsRes
    ] = await Promise.allSettled([
      treasurerService.getDashboardStats(),
      treasurerService.getBudgets({ status: 'PENDING', perPage: 10 }),
      treasurerService.getTrends(6),
      treasurerService.getCategoryBreakdown('month'),
      treasurerService.getAlerts(),
      treasurerService.getPendingItems()
    ]);

    // Process Stats
    if (statsRes.status === 'fulfilled' && statsRes.value) {
      console.log('Stats data:', statsRes.value);
      setStats({
        totalIncome: statsRes.value.totalIncome || 0,
        totalExpenses: statsRes.value.totalExpenses || 0,
        netBalance: statsRes.value.netBalance || 0,
        accountBalance: statsRes.value.accountBalance || 0,
        pendingApprovals: statsRes.value.pendingApprovals || 0,
        pendingAmount: statsRes.value.pendingAmount || 0
      });
    } else if (statsRes.status === 'rejected') {
      console.error('Stats fetch failed:', statsRes.reason);
    }

    // Process Pending Budgets
    if (budgetsRes.status === 'fulfilled' && budgetsRes.value) {
      console.log('Budgets data:', budgetsRes.value);
      setPendingBudgets(budgetsRes.value.budgets || []);
    }

    // Process Trend Data
    if (trendsRes.status === 'fulfilled' && trendsRes.value) {
      console.log('Trends data:', trendsRes.value);
      setTrendData(trendsRes.value);
    }

    // Process Category Data
    if (categoriesRes.status === 'fulfilled' && categoriesRes.value) {
      console.log('Categories data:', categoriesRes.value);
      setCategoryData(categoriesRes.value);
    }

    // Process Pending Items (for journal entries)
    if (pendingItemsRes.status === 'fulfilled' && pendingItemsRes.value) {
      console.log('Pending items:', pendingItemsRes.value);
      const items = pendingItemsRes.value.items || [];
      // Map pending items to approval format
      const approvalItems = items.map(item => ({
        id: item.id,
        entityId: item.id,
        description: item.title,
        amount: item.amount,
        status: 'PENDING',
        submittedBy: item.submittedBy,
        submittedAt: item.date,
        source: item.type,
        entryNumber: item.type === 'budget' ? `BUD-${item.id}` : `EXP-${item.id}`
      }));
      setPendingApprovals(approvalItems);
      
      // Update pending count from items
      setStats(prev => ({
        ...prev,
        pendingApprovals: items.length
      }));
    }

    // Process Alerts
    if (alertsRes.status === 'fulfilled' && alertsRes.value) {
      console.log('Alerts:', alertsRes.value);
      // You can use alerts for notifications if needed
    }

    if (showToast) {
      toast.success('Dashboard refreshed');
    }

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    setError(error.message || 'Failed to load dashboard data');
    toast.error('Failed to load dashboard data');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
  // Function to handle approval action
  const handleApprovalAction = async (entityId, action, notes = '') => {
    try {
      if (action === 'approve') {
        await journalService.updateJournalEntryStatus(entityId, 'APPROVED', { notes });
        toast.success('Journal entry approved successfully');
      } else if (action === 'reject') {
        await journalService.updateJournalEntryStatus(entityId, 'REJECTED', { notes });
        toast.success('Journal entry rejected');
      }
      
      // Refresh data
      fetchDashboardData(true);
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, isCurrency = true }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <span className="text-2xl font-bold text-gray-900">
          {isCurrency ? formatCurrency(value) : value}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mt-4">{title}</h3>
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="flex items-center mr-4">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
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
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Treasurer Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review and approve journal entries, manage budgets, and track financial activity
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600">
                Error: {error}
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              to="/treasurer/budgets/create"
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Budget
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Income"
            value={stats.totalIncome}
            icon={ArrowTrendingUpIcon}
            color="green"
            isCurrency={true}
          />
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses}
            icon={ArrowTrendingDownIcon}
            color="red"
            isCurrency={true}
          />
          <StatCard
            title="Net Balance"
            value={stats.netBalance}
            icon={CurrencyDollarIcon}
            color={stats.netBalance >= 0 ? "blue" : "orange"}
            isCurrency={true}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={ClockIcon}
            color="yellow"
            isCurrency={false}
          />
        </div>

        {/* Debug Info - Remove in production */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8 text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Debug Info (Click to expand)</summary>
            <div className="mt-2">
              <p><strong>Stats:</strong> {JSON.stringify(stats, null, 2)}</p>
              <p><strong>Pending Budgets:</strong> {pendingBudgets.length}</p>
              <p><strong>Pending Approvals:</strong> {pendingApprovals.length}</p>
              <p><strong>Trend Data:</strong> {trendData.length} items</p>
              <p><strong>Category Data:</strong> {categoryData.length} items</p>
            </div>
          </details>
        </div>

        {/* Pending Journal Entries Section */}
        {pendingApprovals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Pending Journal Entry Approvals</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-purple-600 font-medium">
                  Total: {formatCurrency(stats.pendingAmount || 0)}
                </span>
                <Link
                  to="/treasurer/transaction-approvals"
                  className="text-sm text-[rgb(31,178,86)] hover:underline font-medium"
                >
                  View All ({stats.pendingApprovals})
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingApprovals.filter(a => a.status === 'PENDING').slice(0, 5).map((approval) => (
                <div key={approval.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-yellow-500 mr-2" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {approval.description || `Journal Entry #${approval.entityId}`}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {approval.entryNumber || `Entry #${approval.entityId}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center mt-2 space-x-4">
                        <p className="text-xs text-gray-500">
                          Submitted by {approval.submittedBy}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(approval.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(approval.amount || 0)}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => handleApprovalAction(approval.entityId, 'approve')}
                          className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium"
                        >
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Please enter reason for rejection:');
                            if (reason) handleApprovalAction(approval.entityId, 'reject', reason);
                          }}
                          className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                        >
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Reject
                        </button>
                        <button
                          onClick={() => navigate(`/treasurer/transaction-approvals?review=${approval.entityId}`)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Income/Expense Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses Trend</h2>
            <div className="h-64">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" fill="#10b981" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No trend data available
                </div>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h2>
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No category data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Budgets Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Pending Budgets</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {pendingBudgets.length > 0 ? (
              pendingBudgets.map((budget) => (
                <div key={budget.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {budget.name || budget.budget_name || 'Budget'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {budget.department || budget.category || budget.account_category || 'Uncategorized'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(budget.amount || 0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {budget.period || budget.fiscal_year || 'Annual'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No pending budgets</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Balance Footer */}
        <div className="bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] text-white rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium opacity-90">Total Account Balance</span>
              <p className="text-xs opacity-75 mt-1">As of {formatDate(new Date())}</p>
            </div>
            <span className="text-3xl font-bold">{formatCurrency(stats.accountBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasurerDashboard;