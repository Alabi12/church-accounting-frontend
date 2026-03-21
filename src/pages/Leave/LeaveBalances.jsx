// src/pages/Leave/LeaveBalances.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  FunnelIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { leaveService } from '../../services/leaveService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

function LeaveBalances() {
  const queryClient = useQueryClient();
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);
  const [initDialog, setInitDialog] = useState({ isOpen: false });

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    yearOptions.push(i);
  }

  // Fetch leave balances
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaveBalances', yearFilter],
    queryFn: () => leaveService.getLeaveBalances({ year: yearFilter }),
  });

  // Initialize balances mutation
  const initMutation = useMutation({
    mutationFn: () => leaveService.initializeLeaveBalances({ year: yearFilter }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveBalances']);
      toast.success('Leave balances initialized successfully');
      setInitDialog({ isOpen: false });
    },
    onError: (error) => {
      toast.error('Failed to initialize leave balances');
    },
  });

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-100 text-blue-800';
      case 'sick':
        return 'bg-red-100 text-red-800';
      case 'bereavement':
        return 'bg-gray-100 text-gray-800';
      case 'maternity':
        return 'bg-purple-100 text-purple-800';
      case 'paternity':
        return 'bg-indigo-100 text-indigo-800';
      case 'study':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorAlert message="Failed to load leave balances" />;

  const balances = data?.data?.balances || [];
  
  // Group balances by employee
  const balancesByEmployee = balances.reduce((acc, balance) => {
    if (!acc[balance.employee_id]) {
      acc[balance.employee_id] = {
        employee_id: balance.employee_id,
        employee_name: balance.employee_name || `Employee ${balance.employee_id}`,
        balances: []
      };
    }
    acc[balance.employee_id].balances.push(balance);
    return acc;
  }, {});

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Leave Balances</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage employee leave balances by year.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setInitDialog({ isOpen: true })}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" />
            Initialize Year {yearFilter}
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
                  Year
                </label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value))}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Balances Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Employee
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Leave Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Entitlement
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Used
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Remaining
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Object.values(balancesByEmployee).map((employee) => (
                    <React.Fragment key={employee.employee_id}>
                      {employee.balances.map((balance, index) => (
                        <tr key={balance.id} className="hover:bg-gray-50">
                          {index === 0 && (
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6" rowSpan={employee.balances.length}>
                              <div className="font-medium text-gray-900">{employee.employee_name}</div>
                              <div className="text-gray-500">ID: {employee.employee_id}</div>
                            </td>
                          )}
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getLeaveTypeColor(balance.leave_type)}`}>
                              {balance.leave_type}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-center font-medium">
                            {balance.annual_entitlement} days
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-red-600">
                            {balance.used} days
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-center font-bold text-[rgb(31,178,86)]">
                            {balance.remaining} days
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                            <div className="flex items-center justify-center">
                              <span className="mr-2 text-xs text-gray-600">
                                {Math.round((balance.used / balance.annual_entitlement) * 100)}%
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[rgb(31,178,86)] h-2 rounded-full"
                                  style={{
                                    width: `${(balance.used / balance.annual_entitlement) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {Object.keys(balancesByEmployee).length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-500">
                        No leave balances found for {yearFilter}. Click "Initialize" to create balances.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Initialize Confirmation Dialog */}
      <ConfirmDialog
        isOpen={initDialog.isOpen}
        onClose={() => setInitDialog({ isOpen: false })}
        onConfirm={() => initMutation.mutate()}
        title="Initialize Leave Balances"
        message={`This will create default leave balances for all active employees for the year ${yearFilter}. Continue?`}
        confirmText="Initialize"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
}

export default LeaveBalances;