// src/pages/Payroll/GeneratePayslips.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function GeneratePayslips() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payrollRuns', 'posted'],
    queryFn: () => payrollService.getPayrollRuns({ status: 'posted' }),
  });

  const generateMutation = useMutation({
    mutationFn: (runId) => payrollService.generatePayslips(runId),
    onSuccess: (response) => {
      toast.success(`Generated ${response.data.generated?.length || 0} payslips`);
      queryClient.invalidateQueries(['payslips']);
      navigate('/payroll/payslips');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate payslips');
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const postedRuns = data?.data?.runs || [];

  const handleGenerate = () => {
    if (selectedRunId) {
      generateMutation.mutate(selectedRunId);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Generate Payslips</h1>
        <p className="mt-2 text-sm text-gray-500">
          Generate PDF payslips for a completed payroll run
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {postedRuns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No completed payroll runs available for payslip generation</p>
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
                  {postedRuns.map(run => (
                    <option key={run.id} value={run.id}>
                      {run.run_number} - {format(new Date(run.period_start), 'dd MMM yyyy')} to {format(new Date(run.period_end), 'dd MMM yyyy')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => navigate('/payroll/runs')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedRunId || generateMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate Payslips'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}