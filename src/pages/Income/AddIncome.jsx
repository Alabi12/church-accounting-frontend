import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import IncomeForm from '../../components/income/IncomeForm';
import { incomeService } from '../../services/income';
import toast from 'react-hot-toast';

const AddIncome = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const onSubmit = async (data) => {
    setSubmitError(null);
    
    try {
      setSubmitting(true);
      
      console.log('📤 Sending income data:', data);
      
      const response = await incomeService.createIncome(data);
      console.log('✅ Income created:', response);
      
      setShowSuccess(true);
      toast.success('Income recorded successfully');
      
      setTimeout(() => {
        navigate('/income');
      }, 1500);
    } catch (error) {
      console.error('❌ Error creating income:', error);
      setSubmitError(error.response?.data?.error || 'Failed to record income');
      toast.error(error.response?.data?.error || 'Failed to record income');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/income')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Income
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
                <p className="text-sm font-medium text-green-800">Income recorded successfully!</p>
                <p className="text-xs text-green-600 mt-1">Redirecting to income list...</p>
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
                <p className="text-sm font-medium text-red-800">Error recording income</p>
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
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Record New Income</h2>
                <p className="text-sm text-green-100 mt-0.5">
                  Enter the details of the income transaction below
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <IncomeForm
              onSubmit={onSubmit}
              onCancel={() => navigate('/income')}
              isSubmitting={submitting}
            />
          </div>
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
                <li>All fields marked with <span className="text-red-500">*</span> are required</li>
                <li>Amount is in Ghana Cedis (GHS)</li>
                <li>Reference numbers help with reconciliation</li>
                <li>Linking to a member helps track giving history</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Need to import CurrencyDollarIcon
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default AddIncome;