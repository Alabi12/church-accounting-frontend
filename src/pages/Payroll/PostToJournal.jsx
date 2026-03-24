// src/pages/Payroll/PostToJournal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

export default function PostToJournal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRun, setSelectedRun] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payrollRuns', 'approved'],
    queryFn: () => payrollService.getPayrollRuns({ status: 'approved' })
  });

  const postMutation = useMutation({
    mutationFn: (runId) => payrollService.postPayrollJournal(runId),
    onSuccess: () => {
      toast.success('Payroll journal entries posted successfully');
      queryClient.invalidateQueries(['payrollRuns']);
      setShowConfirm(false);
      navigate('/payroll/runs');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to post journal entries');
    }
  });

  if (isLoading) return <LoadingSpinner />;

  const approvedRuns = data?.data?.runs || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  };

  const handlePost = () => {
    if (selectedRun) {
      postMutation.mutate(selectedRun.id);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Post to Journal</h1>
        <p className="mt-2 text-sm text-gray-500">Step 4: Accountant posts approved payroll to accounting journal</p>
      </div>

      {approvedRuns.length === 0 ? (
        <div className="bg-white shadow sm:rounded-lg p-8 text-center">
          <p className="text-gray-500">No approved payroll runs ready for posting</p>
        </div>
      ) : (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Gross</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Deductions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Net</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedRuns.map(run => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{run.run_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(run.period_start), 'dd MMM yyyy')} - {format(new Date(run.period_end), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(run.total_gross)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">{formatCurrency(run.total_deductions)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{formatCurrency(run.total_net)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedRun(run);
                        setShowConfirm(true);
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Post to Journal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handlePost}
        title="Post to Journal"
        message={`Are you sure you want to post payroll run ${selectedRun?.run_number} to the accounting journal? This action cannot be undone.`}
        confirmText="Post"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
}