// src/pages/Payroll/EmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import toast from 'react-hot-toast';

function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    national_id: '',
    tax_id: '',
    social_security_number: '',
    department: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    employment_type: 'full-time',
    pay_type: 'salary',
    pay_rate: '',
    pay_frequency: 'monthly',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_branch: '',
    bank_sort_code: '',
    status: 'active',
  });

  // Fetch employee data if in edit mode
  const { data, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => payrollService.getEmployee(id),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (data?.data) {
      const employee = data.data;
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        middle_name: employee.middle_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        postal_code: employee.postal_code || '',
        national_id: employee.national_id || '',
        tax_id: employee.tax_id || '',
        social_security_number: employee.social_security_number || '',
        department: employee.department || '',
        position: employee.position || '',
        hire_date: employee.hire_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        employment_type: employee.employment_type || 'full-time',
        pay_type: employee.pay_type || 'salary',
        pay_rate: employee.pay_rate || '',
        pay_frequency: employee.pay_frequency || 'monthly',
        bank_name: employee.bank_name || '',
        bank_account_name: employee.bank_account_name || '',
        bank_account_number: employee.bank_account_number || '',
        bank_branch: employee.bank_branch || '',
        bank_sort_code: employee.bank_sort_code || '',
        status: employee.status || 'active',
      });
    }
  }, [data]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: payrollService.createEmployee,
    onSuccess: () => {
      toast.success('Employee created successfully');
      navigate('/payroll/employees');
    },
    onError: (error) => {
      toast.error('Failed to create employee');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => payrollService.updateEmployee(id, data),
    onSuccess: () => {
      toast.success('Employee updated successfully');
      navigate('/payroll/employees');
    },
    onError: (error) => {
      toast.error('Failed to update employee');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const required = ['first_name', 'last_name', 'employment_type', 'pay_rate'];
    for (const field of required) {
      if (!formData[field]) {
        toast.error(`${field.replace('_', ' ')} is required`);
        return;
      }
    }

    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isEditMode && isLoading) return <LoadingSpinner />;
  if (isEditMode && error) return <ErrorAlert message="Failed to load employee" />;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/payroll/employees')}
          className="mr-4 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Employee' : 'Add New Employee'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Employment Details
            </h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Hire Date
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contractor">Contractor</option>
                  <option value="casual">Casual</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pay Type
                </label>
                <select
                  name="pay_type"
                  value={formData.pay_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="salary">Salary</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pay Frequency
                </label>
                <select
                  name="pay_frequency"
                  value={formData.pay_frequency}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pay Rate (GHS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pay_rate"
                  value={formData.pay_rate}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Identification */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Identification
            </h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  National ID
                </label>
                <input
                  type="text"
                  name="national_id"
                  value={formData.national_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tax ID
                </label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  SSNIT Number
                </label>
                <input
                  type="text"
                  name="social_security_number"
                  value={formData.social_security_number}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Bank Details
            </h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Account Name
                </label>
                <input
                  type="text"
                  name="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <input
                  type="text"
                  name="bank_branch"
                  value={formData.bank_branch}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Sort Code
                </label>
                <input
                  type="text"
                  name="bank_sort_code"
                  value={formData.bank_sort_code}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/payroll/employees')}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Employee' : 'Create Employee')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmployeeForm;