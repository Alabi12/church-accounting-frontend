// pages/Payroll/PayrollRunList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  FunnelIcon,
  XMarkIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PayrollRunList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const isAccountant = user?.role === 'accountant' || user?.role === 'super_admin' || user?.role === 'admin';
  const isTreasurer = user?.role === 'treasurer' || user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    fetchRuns();
    // Refresh every 30 seconds to check for new approvals
    const interval = setInterval(fetchRuns, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await payrollService.getPayrollRuns(params);
      setRuns(response.runs || []);
    } catch (error) {
      console.error('Error fetching payroll runs:', error);
      toast.error('Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (id) => {
    if (!window.confirm('Submit this payroll run for approval?')) return;
    setProcessingId(id);
    try {
      await payrollService.submitPayrollRun(id);
      toast.success('Payroll run submitted for approval');
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit payroll run');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this payroll run?')) return;
    setProcessingId(id);
    try {
      await payrollService.approvePayrollRun(id);
      toast.success('Payroll run approved successfully');
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve payroll run');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;
    setProcessingId(id);
    try {
      await payrollService.rejectPayrollRun(id, { reason });
      toast.success('Payroll run rejected');
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject payroll run');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePost = async (id) => {
    if (!window.confirm('Post this payroll run to the general ledger? This action cannot be undone.')) return;
    setProcessingId(id);
    try {
      const result = await payrollService.postPayrollJournal(id);
      toast.success('Payroll posted to ledger successfully');
      fetchRuns();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to post payroll');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <ClockIcon className="h-3 w-3" />, label: 'Draft', action: 'Submit' },
      submitted: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <ClockIcon className="h-3 w-3" />, label: 'Pending Approval', action: 'Approve' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircleIcon className="h-3 w-3" />, label: 'Approved', action: 'Post' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircleIcon className="h-3 w-3" />, label: 'Rejected', action: 'Review' },
      processed: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <DocumentDuplicateIcon className="h-3 w-3" />, label: 'Posted to Ledger', action: 'View' },
    };
    const config = statusMap[status?.toLowerCase()] || statusMap.draft;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setShowFilters(false);
  };

  if (loading) return <LoadingSpinner />;

  // Calculate counts for each status
  const draftCount = runs.filter(r => r.status === 'draft').length;
  const submittedCount = runs.filter(r => r.status === 'submitted').length;
  const approvedCount = runs.filter(r => r.status === 'approved').length;
  const processedCount = runs.filter(r => r.status === 'processed').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Runs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage payroll runs through the approval workflow
            </p>
          </div>
          {isAccountant && (
            <button
              onClick={() => navigate('/payroll/calculate')}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Payroll Run
            </button>
          )}
        </div>

        {/* Workflow Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border-l-4 border-gray-500 shadow-sm">
            <p className="text-xs text-gray-500">Draft</p>
            <p className="text-2xl font-bold text-gray-900">{draftCount}</p>
            <p className="text-xs text-gray-400 mt-1">Ready for submission</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-yellow-500 shadow-sm">
            <p className="text-xs text-gray-500">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">{submittedCount}</p>
            <p className="text-xs text-gray-400 mt-1">Awaiting treasurer review</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-green-500 shadow-sm">
            <p className="text-xs text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-gray-400 mt-1">Ready to post</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-purple-500 shadow-sm">
            <p className="text-xs text-gray-500">Posted to Ledger</p>
            <p className="text-2xl font-bold text-purple-600">{processedCount}</p>
            <p className="text-xs text-gray-400 mt-1">Completed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {statusFilter !== 'all' && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-red-600">
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processed">Posted</option>
              </select>
            </div>
          )}
        </div>

        {/* Runs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Run Number</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Total Gross</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Total Net</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <DocumentDuplicateIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No payroll runs found</p>
                      <p className="text-sm text-gray-400 mt-1">Create your first payroll run to get started.</p>
                    </td>
                  </tr>
                ) : (
                  runs.map((run, index) => (
                    <motion.tr
                      key={run.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{run.run_number}</p>
                          <p className="text-xs text-gray-500">Created: {formatDate(run.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(run.period_start)} - {formatDate(run.period_end)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        {formatCurrency(run.total_gross)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[rgb(31,178,86)]">
                        {formatCurrency(run.total_net)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(run.status)}
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
                          
                          {/* Accountant Actions */}
                          {isAccountant && run.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitForApproval(run.id)}
                              disabled={processingId === run.id}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Submit for Approval"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* Treasurer Actions */}
                          {isTreasurer && run.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => handleApprove(run.id)}
                                disabled={processingId === run.id}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleReject(run.id)}
                                disabled={processingId === run.id}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {/* Accountant Actions - Post to Ledger */}
                          {isAccountant && run.status === 'approved' && (
                            <button
                              onClick={() => handlePost(run.id)}
                              disabled={processingId === run.id}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Post to Ledger"
                            >
                              <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* Print Payslip */}
                          {run.status === 'processed' && (
                            <button
                              onClick={() => navigate(`/payroll/runs/${run.id}/payslips`)}
                              className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"
                              title="View Payslips"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workflow Guide */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Payroll Workflow Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">1</div>
              <span className="text-gray-700">Accountant creates payroll run</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-700">2</div>
              <span className="text-gray-700">Submits for approval → Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-green-700">3</div>
              <span className="text-gray-700">Treasurer approves → Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-purple-700">4</div>
              <span className="text-gray-700">Accountant posts to ledger → Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollRunList;