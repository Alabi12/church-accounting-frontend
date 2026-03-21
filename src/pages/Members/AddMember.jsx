import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { memberService } from '../../services/members';
import toast from 'react-hot-toast';

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
});

const AddMember = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
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
    },
  });

  const onSubmit = async (data) => {
    setSubmitError(null);
    
    try {
      setSubmitting(true);
      
      // Filter out empty values
      const apiData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '')
      );
      
      console.log('📤 Sending member data:', apiData);
      
      const response = await memberService.createMember(apiData);
      console.log('✅ Member created:', response);
      
      setShowSuccess(true);
      toast.success('Member added successfully');
      
      setTimeout(() => {
        navigate('/members');
      }, 1500);
    } catch (error) {
      console.error('❌ Error creating member:', error);
      setSubmitError(error.response?.data?.error || 'Failed to add member');
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/members')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Members
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            {...fadeInUp}
            className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Member added successfully!</p>
                <p className="text-xs text-green-600 mt-1">Redirecting to members list...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {submitError && (
          <motion.div
            {...fadeInUp}
            className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Error adding member</p>
                <p className="text-xs text-red-600 mt-1">{submitError}</p>
              </div>
            </div>
          </motion.div>
        )}

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
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Add New Member</h2>
                <p className="text-sm text-green-100 mt-0.5">
                  Enter the member's personal information
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
                placeholder="Additional notes about the member..."
              />
            </motion.div>

            {/* Form Footer */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100"
            >
              <button
                type="button"
                onClick={() => navigate('/members')}
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
                    Adding...
                  </span>
                ) : (
                  'Add Member'
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        {/* Quick Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Quick Tips</h4>
              <ul className="mt-2 text-xs text-blue-600 space-y-1 list-disc list-inside">
                <li>First name and last name are required fields</li>
                <li>Email addresses are used for sending contribution statements</li>
                <li>You can add giving history after creating the member</li>
                <li>Additional information helps with member engagement</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AddMember;