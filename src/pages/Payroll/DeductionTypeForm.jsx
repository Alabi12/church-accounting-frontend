// src/pages/Payroll/DeductionTypeForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import toast from 'react-hot-toast';

function DeductionTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    calculation_type: 'percentage',
    rate: '',
    account_id: '',
    is_statutory: false,
    is_active: true,
  });

  // Fetch deduction type if in edit mode
  const { data, isLoading, error } = useQuery({
    queryKey: ['deductionType', id],
    queryFn: () => payrollService.getDeductionType?.(id) || Promise.resolve({ data: null }),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (data?.data) {
      const deduction = data.data;
      setFormData({
        name: deduction.name || '',
        description: deduction.description || '',
        calculation_type: deduction.calculation_type || 'percentage',
        rate: deduction.rate || '',
        account_id: deduction.account_id || '',
        is_statutory: deduction.is_statutory || false,
        is_active: deduction.is_active ?? true,
      });
    }
  }, [data]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: payrollService.createDeductionType,
    onSuccess: () => {
      toast.success('Deduction type created successfully');
      navigate('/payroll/deduction-types');
    },
    onError: (error) => {
      toast.error('Failed to create deduction type');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => payrollService.updateDeductionType(id, data),
    onSuccess: () => {
      toast.success('Deduction type updated successfully');
      navigate('/payroll/deduction-types');
    },
    onError: (error) => {
      toast.error('Failed to update deduction type');
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    if (!formData.calculation_type) {
      toast.error('Calculation type is required');
      return;
    }
    if (!formData.rate) {
      toast.error('Rate/Amount is required');
      return;
    }

    const submitData = {
      ...formData,
      rate: parseFloat(formData.rate),
    };

    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isEditMode && isLoading) return <LoadingSpinner />;
  if (isEditMode && error) return <ErrorAlert message="Failed to load deduction type" />;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/payroll/deduction-types')}
          className="mr-4 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Deduction Type' : 'New Deduction Type'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Name */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  placeholder="e.g., SSNIT, PAYE, Provident Fund"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  placeholder="Brief description of the deduction type"
                />
              </div>

              {/* Calculation Type */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Calculation Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="calculation_type"
                  value={formData.calculation_type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (GHS)</option>
                </select>
              </div>

              {/* Rate/Amount */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  {formData.calculation_type === 'percentage' ? 'Rate (%)' : 'Amount (GHS)'} <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  {formData.calculation_type === 'fixed' && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">GHS</span>
                    </div>
                  )}
                  <input
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    className={`block w-full rounded-md border-0 py-2 ${
                      formData.calculation_type === 'fixed' ? 'pl-12' : 'pl-3'
                    } pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm`}
                    placeholder={formData.calculation_type === 'percentage' ? '5.5' : '100.00'}
                  />
                  {formData.calculation_type === 'percentage' && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Account */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Account (Optional)
                </label>
                <select
                  name="account_id"
                  value={formData.account_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="">Select Account</option>
                  <option value="1">Salary Payable (2100)</option>
                  <option value="2">PAYE Payable (2130)</option>
                  <option value="3">SSNIT Payable (2110)</option>
                  <option value="4">Provident Fund Payable (2120)</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="sm:col-span-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_statutory"
                      id="is_statutory"
                      checked={formData.is_statutory}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)]"
                    />
                    <label htmlFor="is_statutory" className="ml-3 text-sm text-gray-700">
                      Statutory Deduction (e.g., SSNIT, PAYE)
                    </label>
                  </div>

                  {isEditMode && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)]"
                      />
                      <label htmlFor="is_active" className="ml-3 text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/payroll/deduction-types')}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Deduction Type' : 'Create Deduction Type')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DeductionTypeForm;
