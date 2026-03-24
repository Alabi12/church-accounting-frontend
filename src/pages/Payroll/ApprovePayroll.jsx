// src/pages/Payroll/ApprovePayroll.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ApprovePayroll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

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
  const totalNet = items.reduce((sum, item) => sum + (item.net_pay || 0), 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Approve Payroll Run</h1>
        <p className="mt-2 text-sm text-gray-500">
          Step 3: Treasurer approves payroll run {run.run_number}
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payroll Summary</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Run Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{run.run_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Period</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(run.period_start)} - {formatDate(run.period_end)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(run.payment_date)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Employees</dt>
              <dd className="mt-1 text-sm text-gray-900">{items.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Gross Payroll</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(totalGross)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Net Payroll</dt>
              <dd className="mt-1 text-sm font-semibold text-green-600">{formatCurrency(totalNet)}</dd>
            </div>
          </dl>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ By approving this payroll run, you confirm that all calculations are correct and the payroll is ready for posting to the accounting journal.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => navigate('/payroll/pending-approval')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => approveMutation.mutate()}
        title="Approve Payroll Run"
        message={`Are you sure you want to approve payroll run ${run.run_number}? This will lock the payroll and make it ready for journal posting.`}
        confirmText="Approve"
        cancelText="Cancel"
        type="success"
      />
    </div>
  );
}