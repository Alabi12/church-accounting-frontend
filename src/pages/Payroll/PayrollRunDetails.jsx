// src/pages/Payroll/PayrollRunDetails.jsx (continued)
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
  CalendarIcon,
  PrinterIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
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
  const [activeTab, setActiveTab] = useState('summary'); // summary, employees, deductions

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

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => payrollService.approvePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRun', id]);
      toast.success('Payroll run approved successfully');
      setShowApproveDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to approve payroll run');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: () => payrollService.rejectPayroll(id, { reason: rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRun', id]);
      toast.success('Payroll run rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error('Failed to reject payroll run');
    },
  });

  // Post journal mutation
  const postMutation = useMutation({
    mutationFn: () => payrollService.postPayrollJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRun', id]);
      toast.success('Journal entries posted successfully');
      setShowPostDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to post journal entries');
    },
  });

  // Generate payslips mutation
  const generatePayslipsMutation = useMutation({
    mutationFn: () => payrollService.generatePayslips(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payslips', 'run', id]);
      toast.success('Payslips generated successfully');
    },
    onError: (error) => {
      toast.error('Failed to generate payslips');
    },
  });

  // Email payslips mutation
  const emailPayslipsMutation = useMutation({
    mutationFn: () => payrollService.bulkEmailPayslips(id),
    onSuccess: () => {
      toast.success('Payslips emailed successfully');
    },
    onError: (error) => {
      toast.error('Failed to email payslips');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payroll run details" />;

  const run = data?.data;
  if (!run) return <ErrorAlert message="Payroll run not found" />;

  const payslips = payslipsData?.data?.payslips || [];
  const generatedPayslipsCount = payslips.filter(p => p.pdf_generated_at).length;
  const emailedPayslipsCount = payslips.filter(p => p.emailed_at).length;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy HH:mm');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'posted':
        return 'bg-purple-100 text-purple-800';
      case 'void':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canApprove = run.status === 'draft';
  const canPost = run.status === 'approved';
  const canGeneratePayslips = run.status === 'posted' || run.status === 'paid';
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
              {run.status}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Employees
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {run.employee_count || 0}
                  </dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Gross
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(run.total_gross)}
                  </dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Deductions
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(run.total_deductions)}
                  </dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Net
                  </dt>
                  <dd className="text-lg font-medium text-[rgb(31,178,86)]">
                    {formatCurrency(run.total_net)}
                  </dd>
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

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Payroll Summary
            </h3>
            
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Run Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{run.run_number}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(run.status)}`}>
                    {run.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Period Start</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(run.period_start)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Period End</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(run.period_end)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(run.payment_date)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900">{run.created_by || 'System'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(run.created_at)}</dd>
              </div>
              {run.approved_at && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                    <dd className="mt-1 text-sm text-gray-900">{run.approved_by || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Approved At</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(run.approved_at)}</dd>
                  </div>
                </>
              )}
            </dl>

            {run.journal_entry_id && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Journal Entry Posted
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Journal Entry ID: {run.journal_entry_id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Employee Payroll Details
            </h3>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Employee
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Gross Pay
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      PAYE
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      SSNIT
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Other Deductions
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Net Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {run.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                        <div className="font-medium text-gray-900">{item.employee_name}</div>
                        <div className="text-gray-500">{item.employee?.department || 'N/A'}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                        {formatCurrency(item.gross_pay)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(item.tax_amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(item.pension_amount || 0)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(item.other_deductions || 0)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-[rgb(31,178,86)]">
                        {formatCurrency(item.net_pay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <th scope="row" colSpan="1" className="pt-4 pl-4 pr-3 text-sm font-semibold text-gray-900 text-left">
                      Totals
                    </th>
                    <td className="pt-4 px-3 text-sm font-semibold text-right">
                      {formatCurrency(run.total_gross)}
                    </td>
                    <td className="pt-4 px-3 text-sm font-semibold text-right text-red-600">
                      {formatCurrency(run.total_tax)}
                    </td>
                    <td className="pt-4 px-3 text-sm font-semibold text-right text-red-600">
                      {formatCurrency(run.total_deductions - run.total_tax)}
                    </td>
                    <td className="pt-4 px-3 text-sm font-semibold text-right text-red-600">
                      {formatCurrency(0)}
                    </td>
                    <td className="pt-4 px-3 text-sm font-semibold text-right text-[rgb(31,178,86)]">
                      {formatCurrency(run.total_net)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payslips' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Payslips
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  Generated: {generatedPayslipsCount} / {payslips.length} • Emailed: {emailedPayslipsCount}
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Employee
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Payslip Number
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Generated
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Emailed
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Viewed
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {payslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {payslip.employee?.name || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {payslip.payslip_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {payslip.pdf_generated_at ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            Generated
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {payslip.pdf_generated_at ? formatDateTime(payslip.pdf_generated_at) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {payslip.emailed_at ? formatDateTime(payslip.emailed_at) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {payslip.viewed_by_employee ? 'Yes' : 'No'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        {payslip.pdf_generated_at && (
                          <button
                            onClick={() => navigate(`/payroll/payslips/${payslip.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payslips.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500">
                        No payslips generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Approval Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={() => approveMutation.mutate()}
        title="Approve Payroll Run"
        message={`Are you sure you want to approve payroll run ${run.run_number}? This will lock the payroll for further changes.`}
        confirmText="Approve"
        cancelText="Cancel"
        type="success"
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setRejectionReason('');
        }}
        onConfirm={() => rejectMutation.mutate()}
        title="Reject Payroll Run"
        message={
          <div>
            <p className="mb-3">Are you sure you want to reject this payroll run?</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm"
              rows="3"
            />
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
      />

      {/* Post Journal Dialog */}
      <ConfirmDialog
        isOpen={showPostDialog}
        onClose={() => setShowPostDialog(false)}
        onConfirm={() => postMutation.mutate()}
        title="Post Journal Entries"
        message="This will create journal entries for this payroll run. This action cannot be undone. Continue?"
        confirmText="Post"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
}

export default PayrollRunDetails;