import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  HashtagIcon,
  PencilSquareIcon,
  TagIcon,
  BanknotesIcon,
  PhoneIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const schema = yup.object({
  date: yup.string().required('Date is required'),
  amount: yup.number().positive('Amount must be greater than 0').required('Amount is required'),
  category: yup.string().required('Category is required'),
  paymentMethod: yup.string().required('Payment method is required'),
  vendor: yup.string().required('Vendor is required'),
  description: yup.string(),
  reference: yup.string(),
  notes: yup.string(),
});

const expenseCategories = [
  { id: 'SALARY', name: 'Salary & Wages', icon: '💰', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'UTILITIES', name: 'Utilities', icon: '⚡', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'MAINTENANCE', name: 'Maintenance', icon: '🔧', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'SUPPLIES', name: 'Office Supplies', icon: '📎', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'MINISTRY', name: 'Ministry Expenses', icon: '⛪', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'OUTREACH', name: 'Outreach', icon: '🤝', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'MISSIONS', name: 'Missions', icon: '🌍', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'EVENTS', name: 'Events', icon: '🎉', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'TECHNOLOGY', name: 'Technology', icon: '💻', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'TRAVEL', name: 'Travel', icon: '✈️', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'TRAINING', name: 'Training', icon: '📚', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'EQUIPMENT', name: 'Equipment', icon: '⚙️', color: 'bg-stone-50 text-stone-700 border-stone-200' },
  { id: 'OTHER', name: 'Other', icon: '📌', color: 'bg-gray-50 text-gray-700 border-gray-200' },
];

const paymentMethods = [
  { id: 'CASH', name: 'Cash', icon: BanknotesIcon, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  { id: 'CHEQUE', name: 'Cheque', icon: DocumentTextIcon, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: CurrencyDollarIcon, bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  { id: 'CREDIT_CARD', name: 'Credit Card', icon: CreditCardIcon, bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  { id: 'DEBIT_CARD', name: 'Debit Card', icon: CreditCardIcon, bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  { id: 'MOBILE_MONEY', name: 'Mobile Money', icon: PhoneIcon, bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  { id: 'ONLINE', name: 'Online', icon: GlobeAltIcon, bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
];

const ExpenseForm = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  selectedCategory: externalSelectedCategory,
  onCategoryChange,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      category: 'SALARY',
      amount: '',
      vendor: '',
      description: '',
      reference: '',
      notes: '',
    },
  });

  const watchCategory = watch('category');
  const watchAmount = watch('amount');
  const watchPaymentMethod = watch('paymentMethod');

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Quick Category Selection */}
      <motion.div variants={fadeInUp} className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <span className="flex items-center">
            <TagIcon className="h-4 w-4 mr-1" />
            Expense Category
          </span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
          {expenseCategories.map((cat) => {
            const isSelected = watchCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setValue('category', cat.id);
                  trigger('category');
                  onCategoryChange?.(cat.id);
                }}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? `${cat.color} border-red-600 shadow-md`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs font-medium">{cat.name}</div>
              </motion.button>
            );
          })}
        </div>
        {errors.category && (
          <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
        )}
      </motion.div>

      {/* Date and Amount Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <CalendarIcon className="h-4 w-4 inline mr-1" />
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              {...register('date')}
              className={`
                w-full px-4 py-3 border-2 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-all duration-200
                ${errors.date
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-red-600 focus:border-red-600'
                }
              `}
            />
          </div>
          {errors.date && (
            <p className="text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        {/* Amount Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
            Amount (GHS) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500 font-medium">GH₵</span>
            <input
              type="number"
              step="0.01"
              {...register('amount')}
              className={`
                w-full pl-16 pr-4 py-3 border-2 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-all duration-200
                ${errors.amount
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-red-600 focus:border-red-600'
                }
              `}
              placeholder="0.00"
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-600">{errors.amount.message}</p>
          )}
          {watchAmount && (
            <p className="text-xs text-gray-500">
              Amount: {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(watchAmount)}
            </p>
          )}
        </div>
      </motion.div>

      {/* Vendor Field */}
      <motion.div variants={fadeInUp} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
          Vendor <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('vendor')}
          className={`
            w-full px-4 py-3 border-2 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-offset-2
            transition-all duration-200
            ${errors.vendor
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-200 focus:ring-red-600 focus:border-red-600'
            }
          `}
          placeholder="Enter vendor name"
        />
        {errors.vendor && (
          <p className="text-sm text-red-600">{errors.vendor.message}</p>
        )}
      </motion.div>

      {/* Payment Method Field */}
      <motion.div variants={fadeInUp} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <CreditCardIcon className="h-4 w-4 inline mr-1" />
          Payment Method <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = watchPaymentMethod === method.id;
            return (
              <motion.button
                key={method.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setValue('paymentMethod', method.id);
                  trigger('paymentMethod');
                }}
                className={`
                  flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? `${method.bgColor} ${method.textColor} border-red-600`
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-6 w-6 mb-2" />
                <span className="text-xs font-medium text-center">{method.name}</span>
              </motion.button>
            );
          })}
        </div>
        {errors.paymentMethod && (
          <p className="text-sm text-red-600 mt-1">{errors.paymentMethod.message}</p>
        )}
      </motion.div>

      {/* Description Field */}
      <motion.div variants={fadeInUp} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <DocumentTextIcon className="h-4 w-4 inline mr-1" />
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200"
          placeholder="Enter a brief description of the expense..."
        />
      </motion.div>

      {/* Reference and Notes Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <HashtagIcon className="h-4 w-4 inline mr-1" />
            Reference Number
          </label>
          <input
            type="text"
            {...register('reference')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200"
            placeholder="Invoice #, PO #, Receipt #..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <PencilSquareIcon className="h-4 w-4 inline mr-1" />
            Notes
          </label>
          <input
            type="text"
            {...register('notes')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200"
            placeholder="Additional notes..."
          />
        </div>
      </motion.div>

      {/* Form Footer */}
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100"
      >
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </button>
      </motion.div>
    </form>
  );
};

export default ExpenseForm;