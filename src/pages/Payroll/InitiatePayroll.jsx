// src/pages/Payroll/InitiatePayroll.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { payrollService } from '../../services/payrollService';
import { format } from 'date-fns';

export default function InitiatePayroll() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      period_start: format(new Date(), 'yyyy-MM-01'),
      period_end: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
      payment_date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 25), 'yyyy-MM-dd')
    }
  });

  const initiateMutation = useMutation({
    mutationFn: (data) => payrollService.initiatePayrollRun(data),
    onSuccess: (response) => {
      toast.success(`Payroll run ${response.data.run.run_number} initiated successfully`);
      queryClient.invalidateQueries(['payrollRuns']);
      navigate(`/payroll/runs/${response.data.run.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to initiate payroll');
    }
  });

  const onSubmit = (data) => {
    setIsSubmitting(true);
    initiateMutation.mutate(data);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Initiate Payroll Run</h1>
        <p className="mt-2 text-sm text-gray-500">Step 1: Admin initiates a new payroll period</p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Period Start</label>
                <input
                  type="date"
                  {...register('period_start', { required: 'Period start is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
                {errors.period_start && <p className="mt-1 text-sm text-red-600">{errors.period_start.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Period End</label>
                <input
                  type="date"
                  {...register('period_end', { required: 'Period end is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
                {errors.period_end && <p className="mt-1 text-sm text-red-600">{errors.period_end.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                <input
                  type="date"
                  {...register('payment_date', { required: 'Payment date is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
                {errors.payment_date && <p className="mt-1 text-sm text-red-600">{errors.payment_date.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/payroll/runs')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Initiating...' : 'Initiate Payroll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}