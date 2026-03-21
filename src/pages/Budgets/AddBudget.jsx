import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import BudgetForm from '../../components/budgets/BudgetForm';
import { budgetService } from '../../services/budgets';
import toast from 'react-hot-toast';

const AddBudget = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

// In AddBudget.jsx, update the onSubmit function:

const onSubmit = async (data) => {
  setSubmitError(null);
  
  try {
    setSubmitting(true);
    
    console.log('📤 Sending budget data:', data);
    
    const response = await budgetService.createBudget(data, true);
    
    console.log('✅ Budget created:', response);
    
    // Check if we're in mock mode
    if (response.message?.includes('mock')) {
      toast.success('Budget created (Demo Mode)');
    } else {
      toast.success('Budget created successfully');
    }
    
    setShowSuccess(true);
    
    // Navigate after a short delay
    setTimeout(() => {
      navigate('/budgets');
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error creating budget:', error);
    
    // Don't show error for mock mode since we already handled it
    if (error.message?.includes('mock')) {
      return;
    }
    
    const errorMessage = error.response?.data?.error || error.message || 'Failed to create budget';
    setSubmitError(errorMessage);
    toast.error(errorMessage);
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
            onClick={() => navigate('/budgets')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Budgets
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
                <p className="text-sm font-medium text-green-800">Budget created successfully!</p>
                <p className="text-xs text-green-600 mt-1">Redirecting to budgets list...</p>
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
                <p className="text-sm font-medium text-red-800">Error creating budget</p>
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
                <h2 className="text-xl font-semibold text-white">Create New Budget</h2>
                <p className="text-sm text-green-100 mt-0.5">
                  Enter the budget details and categories below
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <BudgetForm
              onSubmit={onSubmit}
              onCancel={() => navigate('/budgets')}
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
              <h4 className="text-sm font-medium text-blue-800">Budget Creation Tips</h4>
              <ul className="mt-2 text-xs text-blue-600 space-y-1 list-disc list-inside">
                <li>All fields marked with <span className="text-red-500">*</span> are required</li>
                <li>Add multiple categories to break down the budget</li>
                <li>Total amount is automatically calculated from categories</li>
                <li>Budgets start as drafts and need approval</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AddBudget;