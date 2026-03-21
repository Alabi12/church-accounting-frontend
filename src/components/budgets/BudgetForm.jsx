import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  TagIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const schema = yup.object({
  name: yup.string().required('Budget name is required'),
  description: yup.string(),
  department: yup.string().required('Department is required'),
  fiscalYear: yup.number().required('Fiscal year is required'),
  amount: yup.number().positive('Amount must be greater than 0').required('Total amount is required'),
  priority: yup.string().oneOf(['high', 'medium', 'low']).default('medium'),
  justification: yup.string(),
  startDate: yup.string().nullable(),
  endDate: yup.string().nullable(),
  categories: yup.array().of(
    yup.object({
      name: yup.string().required('Category name is required'),
      requested: yup.number().positive('Amount must be positive').required('Amount is required'),
      notes: yup.string(),
    })
  ),
});

const departments = [
  'Youth Ministry',
  'Worship Ministry',
  'Facilities',
  'Missions',
  'Outreach',
  'Administration',
  'Education',
  'Pastoral',
  'Technology',
  'Events',
];

const priorityOptions = [
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
];

const BudgetForm = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  isEdit = false,
}) => {
  const [selectedPriority, setSelectedPriority] = useState(initialData?.priority || 'medium');

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      name: '',
      description: '',
      department: '',
      fiscalYear: new Date().getFullYear(),
      amount: '',
      priority: 'medium',
      justification: '',
      startDate: '',
      endDate: '',
      categories: [{ name: '', requested: '', notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  });

  const watchCategories = watch('categories');
  const totalAmount = watchCategories?.reduce(
    (sum, cat) => sum + (parseFloat(cat.requested) || 0),
    0
  );

  // Update total amount when categories change
  useEffect(() => {
    setValue('amount', totalAmount);
  }, [totalAmount, setValue]);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
          Basic Information
        </h3>
        
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Budget Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              className={`
                w-full px-4 py-3 border-2 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-all duration-200
                ${errors.name
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                }
              `}
              placeholder="e.g., Youth Ministry 2026"
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
                w-full px-4 py-3 border-2 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-all duration-200
                ${errors.department
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                }
              `}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.department && (
              <p className="text-sm text-red-600">{errors.department.message}</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Fiscal Year <span className="text-red-500">*</span>
            </label>
            <select
              {...register('fiscalYear')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <ChartBarIcon className="h-4 w-4 inline mr-1" />
              Priority
            </label>
            <div className="flex space-x-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedPriority(option.value);
                    setValue('priority', option.value);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPriority === option.value
                      ? option.color + ' border-2 border-[rgb(31,178,86)]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Total Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500 font-medium">GH₵</span>
              <input
                type="number"
                {...register('amount')}
                disabled
                className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700"
                placeholder="Auto-calculated"
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description')}
            rows={2}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
            placeholder="Brief description of the budget..."
          />
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Justification</label>
          <textarea
            {...register('justification')}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
            placeholder="Explain the need for this budget..."
          />
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              {...register('endDate')}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
            />
          </div>
        </motion.div>
      </div>

      {/* Budget Categories */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <TagIcon className="h-5 w-5 mr-2 text-gray-500" />
            Budget Categories
          </h3>
          <button
            type="button"
            onClick={() => append({ name: '', requested: '', notes: '' })}
            className="inline-flex items-center px-3 py-2 bg-[rgb(31,178,86)] bg-opacity-10 text-[rgb(31,178,86)] rounded-lg hover:bg-opacity-20 transition-colors text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Category
          </button>
        </div>

        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register(`categories.${index}.name`)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  placeholder="e.g., Events, Supplies"
                />
                {errors.categories?.[index]?.name && (
                  <p className="text-xs text-red-600">{errors.categories[index].name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Amount (GHS) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">GH₵</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`categories.${index}.requested`)}
                    className="w-full pl-14 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="0.00"
                  />
                </div>
                {errors.categories?.[index]?.requested && (
                  <p className="text-xs text-red-600">{errors.categories[index].requested.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    {...register(`categories.${index}.notes`)}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="Optional notes"
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {errors.categories && !Array.isArray(errors.categories) && (
          <p className="text-sm text-red-600">{errors.categories.message}</p>
        )}
      </div>

      {/* Form Footer */}
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100"
      >
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] transition-all duration-200"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] hover:from-[rgb(25,142,69)] hover:to-[rgb(31,178,86)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isSubmitting ? 'Saving...' : (isEdit ? 'Update Budget' : 'Create Budget')}
        </button>
      </motion.div>
    </form>
  );
};

export default BudgetForm;