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
  UserIcon,
} from '@heroicons/react/24/outline';
import AsyncSelect from 'react-select/async';
import { memberService } from '../../services/members';

const schema = yup.object({
  date: yup.string().required('Date is required'),
  amount: yup.number().positive('Amount must be greater than 0').required('Amount is required'),
  category: yup.string().required('Category is required'),
  paymentMethod: yup.string().required('Payment method is required'),
  description: yup.string(),
  reference: yup.string(),
  notes: yup.string(),
  memberId: yup.number().nullable(),
});

const incomeCategories = [
  { id: 'TITHE', name: 'Tithe', icon: '✝️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'OFFERING', name: 'Offering', icon: '🙏', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'SPECIAL_OFFERING', name: 'Special Offering', icon: '🎁', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'DONATION', name: 'Donation', icon: '❤️', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'PLEDGE', name: 'Pledge', icon: '📝', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'EVENT_INCOME', name: 'Event Income', icon: '🎉', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'RENTAL_INCOME', name: 'Rental Income', icon: '🏢', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'INVESTMENT_INCOME', name: 'Investment', icon: '📈', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'MISSION_SUPPORT', name: 'Mission Support', icon: '🌍', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'BOOKSTORE_SALES', name: 'Bookstore Sales', icon: '📚', color: 'bg-amber-50 text-amber-700 border-amber-200' },
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

const IncomeForm = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  selectedCategory: externalSelectedCategory,
  onCategoryChange,
}) => {
  const [selectedMember, setSelectedMember] = useState(null);

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
      category: 'TITHE',
      amount: '',
      description: '',
      reference: '',
      notes: '',
      memberId: null,
    },
  });

  const watchCategory = watch('category');
  const watchAmount = watch('amount');
  const watchPaymentMethod = watch('paymentMethod');

  // Set selected member from initialData
  useEffect(() => {
    if (initialData?.memberId && initialData?.memberName) {
      setSelectedMember({
        value: initialData.memberId,
        label: initialData.memberName,
      });
    }
  }, [initialData]);

  // Load members for async select
  const loadMembers = async (inputValue) => {
    try {
      const response = await memberService.getMembers({ search: inputValue, perPage: 20 });
      return response.members.map((member) => ({
        value: member.id,
        label: `${member.fullName} ${member.email ? `(${member.email})` : ''}`,
      }));
    } catch (error) {
      console.error('Error loading members:', error);
      return [];
    }
  };

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      memberId: selectedMember?.value || null,
    });
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Quick Category Selection */}
      <motion.div variants={fadeInUp} className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <span className="flex items-center">
            <TagIcon className="h-4 w-4 mr-1" />
            Income Category
          </span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {incomeCategories.map((cat) => {
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
                    ? `${cat.color} border-[rgb(31,178,86)] shadow-md`
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
                  : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
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
                  : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
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

      {/* Member Field */}
      <motion.div variants={fadeInUp} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <UserIcon className="h-4 w-4 inline mr-1" />
          Member (Optional)
        </label>
        <AsyncSelect
          cacheOptions
          loadOptions={loadMembers}
          defaultOptions
          value={selectedMember}
          onChange={setSelectedMember}
          placeholder="Search for a member..."
          className="react-select-container"
          classNamePrefix="react-select"
          isClearable
        />
        <p className="text-xs text-gray-500 mt-1">
          Select a member to track their giving history
        </p>
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
                    ? `${method.bgColor} ${method.textColor} border-[rgb(31,178,86)]`
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
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
          placeholder="Enter a brief description of the income..."
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
            placeholder="Receipt #, Transaction ID..."
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
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
          className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] transition-all duration-200"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] hover:from-[rgb(25,142,69)] hover:to-[rgb(31,178,86)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isSubmitting ? 'Saving...' : 'Save Income'}
        </button>
      </motion.div>
    </form>
  );
};

export default IncomeForm;