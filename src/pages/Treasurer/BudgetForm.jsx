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
  InformationCircleIcon
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Budget name is required');
      return;
    }
    if (!formData.department) {
      toast.error('Department is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Valid amount is required');
      return;
    }

    setSubmitting(true);
    try {
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

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
      toast.error(error.response?.data?.error || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/treasurer/budgets')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Budgets
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Budget' : 'Create New Budget'}
          </h1>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="Brief description of the budget purpose"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    >
                      <option value="">Select Department</option>
                      <option value="Youth Ministry">Youth Ministry</option>
                      <option value="Children's Ministry">Children's Ministry</option>
                      <option value="Worship Ministry">Worship Ministry</option>
                      <option value="Missions">Missions</option>
                      <option value="Education">Education</option>
                      <option value="Facilities">Facilities</option>
                      <option value="Administration">Administration</option>
                      <option value="Outreach">Outreach</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
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
                  <input
                    type="number"
                    name="fiscalYear"
                    value={formData.fiscalYear}
                    onChange={handleChange}
                    min="2020"
                    max="2030"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (GHS) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  placeholder="Explain why this budget is needed and how it will be used..."
                />
              </div>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                <p className="text-sm text-blue-700">
                  Budgets start as DRAFT. You can submit them for approval when ready.
                  Once submitted, the pastor will review and approve/reject the budget.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/treasurer/budgets')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg text-sm font-medium hover:bg-[rgb(27,158,76)] disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update Budget' : 'Create Budget'
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default BudgetForm;