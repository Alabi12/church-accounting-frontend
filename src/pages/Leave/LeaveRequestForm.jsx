// src/pages/Leave/LeaveRequestForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { leaveService } from '../../services/leaveService';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import toast from 'react-hot-toast';
import { differenceInDays } from 'date-fns';

function LeaveRequestForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [daysRequested, setDaysRequested] = useState(0);
  const [leaveBalance, setLeaveBalance] = useState(null);

  // Fetch employees for dropdown
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => payrollService.getEmployees({ status: 'active' }),
  });

  // Fetch leave balance when employee and leave type are selected
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['leaveBalance', formData.employee_id, formData.leave_type, new Date().getFullYear()],
    queryFn: () => leaveService.getLeaveBalances({ 
      employee_id: formData.employee_id,
      leave_type: formData.leave_type,
      year: new Date().getFullYear()
    }),
    enabled: !!formData.employee_id && !!formData.leave_type,
  });

  useEffect(() => {
    if (balanceData?.data?.balances?.[0]) {
      setLeaveBalance(balanceData.data.balances[0]);
    } else {
      setLeaveBalance(null);
    }
  }, [balanceData]);

  // Calculate days when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = differenceInDays(end, start) + 1;
      setDaysRequested(days > 0 ? days : 0);
    } else {
      setDaysRequested(0);
    }
  }, [formData.start_date, formData.end_date]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: leaveService.createLeaveRequest,
    onSuccess: () => {
      toast.success('Leave request submitted successfully');
      navigate('/leave/requests');
    },
    onError: (error) => {
      toast.error('Failed to submit leave request');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.employee_id) {
      toast.error('Please select an employee');
      return;
    }
    if (!formData.leave_type) {
      toast.error('Please select leave type');
      return;
    }
    if (!formData.start_date) {
      toast.error('Please select start date');
      return;
    }
    if (!formData.end_date) {
      toast.error('Please select end date');
      return;
    }
    if (daysRequested <= 0) {
      toast.error('End date must be after start date');
      return;
    }

    // Check leave balance
    if (leaveBalance && leaveBalance.remaining < daysRequested) {
      toast.error(`Insufficient leave balance. Available: ${leaveBalance.remaining} days`);
      return;
    }

    createMutation.mutate({
      ...formData,
      days_requested: daysRequested,
    });
  };

  if (employeesLoading) return <LoadingSpinner fullScreen />;

  const employees = employeesData?.data?.employees || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/leave/requests')}
          className="mr-4 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          New Leave Request
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Employee */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.employee_code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Type */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="bereavement">Bereavement Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="study">Study Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              {/* Leave Balance Display */}
              {leaveBalance && (
                <div className="sm:col-span-6">
                  <div className={`p-3 rounded-lg ${
                    leaveBalance.remaining >= daysRequested 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="text-sm">
                      <span className="font-medium">Leave Balance:</span>{' '}
                      {leaveBalance.remaining} days remaining of {leaveBalance.annual_entitlement} days
                    </p>
                  </div>
                </div>
              )}

              {/* Start Date */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                    min={formData.start_date}
                    className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>

              {/* Days Display */}
              {daysRequested > 0 && (
                <div className="sm:col-span-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Days Requested:</span> {daysRequested} day(s)
                    </p>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  name="reason"
                  rows="4"
                  value={formData.reason}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  placeholder="Please provide a reason for your leave request"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/leave/requests')}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LeaveRequestForm;