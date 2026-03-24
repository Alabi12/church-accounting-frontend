// src/pages/Payroll/EmailPayslips.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function EmailPayslips() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payrollRuns', 'payslips-generated'],
    queryFn: () => payrollService.getPayrollRuns({ has_payslips: true }),
  });

  const emailMutation = useMutation({
    mutationFn: (runId) => payrollService.bulkEmailPayslips(runId),
    onSuccess: (response) => {
      toast.success(`Sent ${response.data.sent?.length || 0} emails`);
      queryClient.invalidateQueries(['payslips']);
      navigate('/payroll/payslips');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to email payslips');
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const runs = data?.data?.runs || [];

  const handleEmail = () => {
    if (selectedRunId) {
      emailMutation.mutate(selectedRunId);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Email Payslips</h1>
        <p className="mt-2 text-sm text-gray-500">
          Email payslips to employees for a completed payroll run
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {runs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No payroll runs with generated payslips available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Payroll Run</label>
                <select
                  value={selectedRunId}
                  onChange={(e) => setSelectedRunId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Select a payroll run...</option>
                  {runs.map(run => (
                    <option key={run.id} value={run.id}>
                      {run.run_number} - {format(new Date(run.period_start), 'dd MMM yyyy')} to {format(new Date(run.period_end), 'dd MMM yyyy')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  📧 This will email payslips to all employees who have valid email addresses in their records.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => navigate('/payroll/payslips')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmail}
                  disabled={!selectedRunId || emailMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {emailMutation.isPending ? 'Sending...' : 'Email Payslips'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}