// pages/Treasurer/BudgetForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const BudgetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    fiscalYear: new Date().getFullYear(),
    amount: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM',
    justification: ''
  });

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchBudget();
    }
  }, [id]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const data = await treasurerService.getBudget(id);
      
      console.log('📦 Budget data received:', data);
      
      // Handle the actual field names from your backend
      setFormData({
        name: data.name || '',
        description: data.description || '',
        department: data.department || '',
        fiscalYear: data.fiscalYear || new Date().getFullYear(),
        amount: data.amount || '',
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        endDate: data.endDate ? data.endDate.split('T')[0] : '',
        priority: data.priority || 'MEDIUM',
        justification: data.justification || ''
      });
    } catch (error) {
      console.error('Error fetching budget:', error);
      toast.error('Failed to load budget');
      navigate('/treasurer/budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Budget name is required');
      return false;
    }
    if (!formData.department) {
      toast.error('Department is required');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Valid amount is required');
      return false;
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      toast.error('Start date cannot be after end date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const budgetData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        department: formData.department,
        fiscalYear: parseInt(formData.fiscalYear),  // Note: camelCase for backend
        amount: parseFloat(formData.amount),
        priority: formData.priority,
        justification: formData.justification.trim()
      };
      
      // Add optional dates if provided (use camelCase as your backend expects)
      if (formData.startDate) {
        budgetData.startDate = formData.startDate;
      }
      if (formData.endDate) {
        budgetData.endDate = formData.endDate;
      }

      console.log('📤 Submitting budget data:', budgetData);

      if (isEditMode) {
        await treasurerService.updateBudget(id, budgetData);
        toast.success('Budget updated successfully');
      } else {
        await treasurerService.createBudget(budgetData);
        toast.success('Budget created successfully');
      }
      
      navigate('/treasurer/budgets');
    } catch (error) {
      console.error('Error saving budget:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save budget. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fiscalYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  const departments = [
    { value: 'Youth Ministry', label: 'Youth Ministry' },
    { value: "Children's Ministry", label: "Children's Ministry" },
    { value: 'Worship Ministry', label: 'Worship Ministry' },
    { value: 'Missions', label: 'Missions' },
    { value: 'Education', label: 'Education' },
    { value: 'Facilities', label: 'Facilities' },
    { value: 'Administration', label: 'Administration' },
    { value: 'Outreach', label: 'Outreach' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Operations', label: 'Operations' }
  ];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/treasurer/budgets')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 group transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Budgets
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Budget' : 'Create New Budget'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditMode 
              ? 'Update budget details and resubmit for approval' 
              : 'Define a new budget for a department or ministry'}
          </p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent transition-all"
                    placeholder="e.g., Youth Ministry 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent transition-all"
                    placeholder="Brief description of the budget purpose and expected outcomes"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent appearance-none"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority Level
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                    >
                      <option value="LOW">Low Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="HIGH">High Priority</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiscal Year
                  </label>
                  <select
                    name="fiscalYear"
                    value={formData.fiscalYear}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                  >
                    {fiscalYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (GHS) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleNumberChange}
                      required
                      min="0"
                      step="0.01"
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Justification */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Justification</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provide justification for this budget request
                </label>
                <textarea
                  name="justification"
                  value={formData.justification}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent transition-all"
                  placeholder="Explain why this budget is needed, how it aligns with church goals, and the expected impact..."
                />
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Budget Workflow:</p>
                  <ul className="space-y-1">
                    <li>• Budgets start as <span className="font-semibold">DRAFT</span> - you can edit freely</li>
                    <li>• When ready, <span className="font-semibold">submit for approval</span> to the pastor</li>
                    <li>• Pastor will review and <span className="font-semibold">approve or reject</span> the budget</li>
                    <li>• Approved budgets become active for the fiscal year</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/treasurer/budgets')}
              className="px-5 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[rgb(31,178,86)] text-white rounded-xl text-sm font-medium hover:bg-[rgb(27,158,76)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  {isEditMode ? 'Update Budget' : 'Create Budget'}
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default BudgetForm;