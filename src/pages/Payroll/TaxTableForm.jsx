// src/pages/Payroll/TaxTableForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import toast from 'react-hot-toast';

function TaxTableForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    tax_year: new Date().getFullYear(),
    bracket_from: '',
    bracket_to: '',
    rate: '',
    ss_employee_rate: 5.5,
    ss_employer_rate: 13.0,
    hi_employee_rate: 2.5,
    hi_employer_rate: 2.5,
  });

  // Fetch tax table if in edit mode
  const { data, isLoading, error } = useQuery({
    queryKey: ['taxTable', id],
    queryFn: () => payrollService.getTaxTable?.(id) || Promise.resolve({ data: null }),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (data?.data) {
      const table = data.data;
      setFormData({
        tax_year: table.tax_year || new Date().getFullYear(),
        bracket_from: table.bracket_from || '',
        bracket_to: table.bracket_to || '',
        rate: table.rate || '',
        ss_employee_rate: table.ss_employee_rate || 5.5,
        ss_employer_rate: table.ss_employer_rate || 13.0,
        hi_employee_rate: table.hi_employee_rate || 2.5,
        hi_employer_rate: table.hi_employer_rate || 2.5,
      });
    }
  }, [data]);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    yearOptions.push(i);
  }

  // Create mutation
  const createMutation = useMutation({
    mutationFn: payrollService.createTaxTable,
    onSuccess: () => {
      toast.success('Tax bracket created successfully');
      navigate('/payroll/tax-tables');
    },
    onError: (error) => {
      toast.error('Failed to create tax bracket');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => payrollService.updateTaxTable(id, data),
    onSuccess: () => {
      toast.success('Tax bracket updated successfully');
      navigate('/payroll/tax-tables');
    },
    onError: (error) => {
      toast.error('Failed to update tax bracket');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.tax_year) {
      toast.error('Tax year is required');
      return;
    }
    if (!formData.bracket_from) {
      toast.error('Lower limit is required');
      return;
    }
    if (!formData.rate) {
      toast.error('Tax rate is required');
      return;
    }

    const submitData = {
      ...formData,
      bracket_from: parseFloat(formData.bracket_from),
      bracket_to: formData.bracket_to ? parseFloat(formData.bracket_to) : null,
      rate: parseFloat(formData.rate),
      ss_employee_rate: parseFloat(formData.ss_employee_rate),
      ss_employer_rate: parseFloat(formData.ss_employer_rate),
      hi_employee_rate: parseFloat(formData.hi_employee_rate),
      hi_employer_rate: parseFloat(formData.hi_employer_rate),
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isEditMode && isLoading) return <LoadingSpinner />;
  if (isEditMode && error) return <ErrorAlert message="Failed to load tax bracket" />;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/payroll/tax-tables')}
          className="mr-4 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Tax Bracket' : 'New Tax Bracket'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Tax Bracket Details
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Tax Year */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tax Year <span className="text-red-500">*</span>
                </label>
                <select
                  name="tax_year"
                  value={formData.tax_year}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Bracket From */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Lower Limit (GHS) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">GHS</span>
                  </div>
                  <input
                    type="number"
                    name="bracket_from"
                    value={formData.bracket_from}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="block w-full rounded-md border-0 py-2 pl-12 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Bracket To */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upper Limit (GHS)
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">GHS</span>
                  </div>
                  <input
                    type="number"
                    name="bracket_to"
                    value={formData.bracket_to}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="block w-full rounded-md border-0 py-2 pl-12 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                    placeholder="Leave empty for 'and above'"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for the highest bracket
                </p>
              </div>

              {/* Tax Rate */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Tax Rate (%) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    className="block w-full rounded-md border-0 py-2 px-3 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SSNIT Rates */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              SSNIT Contribution Rates
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Employee Rate (%)
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    name="ss_employee_rate"
                    value={formData.ss_employee_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="block w-full rounded-md border-0 py-2 px-3 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Employer Rate (%)
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    name="ss_employer_rate"
                    value={formData.ss_employer_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="block w-full rounded-md border-0 py-2 px-3 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Insurance Rates (Optional) */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Health Insurance Rates (Optional)
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Employee Rate (%)
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    name="hi_employee_rate"
                    value={formData.hi_employee_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="block w-full rounded-md border-0 py-2 px-3 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Employer Rate (%)
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    name="hi_employer_rate"
                    value={formData.hi_employer_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="block w-full rounded-md border-0 py-2 px-3 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/payroll/tax-tables')}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Tax Bracket' : 'Create Tax Bracket')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaxTableForm;