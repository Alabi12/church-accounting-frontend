// src/pages/Payroll/PayrollDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format } from 'date-fns';

function PayrollDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Fetch payroll dashboard data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payrollDashboard'],
    queryFn: payrollService.getPayrollDashboard,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payroll dashboard" />;

  const dashboardData = data?.data || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return format(new Date(dateString), 'dd MMM yyyy');
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of payroll statistics and recent activities.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate('/payroll/process')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            <CurrencyDollarIcon className="-ml-1 mr-2 h-5 w-5" />
            Process Payroll
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Employees
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.total_employees || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <button
                onClick={() => navigate('/payroll/employees')}
                className="font-medium text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]"
              >
                View all employees
              </button>
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
                    Current Month Payroll
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(dashboardData.current_month_payroll?.total_net)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm text-gray-500">
              {dashboardData.current_month_payroll?.employee_count || 0} employees
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Next Payment
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatDate(dashboardData.next_payroll?.payment_date)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                getStatusColor(dashboardData.next_payroll?.status)
              }`}>
                {dashboardData.next_payroll?.status || 'No pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    YTD Payroll
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(dashboardData.monthly_totals?.reduce((sum, m) => sum + m.total, 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm text-gray-500">
              Year to date total
            </div>
          </div>
        </div>
      </div>

      {/* Employee Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Employee Distribution
              </h3>
              <div className="space-y-4">
                {dashboardData.employees_by_type?.map((type) => (
                  <div key={type.type}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{type.type.replace('-', ' ')}</span>
                      <span className="font-medium text-gray-900">{type.count}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[rgb(31,178,86)] h-2 rounded-full"
                        style={{
                          width: `${(type.count / dashboardData.total_employees) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
                {(!dashboardData.employees_by_type || dashboardData.employees_by_type.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">No employee data available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Payroll Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Monthly Payroll Trend
              </h3>
              <div className="h-64">
                <div className="flex items-end h-48 space-x-2">
                  {dashboardData.monthly_totals?.map((month, index) => {
                    const maxValue = Math.max(...dashboardData.monthly_totals.map(m => m.total));
                    const height = maxValue > 0 ? (month.total / maxValue) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-[rgb(31,178,86)] rounded-t"
                          style={{ height: `${height}%` }}
                        />
                        <div className="mt-2 text-xs text-gray-600">{month.month}</div>
                      </div>
                    );
                  })}
                </div>
                {(!dashboardData.monthly_totals || dashboardData.monthly_totals.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-12">No monthly data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Month Payroll Details */}
      {dashboardData.current_month_payroll && (
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Current Month Payroll Details
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">Gross Pay</p>
                <p className="text-lg font-medium text-gray-900">
                  {formatCurrency(dashboardData.current_month_payroll.total_gross)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Deductions</p>
                <p className="text-lg font-medium text-red-600">
                  {formatCurrency(dashboardData.current_month_payroll.total_deductions)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Net Pay</p>
                <p className="text-lg font-medium text-[rgb(31,178,86)]">
                  {formatCurrency(dashboardData.current_month_payroll.total_net)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employees</p>
                <p className="text-lg font-medium text-gray-900">
                  {dashboardData.current_month_payroll.employee_count}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => navigate(`/payroll/runs/${dashboardData.current_month_payroll.id}`)}
                className="inline-flex items-center text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Payroll Runs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Recent Payroll Runs
          </h3>
          
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Run Number
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Period
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Net Pay
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {dashboardData.recent_runs?.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {run.run_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {format(new Date(run.period_start), 'dd MMM')} - {format(new Date(run.period_end), 'dd MMM yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-[rgb(31,178,86)]">
                      {formatCurrency(run.total_net)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(run.status)}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/payroll/runs/${run.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {(!dashboardData.recent_runs || dashboardData.recent_runs.length === 0) && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500">
                      No payroll runs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {dashboardData.recent_runs && dashboardData.recent_runs.length > 0 && (
            <div className="mt-4 text-right">
              <button
                onClick={() => navigate('/payroll/runs')}
                className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]"
              >
                View all payroll runs →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayrollDashboard;