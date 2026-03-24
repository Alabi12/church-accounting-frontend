// src/pages/Payroll/ReviewPayroll.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ReviewPayroll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['payrollRun', id],
    queryFn: () => payrollService.getPayrollRun(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => payrollService.approvePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRun', id]);
      toast.success('Payroll run approved successfully');
      navigate('/payroll/pending-approval');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve payroll');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => payrollService.rejectPayroll(id, { reason: rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRun', id]);
      toast.success('Payroll run rejected');
      navigate('/payroll/pending-approval');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reject payroll');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payroll run details" />;

  const run = data?.data;
  if (!run) return <ErrorAlert message="Payroll run not found" />;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const items = run.items || [];

  const totalGross = items.reduce((sum, item) => sum + (item.gross_pay || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const totalDeductions = items.reduce((sum, item) => sum + ((item.pension_amount || 0) + (item.other_deductions || 0)), 0);
  const totalNet = items.reduce((sum, item) => sum + (item.net_pay || 0), 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Review Payroll Run</h1>
        <p className="mt-2 text-sm text-gray-500">
          Step 3: Treasurer reviews payroll run {run.run_number}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">{items.length}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Gross</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(totalGross)}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Deductions</dt>
            <dd className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(totalDeductions + totalTax)}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Net</dt>
            <dd className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(totalNet)}</dd>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employee Payroll Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">PAYE Tax</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SSNIT</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.employee_name}</div>
                    <div className="text-sm text-gray-500">{item.department || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(item.gross_pay)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">{formatCurrency(item.tax_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">{formatCurrency(item.pension_amount || 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">{formatCurrency(item.net_pay)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">Totals</td>
                <td className="px-6 py-4 text-sm font-semibold text-right">{formatCurrency(totalGross)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-red-600">{formatCurrency(totalTax)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-red-600">{formatCurrency(totalDeductions)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">{formatCurrency(totalNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setShowRejectDialog(true)}
          className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
        >
          Reject
        </button>
        <button
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {approveMutation.isPending ? 'Approving...' : 'Approve Payroll'}
        </button>
      </div>

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
              className="w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600"
              rows="3"
            />
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}