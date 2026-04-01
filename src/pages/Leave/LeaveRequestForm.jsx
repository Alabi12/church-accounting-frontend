// src/pages/Leave/LeaveRequestForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, CalendarIcon, UserIcon, DocumentTextIcon, BriefcaseIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
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
    admin_comments: '',
  });

  const [daysRequested, setDaysRequested] = useState(0);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch employees for dropdown
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: () => payrollService.getEmployees({ status: 'active' }),
  });

  // Fetch leave types
  const { data: leaveTypesData } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => leaveService.getLeaveTypes(),
  });

  // Fetch leave balance when employee and leave type are selected
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['leaveBalance', formData.employee_id, formData.leave_type, new Date().getFullYear()],
    queryFn: () => leaveService.getLeaveBalances({ 
      employee_id: formData.employee_id,
      leave_type: formData.leave_type,
      year: new Date().getFullYear()
    }),
    enabled: !!formData.employee_id && !!formData.leave_type,
  });

  useEffect(() => {
    if (balanceData?.balances && balanceData.balances.length > 0) {
      setLeaveBalance(balanceData.balances[0]);
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

  // Get selected employee details
  useEffect(() => {
    if (formData.employee_id && employeesData?.employees) {
      const employee = employeesData.employees.find(e => e.id === parseInt(formData.employee_id));
      setSelectedEmployee(employee);
    } else {
      setSelectedEmployee(null);
    }
  }, [formData.employee_id, employeesData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: leaveService.createLeaveRequest,
    onSuccess: () => {
      toast.success('Leave request submitted successfully and sent to Pastor for approval');
      navigate('/leave/requests');
    },
    onError: (error) => {
      console.error('Error creating leave request:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit leave request';
      toast.error(errorMessage);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setFormData(prev => ({ ...prev, employee_id: employeeId }));
    // Reset leave balance when employee changes
    setLeaveBalance(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
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

    // Check leave balance if it's a paid leave
    const selectedLeaveType = leaveTypesData?.leave_types?.find(lt => lt.code === formData.leave_type);
    if (selectedLeaveType?.is_paid && leaveBalance && leaveBalance.remaining < daysRequested) {
      toast.error(`Insufficient leave balance. Available: ${leaveBalance.remaining} days`);
      return;
    }

    const submitData = {
      employee_id: parseInt(formData.employee_id),
      leave_type: formData.leave_type,
      start_date: `${formData.start_date}T00:00:00Z`,
      end_date: `${formData.end_date}T00:00:00Z`,
      reason: formData.reason || '',
      admin_comments: formData.admin_comments || ''
    };

    createMutation.mutate(submitData);
  };

  const getLeaveTypeLabel = (code) => {
    const types = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      bereavement: 'Bereavement Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      study: 'Study Leave',
      unpaid: 'Unpaid Leave'
    };
    return types[code] || code;
  };

  if (employeesLoading) return <LoadingSpinner fullScreen />;
  if (employeesError) return <ErrorAlert message="Failed to load employees" />;

  const employees = employeesData?.employees || [];
  const leaveTypes = leaveTypesData?.leave_types || [
    { code: 'annual', name: 'Annual Leave', is_paid: true, default_days: 20 },
    { code: 'sick', name: 'Sick Leave', is_paid: true, default_days: 15 },
    { code: 'bereavement', name: 'Bereavement Leave', is_paid: true, default_days: 5 },
    { code: 'maternity', name: 'Maternity Leave', is_paid: true, default_days: 90 },
    { code: 'paternity', name: 'Paternity Leave', is_paid: true, default_days: 5 },
    { code: 'study', name: 'Study Leave', is_paid: false, default_days: 10 },
    { code: 'unpaid', name: 'Unpaid Leave', is_paid: false, default_days: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/leave/requests')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">New Leave Request</h1>
            <p className="text-sm text-gray-500 mt-1">Create a leave request from printed form (Admin/HR only)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Leave Request Details</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleEmployeeChange}
                    required
                    className="block w-full pl-10 rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_number}) - {emp.position}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedEmployee && (
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <BriefcaseIcon className="h-3 w-3 mr-1" />
                      {selectedEmployee.position}
                    </span>
                    <span className="flex items-center">
                      <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                      {selectedEmployee.department || 'N/A'}
                    </span>
                    <span className="flex items-center">
                      <UserIcon className="h-3 w-3 mr-1" />
                      Employee ID: {selectedEmployee.employee_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  {leaveTypes.map(type => (
                    <option key={type.code} value={type.code}>
                      {getLeaveTypeLabel(type.code)} {type.is_paid ? `(Paid - ${type.default_days} days)` : '(Unpaid)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Leave Balance Display */}
              {balanceLoading && formData.employee_id && formData.leave_type && (
                <div className="bg-gray-50 p-3 rounded-lg animate-pulse">
                  <p className="text-sm text-gray-500">Loading leave balance...</p>
                </div>
              )}

              {leaveBalance && (
                <div className={`p-3 rounded-lg ${
                  leaveBalance.remaining >= daysRequested 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Leave Balance</p>
                      <p className="text-2xl font-bold text-[rgb(31,178,86)]">{leaveBalance.remaining} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total: {leaveBalance.annual_entitlement} days</p>
                      <p className="text-xs text-red-500">Used: {leaveBalance.used} days</p>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (leaveBalance.used / leaveBalance.annual_entitlement) > 0.9 ? 'bg-red-500' : 'bg-[rgb(31,178,86)]'
                      }`}
                      style={{ width: `${(leaveBalance.used / leaveBalance.annual_entitlement) * 100}%` }}
                    />
                  </div>
                  {daysRequested > 0 && leaveBalance.remaining < daysRequested && (
                    <p className="text-xs text-red-600 mt-2">
                      Warning: You are requesting {daysRequested} days but only {leaveBalance.remaining} days available.
                    </p>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      min={formData.start_date}
                      className="block w-full pl-10 rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Days Display */}
              {daysRequested > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Days Requested:</span> {daysRequested} day(s)
                  </p>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Leave
                </label>
                <div className="relative">
                  <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="reason"
                    rows="3"
                    value={formData.reason}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                    placeholder="Please provide a reason for the leave request"
                  />
                </div>
              </div>

              {/* Admin Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Comments (Internal)
                </label>
                <textarea
                  name="admin_comments"
                  rows="2"
                  value={formData.admin_comments}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  placeholder="Optional internal notes for the pastor"
                />
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
    </div>
  );
}

export default LeaveRequestForm;