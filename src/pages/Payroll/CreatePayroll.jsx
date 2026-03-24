// src/pages/Payroll/CreatePayroll.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CreatePayroll() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState('');
  const [calculationPeriod, setCalculationPeriod] = useState({
    period_start: '',
    period_end: ''
  });

  // Fetch initiated payroll runs
  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['payrollRuns', 'initiated'],
    queryFn: () => payrollService.getPayrollRuns({ status: 'initiated' })
  });

  const calculateMutation = useMutation({
    mutationFn: (data) => payrollService.calculatePayroll(data),
    onSuccess: (response) => {
      toast.success('Payroll calculated successfully');
      if (selectedRunId) {
        navigate(`/payroll/runs/${selectedRunId}`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to calculate payroll');
    }
  });

  const handleCalculate = () => {
    calculateMutation.mutate(calculationPeriod);
  };

  const initiatedRuns = runsData?.data?.runs?.filter(run => run.status === 'initiated') || [];

  if (runsLoading) return <LoadingSpinner />;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create Payroll</h1>
        <p className="mt-2 text-sm text-gray-500">Step 2: Accountant calculates payroll for initiated runs</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calculate New Payroll */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Calculate New Payroll</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Period Start</label>
                <input
                  type="date"
                  value={calculationPeriod.period_start}
                  onChange={(e) => setCalculationPeriod({ ...calculationPeriod, period_start: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Period End</label>
                <input
                  type="date"
                  value={calculationPeriod.period_end}
                  onChange={(e) => setCalculationPeriod({ ...calculationPeriod, period_end: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <button
                onClick={handleCalculate}
                disabled={!calculationPeriod.period_start || !calculationPeriod.period_end || calculateMutation.isPending}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {calculateMutation.isPending ? 'Calculating...' : 'Calculate Payroll'}
              </button>
            </div>
          </div>
        </div>

        {/* Continue Existing Run */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Continue Existing Run</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Select Payroll Run</label>
              <select
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">Select a run...</option>
                {initiatedRuns.map(run => (
                  <option key={run.id} value={run.id}>
                    {run.run_number} - {run.period_start} to {run.period_end}
                  </option>
                ))}
              </select>
              <button
                onClick={() => selectedRunId && navigate(`/payroll/runs/${selectedRunId}`)}
                disabled={!selectedRunId}
                className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}