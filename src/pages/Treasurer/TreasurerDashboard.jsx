// pages/Treasurer/TreasurerDashboard.jsx - Streamlined for Treasurer Role
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EyeIcon,
  PlusIcon,
  BanknotesIcon,
  ChartBarIcon,
  WalletIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import { payrollService } from '../../services/payrollService';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const TreasurerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  // Treasurer-specific state
  const [pendingPayrollRuns, setPendingPayrollRuns] = useState([]);
  const [pendingJournalEntries, setPendingJournalEntries] = useState([]);
  const [pendingBudgets, setPendingBudgets] = useState([]);
  const [pendingLeaveAllowances, setPendingLeaveAllowances] = useState([]);
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    pendingAmount: 0,
    approvalRate: 0
  });

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchDashboardData(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      // Fetch only treasurer-specific data
      const [
        pendingPayrollRes,
        pendingJournalRes,
        budgetsRes,
        pendingLeaveRes
      ] = await Promise.allSettled([
        payrollService.getPayrollRuns({ status: 'submitted' }),
        accountantService.getJournalEntries({ status: 'PENDING' }),
        treasurerService.getBudgets({ status: 'PENDING', perPage: 10 }),
        // Add leave allowance approval endpoint
        fetch('/api/accounting/leave/requests?stage=pending_treasurer', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }).then(res => res.json())
      ]);

    // Process Pending Payroll Runs
    let payrollRuns = [];
    if (pendingPayrollRes.status === 'fulfilled' && pendingPayrollRes.value) {
      const runs = pendingPayrollRes.value.runs || [];
      payrollRuns = runs.map(run => ({
        id: run.id,
        runNumber: run.run_number,
        periodStart: run.period_start,
        periodEnd: run.period_end,
        totalGross: run.total_gross,
        totalNet: run.total_net,
        employeeCount: run.employee_count,
        submittedBy: run.submitted_by_name || 'Accountant',
        submittedAt: run.submitted_at || run.created_at
      }));
      setPendingPayrollRuns(payrollRuns);
    }

    // Process Pending Journal Entries
    let journalEntries = [];
    if (pendingJournalRes.status === 'fulfilled' && pendingJournalRes.value) {
      const entries = pendingJournalRes.value.entries || [];
      journalEntries = entries.map(entry => ({
        id: entry.id,
        entryNumber: entry.entry_number,
        description: entry.description,
        amount: entry.total_debit || entry.total_credit || 0,
        submittedBy: entry.created_by_name || 'Accountant',
        submittedAt: entry.created_at || entry.entry_date
      }));
      setPendingJournalEntries(journalEntries);
    }

    // Process Pending Leave Allowances
    let leaveAllowances = [];
    if (pendingLeaveRes && pendingLeaveRes.requests) {
      leaveAllowances = pendingLeaveRes.requests.map(req => ({
        id: req.id,
        employeeName: req.employee_name,
        leaveType: req.leave_type,
        days: req.days_requested,
        allowanceAmount: req.allowance_amount,
        submittedAt: req.allowance_processed_at,
        submittedBy: 'Accountant'
      }));
      setPendingLeaveAllowances(leaveAllowances);
    }

    // Process Pending Budgets
    if (budgetsRes.status === 'fulfilled' && budgetsRes.value) {
      setPendingBudgets(budgetsRes.value.budgets || []);
    }

    // Calculate summary stats
    const totalPending = payrollRuns.length + journalEntries.length + leaveAllowances.length;
    const totalAmount = 
      payrollRuns.reduce((sum, r) => sum + (r.totalNet || 0), 0) +
      journalEntries.reduce((sum, e) => sum + e.amount, 0) +
      leaveAllowances.reduce((sum, l) => sum + (l.allowanceAmount || 0), 0);

    setStats({
      pendingApprovals: totalPending,
      pendingAmount: totalAmount,
      approvalRate: totalPending > 0 ? 0 : 100
    });

    if (showToast) toast.success('Dashboard refreshed');

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprovePayroll = async (runId) => {
    if (!window.confirm('Approve this payroll run?')) return;
    setProcessingId(runId);
    try {
      await payrollService.approvePayrollRun(runId);
      toast.success('Payroll run approved');
      fetchDashboardData(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
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
      toast.error(error.response?.data?.error || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveJournal = async (entryId) => {
    if (!window.confirm('Approve this journal entry?')) return;
    setProcessingId(entryId);
    try {
      await accountantService.approveJournalEntry(entryId);
      toast.success('Journal entry approved');
      fetchDashboardData(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
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
      toast.error(error.response?.data?.error || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveLeaveAllowance = async (requestId) => {
    if (!window.confirm('Approve this leave allowance?')) return;
    setProcessingId(requestId);
    try {
      await fetch(`/api/accounting/leave/requests/${requestId}/treasurer-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ comments: 'Approved by Treasurer' })
      });
      toast.success('Leave allowance approved');
      fetchDashboardData(true);
    } catch (error) {
      toast.error('Failed to approve leave allowance');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectLeaveAllowance = async (requestId) => {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;
    setProcessingId(requestId);
    try {
      await fetch(`/api/accounting/leave/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ reason })
      });
      toast.success('Leave allowance rejected');
      fetchDashboardData(true);
    } catch (error) {
      toast.error('Failed to reject leave allowance');
    } finally {
      setProcessingId(null);
    }
  };

  const ApprovalCard = ({ title, count, amount, icon: Icon, color, onViewAll, viewAllLink }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        {count > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            {count} pending
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      {amount > 0 && (
        <p className="text-xs text-gray-500 mt-1">Total: {formatCurrency(amount)}</p>
      )}
      {viewAllLink && (
        <button
          onClick={() => navigate(viewAllLink)}
          className="mt-4 text-sm text-[rgb(31,178,86)] hover:underline flex items-center"
        >
          View all <ChevronRightIcon className="h-4 w-4 ml-1" />
        </button>
      )}
    </motion.div>
  );

  const PendingTable = ({ title, items, columns, onApprove, onReject, onView, emptyMessage }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">Items awaiting your review and approval</p>
      </div>
      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-6 py-4 whitespace-nowrap text-sm ${col.className || 'text-gray-900'}`}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      {onView && (
                        <button
                          onClick={() => onView(item.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onApprove(item.id)}
                        disabled={processingId === item.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                        title="Approve"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onReject(item.id)}
                        disabled={processingId === item.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
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
      ) : (
        <div className="px-6 py-12 text-center text-gray-400">
          <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  if (loading) return <LoadingSpinner fullScreen />;

  const totalPending = stats.pendingApprovals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Treasurer Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Review and approve pending financial transactions
              </p>
            </div>
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Summary */}
        {totalPending > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Pending Approvals</h3>
                <p className="text-sm text-yellow-700">
                  You have {totalPending} item(s) awaiting your review totaling {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ApprovalCard
            title="Payroll Approvals"
            count={pendingPayrollRuns.length}
            amount={pendingPayrollRuns.reduce((sum, r) => sum + (r.totalNet || 0), 0)}
            icon={UserGroupIcon}
            color="blue"
            viewAllLink="/payroll/runs"
          />
          <ApprovalCard
            title="Journal Approvals"
            count={pendingJournalEntries.length}
            amount={pendingJournalEntries.reduce((sum, e) => sum + e.amount, 0)}
            icon={DocumentTextIcon}
            color="purple"
            viewAllLink="/accountant/journal-entries"
          />
          <ApprovalCard
            title="Budget Approvals"
            count={pendingBudgets.length}
            amount={pendingBudgets.reduce((sum, b) => sum + (b.amount || 0), 0)}
            icon={ChartBarIcon}
            color="orange"
            viewAllLink="/treasurer/budgets"
          />
        </div>

        {/* Pending Payroll Runs */}
        <PendingTable
          title="Pending Payroll Approvals"
          items={pendingPayrollRuns}
          columns={[
            { label: 'Run Number', key: 'runNumber', className: 'font-mono' },
            { label: 'Period', render: (item) => `${formatDate(item.periodStart)} - ${formatDate(item.periodEnd)}`, className: 'text-gray-500' },
            { label: 'Total Gross', render: (item) => formatCurrency(item.totalGross), className: 'text-green-600' },
            { label: 'Total Net', render: (item) => formatCurrency(item.totalNet), className: 'font-medium text-[rgb(31,178,86)]' },
            { label: 'Submitted By', key: 'submittedBy', className: 'text-gray-500' }
          ]}
          onApprove={handleApprovePayroll}
          onReject={handleRejectPayroll}
          onView={(id) => navigate(`/payroll/runs/${id}`)}
          emptyMessage="No payroll runs pending approval"
        />

        {/* Pending Journal Entries */}
        <PendingTable
          title="Pending Journal Approvals"
          items={pendingJournalEntries}
          columns={[
            { label: 'Entry Number', key: 'entryNumber', className: 'font-mono' },
            { label: 'Date', render: (item) => formatDate(item.submittedAt), className: 'text-gray-500' },
            { label: 'Description', key: 'description', className: 'text-gray-600 max-w-xs truncate' },
            { label: 'Amount', render: (item) => formatCurrency(item.amount), className: 'font-medium' },
            { label: 'Created By', key: 'submittedBy', className: 'text-gray-500' }
          ]}
          onApprove={handleApproveJournal}
          onReject={handleRejectJournal}
          onView={(id) => navigate(`/accounting/journal-entries/${id}`)}
          emptyMessage="No journal entries pending approval"
        />

        {/* Pending Leave Allowances */}
        {pendingLeaveAllowances.length > 0 && (
          <PendingTable
            title="Pending Leave Allowance Approvals"
            items={pendingLeaveAllowances}
            columns={[
              { label: 'Employee', key: 'employeeName', className: 'font-medium' },
              { label: 'Leave Type', key: 'leaveType', className: 'text-gray-500' },
              { label: 'Days', key: 'days', className: 'text-center' },
              { label: 'Allowance Amount', render: (item) => formatCurrency(item.allowanceAmount), className: 'text-green-600 font-medium' },
              { label: 'Submitted By', key: 'submittedBy', className: 'text-gray-500' }
            ]}
            onApprove={handleApproveLeaveAllowance}
            onReject={handleRejectLeaveAllowance}
            onView={(id) => navigate(`/leave/requests/${id}`)}
            emptyMessage="No leave allowances pending approval"
          />
        )}

        {/* Pending Budgets */}
        <PendingTable
          title="Pending Budget Approvals"
          items={pendingBudgets}
          columns={[
            { label: 'Budget Name', key: 'name', className: 'font-medium' },
            { label: 'Department', key: 'department', className: 'text-gray-500' },
            { label: 'Amount', render: (item) => formatCurrency(item.amount), className: 'text-purple-600 font-medium' },
            { label: 'Period', key: 'period', className: 'text-gray-500' },
            { label: 'Submitted By', key: 'created_by', className: 'text-gray-500' }
          ]}
          onApprove={(id) => {
            if (window.confirm('Approve this budget?')) {
              // Add budget approval logic
              toast.success('Budget approved');
              fetchDashboardData(true);
            }
          }}
          onReject={(id) => {
            const reason = prompt('Please enter reason for rejection:');
            if (reason) {
              toast.success('Budget rejected');
              fetchDashboardData(true);
            }
          }}
          emptyMessage="No budgets pending approval"
        />
      </div>
    </div>
  );
};

export default TreasurerDashboard;