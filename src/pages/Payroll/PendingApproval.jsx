// src/pages/Payroll/PendingApproval.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

export default function PendingApproval() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['payrollRuns', 'pending'],
    queryFn: () => payrollService.getPayrollRuns({ status: 'calculated' })
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Failed to load pending approvals</div>;

  const pendingRuns = data?.data?.runs || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Pending Approvals</h1>
        <p className="mt-2 text-sm text-gray-500">Step 3: Treasurer reviews and approves payroll runs</p>
      </div>

      {pendingRuns.length === 0 ? (
        <div className="bg-white shadow sm:rounded-lg p-8 text-center">
          <p className="text-gray-500">No pending payroll runs awaiting approval</p>
        </div>
      ) : (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Gross</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Net</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initiated By</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingRuns.map(run => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{run.run_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(run.period_start), 'dd MMM yyyy')} - {format(new Date(run.period_end), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(run.total_gross)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">{formatCurrency(run.total_net)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{run.initiated_by_name || 'Admin'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/payroll/review/${run.id}`)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => navigate(`/payroll/approve/${run.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}