import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  HeartIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').nullable(),
  phone: yup.string().nullable(),
  address: yup.string().nullable(),
  dateOfBirth: yup.string().nullable(),
  occupation: yup.string().nullable(),
  maritalStatus: yup.string().nullable(),
  anniversary: yup.string().nullable(),
  notes: yup.string().nullable(),
  isActive: yup.boolean(),
});

const MemberForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      occupation: '',
      maritalStatus: '',
      anniversary: '',
      notes: '',
      isActive: true,
    },
  });

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              {...register('firstName')}
              className={`
                w-full pl-10 pr-4 py-3 border-2 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-offset-2
                transition-all duration-200
                ${errors.firstName
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                }
              `}
              placeholder="John"
            />
          </div>
          {errors.firstName && (
            <p className="text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('lastName')}
            className={`
              w-full px-4 py-3 border-2 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-offset-2
              transition-all duration-200
              ${errors.lastName
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
              }
            `}
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </motion.div>
      </div>

      {/* Contact Information */}
      <motion.div variants={fadeInUp} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <EnvelopeIcon className="h-4 w-4 inline mr-1" />
          Email Address
        </label>
        <div className="relative">
          <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            {...register('email')}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
            placeholder="john.doe@example.com"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </motion.div>

      <motion.div variants={fadeInUp} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <PhoneIcon className="h-4 w-4 inline mr-1" />
          Phone Number
        </label>
        <div className="relative">
          <PhoneIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            {...register('phone')}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
            placeholder="+233 XX XXX XXXX"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <MapPinIcon className="h-4 w-4 inline mr-1" />
          Address
        </label>
        <textarea
          {...register('address')}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
          placeholder="Enter member's address..."
        />
      </motion.div>

      {/* Personal Information */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <CalendarIcon className="h-4 w-4 inline mr-1" />
            Date of Birth
          </label>
          <input
            type="date"
            {...register('dateOfBirth')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <BriefcaseIcon className="h-4 w-4 inline mr-1" />
            Occupation
          </label>
          <input
            type="text"
            {...register('occupation')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
            placeholder="e.g., Teacher, Engineer"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <HeartIcon className="h-4 w-4 inline mr-1" />
            Marital Status
          </label>
          <select
            {...register('maritalStatus')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
          >
            <option value="">Select status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <CalendarIcon className="h-4 w-4 inline mr-1" />
            Anniversary
          </label>
          <input
            type="date"
            {...register('anniversary')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <PencilSquareIcon className="h-4 w-4 inline mr-1" />
          Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
          placeholder="Additional notes about the member..."
        />
      </motion.div>

      {/* Status Field */}
      <motion.div variants={fadeInUp} className="flex items-center">
        <input
          type="checkbox"
          {...register('isActive')}
          className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Active Member
        </label>
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
          {isSubmitting ? 'Saving...' : 'Save Member'}
        </button>
      </motion.div>
    </form>
  );
};

export default MemberForm;