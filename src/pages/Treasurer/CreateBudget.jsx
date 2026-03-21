import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { budgetService } from '../../services/budgets';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().required('Budget name is required'),
  department: yup.string().required('Department is required'),
  fiscalYear: yup.number()
    .required('Fiscal year is required')
    .min(2000, 'Invalid fiscal year')
    .max(2100, 'Invalid fiscal year'),
  amount: yup.number()
    .required('Budget amount is required')
    .positive('Amount must be positive')
    .min(1, 'Amount must be at least 1'),
  description: yup.string(),
  justification: yup.string(),
  priority: yup.string().oneOf(['high', 'medium', 'low']).default('medium'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
});

const CreateBudget = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitForApproval, setSubmitForApproval] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fiscalYear: new Date().getFullYear(),
      priority: 'medium',
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    },
  });

  const watchAmount = watch('amount');

  const departments = [
    'Worship Ministry',
    'Youth Ministry',
    'Children Ministry',
    'Outreach',
    'Missions',
    'Facilities',
    'Administration',
    'Education',
    'Pastoral',
    'Technology',
    'Events',
    'Media',
  ];

  const priorities = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

// In CreateBudget.jsx - find this section
const onSubmit = async (data) => {
  try {
    const response = await budgetService.createBudget(data);
    toast.success('Budget created successfully');
    navigate('/budgets'); // or navigate('/budgets/list') or similar
  } catch (error) {
    toast.error('Failed to create budget');
  }
};

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/treasurer/budgets')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Budgets
          </button>
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Create New Budget</h2>
                <p className="text-sm text-green-100 mt-0.5">
                  Create a departmental budget for approval
                </p>
              </div>
            </div>
          </div>

          {/* Approval Info Banner */}
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <InformationCircleIcon className="h-5 w-5" />
              <span className="font-medium">Approval Workflow:</span>
              <span>Budgets will be reviewed by the pastor after submission</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Budget Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g., Worship Ministry Budget 2026"
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    transition-all duration-200
                    ${errors.name
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                    }
                  `}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('department')}
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl bg-white
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    transition-all duration-200
                    ${errors.department
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                    }
                  `}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>
            </div>

            {/* Fiscal Year and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Fiscal Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('fiscalYear')}
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    transition-all duration-200
                    ${errors.fiscalYear
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                    }
                  `}
                />
                {errors.fiscalYear && (
                  <p className="text-sm text-red-600">{errors.fiscalYear.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  {...register('priority')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {/* <span className="absolute left-4 top-3 text-gray-500"></span> */}
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount')}
                    className={`
                      w-full pl-8 pr-4 py-3 border-2 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      transition-all duration-200
                      ${errors.amount
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                    }
                  `}
                />
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount.message}</p>
                )}
                {watchAmount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {formatCurrency(watchAmount)}
                  </p>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    transition-all duration-200
                    ${errors.startDate
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                    }
                  `}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    transition-all duration-200
                    ${errors.endDate
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                    }
                  `}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows="3"
                placeholder="Brief description of the budget purpose..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
              />
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Justification
              </label>
              <textarea
                {...register('justification')}
                rows="3"
                placeholder="Explain why this budget is needed..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
              />
            </div>

            {/* Submit Options */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={submitForApproval}
                  onChange={(e) => setSubmitForApproval(e.target.checked)}
                  className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Submit for pastor approval</span>
                  <p className="text-xs text-gray-500">
                    If checked, this budget will be sent to the pastor for review after creation.
                  </p>
                </div>
              </label>
            </div>

            {/* Form Footer */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/treasurer/budgets')}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] transition-all duration-200"
              >
                Cancel
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] hover:from-[rgb(25,142,69)] hover:to-[rgb(31,178,86)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Creating...
                  </span>
                ) : (
                  'Create Budget'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Quick Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Budget Creation Tips</h4>
              <ul className="mt-2 text-xs text-blue-600 space-y-1 list-disc list-inside">
                <li>Be specific with budget line items for easier approval</li>
                <li>Provide clear justification for major expenses</li>
                <li>Budgets will be reviewed by the pastor before activation</li>
                <li>You can save as draft and submit later</li>
                <li>Once approved, budgets become active for the fiscal year</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreateBudget;