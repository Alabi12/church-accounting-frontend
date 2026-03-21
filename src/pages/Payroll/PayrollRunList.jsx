// src/pages/Payroll/PayrollRunList.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format } from 'date-fns';

function PayrollRunList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch payroll runs
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payrollRuns', statusFilter],
    queryFn: () => payrollService.getPayrollRuns({ 
      status: statusFilter !== 'all' ? statusFilter : undefined 
    }),
  });

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <ClockIcon className="h-4 w-4" />;
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'processing':
        return <ArrowPathIcon className="h-4 w-4 animate-spin" />;
      case 'paid':
        return <CurrencyDollarIcon className="h-4 w-4" />;
      case 'posted':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'void':
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

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

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payroll runs" />;

  const runs = data?.data?.runs || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Runs</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage all payroll processing runs.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => navigate('/payroll/process')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            New Payroll Run
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="paid">Paid</option>
                  <option value="posted">Posted</option>
                  <option value="void">Void</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payroll Runs Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Run Number
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Period
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Payment Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Total Gross
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Total Deductions
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Total Net
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Employees
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {run.run_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>{formatDate(run.period_start)}</div>
                        <div className="text-xs text-gray-400">to {formatDate(run.period_end)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(run.payment_date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                        {formatCurrency(run.total_gross)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(run.total_deductions)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-[rgb(31,178,86)]">
                        {formatCurrency(run.total_net)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {run.employee_count || 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(run.status)}`}>
                          {getStatusIcon(run.status)}
                          {run.status}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => navigate(`/payroll/runs/${run.id}`)}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-5 w-5 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {runs.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-12 text-gray-500">
                        No payroll runs found. Click "New Payroll Run" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayrollRunList;