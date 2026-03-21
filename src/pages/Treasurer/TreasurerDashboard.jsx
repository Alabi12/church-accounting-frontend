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
  BanknotesIcon,
  ExclamationTriangleIcon,
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
import { journalService } from '../../services/journal'; // Add this import
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
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingBudgets, setPendingBudgets] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (showToast = false) => {
  try {
    if (showToast) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    console.log('📊 ========== FETCHING TREASURER DASHBOARD DATA ==========');

    // Fetch all data including journal entries with PENDING status
    const [
      statsRes, 
      transactionsRes, 
      budgetsRes, 
      trendsRes, 
      categoriesRes, 
      alertsRes, 
      approvalsRes,
      pendingJournalRes
    ] = await Promise.allSettled([
      treasurerService.getDashboardStats(),
      treasurerService.getExpenses({ perPage: 5 }),
      treasurerService.getBudgets({ status: 'PENDING', perPage: 5 }),
      treasurerService.getTrends(6),
      treasurerService.getCategoryBreakdown('month'),
      treasurerService.getAlerts(),
      approvalService.getPendingApprovals('journal_entry'),
      journalService.getJournalEntries({ status: 'PENDING', perPage: 100 })
    ]);

    // Log each response
    console.log('📊 Stats response:', statsRes.status === 'fulfilled' ? statsRes.value : statsRes.reason);
    console.log('📊 Approvals response:', approvalsRes.status === 'fulfilled' ? approvalsRes.value : approvalsRes.reason);
    console.log('📊 Pending Journal response:', pendingJournalRes.status === 'fulfilled' ? pendingJournalRes.value : pendingJournalRes.reason);

    // Process stats
    if (statsRes.status === 'fulfilled' && statsRes.value) {
      setStats(prev => ({ ...prev, ...statsRes.value }));
    }

    // Process transactions
    if (transactionsRes.status === 'fulfilled' && transactionsRes.value) {
      setRecentTransactions(transactionsRes.value.expenses || []);
    }

    // Process pending budgets
    if (budgetsRes.status === 'fulfilled' && budgetsRes.value) {
      setPendingBudgets(budgetsRes.value.budgets || []);
    }

    // Process trend data
    if (trendsRes.status === 'fulfilled' && trendsRes.value) {
      setTrendData(trendsRes.value);
    }

    // Process category data
    if (categoriesRes.status === 'fulfilled' && categoriesRes.value) {
      setCategoryData(categoriesRes.value);
    }

    // Process alerts
    if (alertsRes.status === 'fulfilled' && alertsRes.value) {
      setAlerts(alertsRes.value.alerts || []);
    }

    // Collect all pending journal entries from both sources
    let allPendingEntries = [];

    // Process approval service response
    if (approvalsRes.status === 'fulfilled' && approvalsRes.value) {
      console.log('✅ APPROVALS SERVICE RESPONSE:', approvalsRes.value);
      
      // Check different response structures
      let approvals = [];
      if (approvalsRes.value.approvals) {
        approvals = approvalsRes.value.approvals;
        console.log('Found approvals in .approvals:', approvals.length);
      } else if (Array.isArray(approvalsRes.value)) {
        approvals = approvalsRes.value;
        console.log('Response is array:', approvals.length);
      } else if (approvalsRes.value.data && approvalsRes.value.data.approvals) {
        approvals = approvalsRes.value.data.approvals;
        console.log('Found approvals in .data.approvals:', approvals.length);
      } else {
        console.log('Response structure:', Object.keys(approvalsRes.value));
        // If it's a single object, try to use it
        if (approvalsRes.value.id) {
          approvals = [approvalsRes.value];
          console.log('Response is single object, converting to array');
        }
      }
      
      const approvalEntries = approvals.map(approval => {
        console.log('Processing approval:', approval);
        return {
          id: approval.id || `approval-${Math.random()}`,
          entityId: approval.entity_id || approval.entityId || approval.id,
          description: approval.description || approval.metadata?.description || `Journal Entry #${approval.entity_id}`,
          amount: approval.amount || approval.metadata?.amount || 0,
          status: approval.status || 'PENDING',
          submittedBy: approval.requester_name || approval.requester || 'Unknown',
          submittedAt: approval.submitted_at || approval.created_at,
          source: 'approval',
          entryNumber: approval.entry_number || `JE-${approval.entity_id}`
        };
      });
      
      console.log('Processed approval entries:', approvalEntries.length);
      allPendingEntries = [...allPendingEntries, ...approvalEntries];
    } else if (approvalsRes.status === 'rejected') {
      console.error('❌ Approvals service rejected:', approvalsRes.reason);
    }

    // Process journal service response (direct journal entries with PENDING status)
    if (pendingJournalRes.status === 'fulfilled' && pendingJournalRes.value) {
      console.log('✅ PENDING JOURNAL RESPONSE:', pendingJournalRes.value);
      
      const entries = pendingJournalRes.value.entries || [];
      console.log('Raw journal entries:', entries.length);
      
      const journalEntries = entries.map(entry => {
        console.log('Processing journal entry:', entry.id, entry.entry_number, entry.status);
        return {
          id: `je-${entry.id}`,
          entityId: entry.id,
          description: entry.description,
          amount: entry.total_debit || entry.total_credit || 0,
          status: entry.status,
          submittedBy: entry.created_by_name || 'Unknown',
          submittedAt: entry.created_at,
          source: 'journal',
          entryNumber: entry.entry_number,
          lines: entry.lines
        };
      });
      
      console.log('Processed journal entries:', journalEntries.length);
      allPendingEntries = [...allPendingEntries, ...journalEntries];
    } else if (pendingJournalRes.status === 'rejected') {
      console.error('❌ Pending journal service rejected:', pendingJournalRes.reason);
    }

    console.log('Total entries before dedup:', allPendingEntries.length);
    
    // Remove duplicates based on entityId
    const uniqueEntries = allPendingEntries.reduce((acc, current) => {
      const key = `${current.entityId}-${current.source}`;
      if (!acc.find(item => `${item.entityId}-${item.source}` === key)) {
        acc.push(current);
      }
      return acc;
    }, []);

    console.log('✅ FINAL PENDING ENTRIES:', uniqueEntries);
    console.log('Entries with PENDING status:', uniqueEntries.filter(a => a.status === 'PENDING').length);
    
    setPendingApprovals(uniqueEntries);

    // Calculate pending amount and count
    const pendingAmount = uniqueEntries
      .filter(a => a.status === 'PENDING')
      .reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

    setStats(prev => ({
      ...prev,
      pendingApprovals: uniqueEntries.filter(a => a.status === 'PENDING').length,
      pendingAmount: pendingAmount
    }));

    if (showToast) {
      toast.success('Dashboard refreshed');
    }

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
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
        await approvalService.approveApproval(entityId, { notes });
        toast.success('Journal entry approved successfully');
      } else if (action === 'reject') {
        await approvalService.rejectApproval(entityId, { notes });
        toast.success('Journal entry rejected');
      } else if (action === 'return') {
        await approvalService.returnApproval(entityId, { notes });
        toast.success('Journal entry returned for revision');
      }
      
      // Refresh data
      fetchDashboardData();
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

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'high' ? 'bg-red-50 border-red-200 text-red-800' :
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

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
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                          {approval.source === 'journal' ? 'Direct Entry' : 'Approval Request'}
                        </span>
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
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h2>
            <div className="h-64">
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
            </div>
          </div>
        </div>

        {/* Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Budgets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Pending Budgets</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {pendingBudgets.length > 0 ? (
                pendingBudgets.map((budget) => (
                  <div key={budget.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{budget.name || 'Budget'}</p>
                        <p className="text-xs text-gray-500">{budget.department || budget.category || 'Uncategorized'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(budget.amount || 0)}</p>
                        <p className="text-xs text-gray-400">{budget.period || 'Monthly'}</p>
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

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((txn) => (
                  <div key={txn.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{txn.description || 'Transaction'}</p>
                        <p className="text-xs text-gray-500">{txn.category || 'Uncategorized'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">-{formatCurrency(txn.amount || 0)}</p>
                        <p className="text-xs text-gray-400">{formatDate(txn.date || txn.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <BanknotesIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Balance Footer */}
        <div className="mt-8 bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] text-white rounded-lg p-6">
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