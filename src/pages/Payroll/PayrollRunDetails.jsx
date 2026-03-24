// src/pages/Payroll/PayrollRunDetails.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  PrinterIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function PayrollRunDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  // Helper function to safely format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₵0.00';
    }
    const num = parseFloat(amount);
    if (isNaN(num)) return '₵0.00';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Helper to safely get number
  const safeNumber = (value) => {
    if (value === undefined || value === null) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Fetch payroll run details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payrollRun', id],
    queryFn: () => payrollService.getPayrollRun(id),
  });

  // Fetch payslips for this run
  const { data: payslipsData } = useQuery({
    queryKey: ['payslips', 'run', id],
    queryFn: () => payrollService.getPayrollRunPayslips?.(id) || Promise.resolve({ data: { payslips: [] } }),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => payrollService.approvePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRun', id]);
      toast.success('Payroll run approved successfully');
      setShowApproveDialog(false);
    },
    onError: () => toast.error('Failed to approve payroll run'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => payrollService.rejectPayroll(id, { reason: rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRun', id]);
      toast.success('Payroll run rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: () => toast.error('Failed to reject payroll run'),
  });

  const postMutation = useMutation({
    mutationFn: () => payrollService.postPayrollJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRun', id]);
      toast.success('Journal entries posted successfully');
      setShowPostDialog(false);
    },
    onError: () => toast.error('Failed to post journal entries'),
  });

  const generatePayslipsMutation = useMutation({
    mutationFn: () => payrollService.generatePayslips(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payslips', 'run', id]);
      toast.success('Payslips generated successfully');
    },
    onError: () => toast.error('Failed to generate payslips'),
  });

  const emailPayslipsMutation = useMutation({
    mutationFn: () => payrollService.bulkEmailPayslips(id),
    onSuccess: () => toast.success('Payslips emailed successfully'),
    onError: () => toast.error('Failed to email payslips'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payroll run details" />;

  const run = data?.data;
  if (!run) return <ErrorAlert message="Payroll run not found" />;

  // Calculate totals from items if available (for fallback)
  const items = run.items || [];
  
  // Calculate totals from items if backend totals are missing
  const calculatedTotals = items.reduce((acc, item) => {
    acc.gross += safeNumber(item.gross_pay);
    acc.tax += safeNumber(item.tax_amount);
    acc.ssnit += safeNumber(item.pension_amount);
    acc.deductions += safeNumber(item.other_deductions);
    acc.net += safeNumber(item.net_pay);
    return acc;
  }, { gross: 0, tax: 0, ssnit: 0, deductions: 0, net: 0 });

  // Use backend totals if available, otherwise use calculated totals
  const totalGross = safeNumber(run.total_gross) || calculatedTotals.gross;
  const totalTax = safeNumber(run.total_tax) || calculatedTotals.tax;
  const totalDeductions = safeNumber(run.total_deductions) || (calculatedTotals.tax + calculatedTotals.ssnit + calculatedTotals.deductions);
  const totalNet = safeNumber(run.total_net) || calculatedTotals.net;
  const employeeCount = run.employee_count || items.length;

  const payslips = payslipsData?.data?.payslips || [];
  const generatedPayslipsCount = payslips.filter(p => p.pdf_generated_at).length;
  const emailedPayslipsCount = payslips.filter(p => p.emailed_at).length;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      draft: 'bg-gray-100 text-gray-800',
      initiated: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      processed: 'bg-blue-100 text-blue-800',
      posted: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const canApprove = run.status === 'initiated' || run.status === 'draft';
  const canPost = run.status === 'approved';
  const canGeneratePayslips = run.status === 'processed' || run.status === 'posted';
  const canEmailPayslips = generatedPayslipsCount > 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/payroll/runs')}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Payroll Run: {run.run_number}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(run.status)}`}>
              {run.status?.toUpperCase() || 'DRAFT'}
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Created on {formatDateTime(run.created_at)} • Period: {formatDate(run.period_start)} to {formatDate(run.period_end)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {canApprove && (
          <>
            <button
              onClick={() => setShowApproveDialog(true)}
              className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Approve
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Reject
            </button>
          </>
        )}

        {canPost && (
          <button
            onClick={() => setShowPostDialog(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Post to Journal
          </button>
        )}

        {canGeneratePayslips && (
          <button
            onClick={() => generatePayslipsMutation.mutate()}
            disabled={generatePayslipsMutation.isPending}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            {generatePayslipsMutation.isPending ? 'Generating...' : 'Generate Payslips'}
          </button>
        )}

        {canEmailPayslips && (
          <button
            onClick={() => emailPayslipsMutation.mutate()}
            disabled={emailPayslipsMutation.isPending}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            {emailPayslipsMutation.isPending ? 'Sending...' : 'Email Payslips'}
          </button>
        )}

        <button
          onClick={() => window.print()}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <PrinterIcon className="h-4 w-4 mr-2" />
          Print
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Employees</dt>
                  <dd className="text-lg font-medium text-gray-900">{employeeCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Gross</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalGross)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Deductions</dt>
                  <dd className="text-lg font-medium text-red-600">{formatCurrency(totalDeductions)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckBadgeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Net</dt>
                  <dd className="text-lg font-medium text-[rgb(31,178,86)]">{formatCurrency(totalNet)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`${
              activeTab === 'summary'
                ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`${
              activeTab === 'employees'
                ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('payslips')}
            className={`${
              activeTab === 'payslips'
                ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Payslips {payslips.length > 0 && `(${payslips.length})`}
          </button>
        </nav>
      </div>

      {/* Tab Content - Summary */}
      {activeTab === 'summary' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Payroll Summary</h3>
            
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div><dt className="text-sm font-medium text-gray-500">Run Number</dt><dd className="mt-1 text-sm text-gray-900">{run.run_number}</dd></div>
              <div><dt className="text-sm font-medium text-gray-500">Status</dt><dd className="mt-1"><span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(run.status)}`}>{run.status}</span></dd></div>
              <div><dt className="text-sm font-medium text-gray-500">Period Start</dt><dd className="mt-1 text-sm text-gray-900">{formatDate(run.period_start)}</dd></div>
              <div><dt className="text-sm font-medium text-gray-500">Period End</dt><dd className="mt-1 text-sm text-gray-900">{formatDate(run.period_end)}</dd></div>
              <div><dt className="text-sm font-medium text-gray-500">Payment Date</dt><dd className="mt-1 text-sm text-gray-900">{formatDate(run.payment_date)}</dd></div>
              <div><dt className="text-sm font-medium text-gray-500">Total Gross</dt><dd className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(totalGross)}</dd></div>
              <div><dt className="text-sm font-medium text-gray-500">Total Deductions</dt><dd className="mt-1 text-sm font-semibold text-red-600">{formatCurrency(totalDeductions)}</dd></div>
              <div><dt className="text-sm font-medium text-gray-500">Total Net</dt><dd className="mt-1 text-sm font-semibold text-[rgb(31,178,86)]">{formatCurrency(totalNet)}</dd></div>
            </dl>
          </div>
        </div>
      )}

      {/* Tab Content - Employees */}
      {activeTab === 'employees' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Employee Payroll Details</h3>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Gross Pay</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">PAYE</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">SSNIT</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Other Deductions</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                        <div className="font-medium text-gray-900">{item.employee_name}</div>
                        <div className="text-gray-500">{item.department || 'N/A'}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right">{formatCurrency(item.gross_pay)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">{formatCurrency(item.tax_amount)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">{formatCurrency(item.pension_amount || 0)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">{formatCurrency(item.other_deductions || 0)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-[rgb(31,178,86)]">{formatCurrency(item.net_pay)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <th className="pt-4 pl-4 pr-3 text-sm font-semibold text-gray-900 text-left">Totals</th>
                    <td className="pt-4 px-3 text-sm font-semibold text-right">{formatCurrency(totalGross)}</td>
                    <td className="pt-4 px-3 text-sm font-semibold text-right text-red-600">{formatCurrency(totalTax)}</td>
                    <td className="pt-4 px-3 text-sm font-semibold text-right text-red-600">{formatCurrency(calculatedTotals.ssnit)}</td>
                    <td className="pt-4 px-3 text-sm font-semibold text-right text-red-600">{formatCurrency(calculatedTotals.deductions)}</td>
                    <td className="pt-4 px-3 text-sm font-semibold text-right text-[rgb(31,178,86)]">{formatCurrency(totalNet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Payslips */}
      {activeTab === 'payslips' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Payslips</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Generated: {generatedPayslipsCount} / {payslips.length} • Emailed: {emailedPayslipsCount}
                </p>
              </div>
            </div>
            <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Payslip Number</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Generated</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Emailed</th>
                    <th className="relative py-3.5 pl-3 pr-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {payslips.map((payslip) => (
                    <tr key={payslip.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">{payslip.employee?.name || 'N/A'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{payslip.payslip_number}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{payslip.pdf_generated_at ? formatDateTime(payslip.pdf_generated_at) : '-'}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{payslip.emailed_at ? formatDateTime(payslip.emailed_at) : '-'}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right">
                        {payslip.pdf_generated_at && (
                          <button onClick={() => navigate(`/payroll/payslips/${payslip.id}`)} className="text-indigo-600 hover:text-indigo-900">View</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog isOpen={showApproveDialog} onClose={() => setShowApproveDialog(false)} onConfirm={() => approveMutation.mutate()} title="Approve Payroll Run" message={`Are you sure you want to approve payroll run ${run.run_number}?`} confirmText="Approve" cancelText="Cancel" type="success" />
      <ConfirmDialog isOpen={showRejectDialog} onClose={() => { setShowRejectDialog(false); setRejectionReason(''); }} onConfirm={() => rejectMutation.mutate()} title="Reject Payroll Run" message={<div><p className="mb-3">Reason for rejection:</p><textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Please provide a reason..." className="w-full rounded-md border-0 py-2 px-3 ring-1 ring-inset ring-gray-300" rows="3" /></div>} confirmText="Reject" cancelText="Cancel" type="danger" />
      <ConfirmDialog isOpen={showPostDialog} onClose={() => setShowPostDialog(false)} onConfirm={() => postMutation.mutate()} title="Post Journal Entries" message="This will create journal entries for this payroll run. Continue?" confirmText="Post" cancelText="Cancel" type="info" />
    </div>
  );
}

export default PayrollRunDetails;