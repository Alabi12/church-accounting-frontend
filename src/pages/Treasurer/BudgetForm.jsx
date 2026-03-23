// pages/Treasurer/BudgetForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { treasurerService } from '../../services/treasurer';
import AccountSelector from '../../components/common/AccountSelector';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { STANDARD_CHART_OF_ACCOUNTS, getAccountTypeName } from '../../constants/chartOfAccounts';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [budgetType, setBudgetType] = useState('EXPENSE');
  const [distributionType, setDistributionType] = useState('annual');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    fiscalYear: new Date().getFullYear(),
    amount: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM',
    justification: '',
    budget_type: 'EXPENSE',
    account_id: null,
    account_code: '',
    monthly: {
      january: 0, february: 0, march: 0, april: 0, may: 0, june: 0,
      july: 0, august: 0, september: 0, october: 0, november: 0, december: 0
    }
  });

  const isEditMode = !!id;

  const months = [
    { key: 'january', name: 'January', days: 31 },
    { key: 'february', name: 'February', days: 28 },
    { key: 'march', name: 'March', days: 31 },
    { key: 'april', name: 'April', days: 30 },
    { key: 'may', name: 'May', days: 31 },
    { key: 'june', name: 'June', days: 30 },
    { key: 'july', name: 'July', days: 31 },
    { key: 'august', name: 'August', days: 31 },
    { key: 'september', name: 'September', days: 30 },
    { key: 'october', name: 'October', days: 31 },
    { key: 'november', name: 'November', days: 30 },
    { key: 'december', name: 'December', days: 31 }
  ];

  const fiscalYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  };

  const priorities = [
    { value: 'LOW', label: 'Low Priority', color: 'gray' },
    { value: 'MEDIUM', label: 'Medium Priority', color: 'yellow' },
    { value: 'HIGH', label: 'High Priority', color: 'red' }
  ];

  useEffect(() => {
    if (isEditMode) fetchBudget();
  }, [id]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const data = await treasurerService.getBudget(id);
      
      setFormData({
        name: data.name || '',
        description: data.description || '',
        department: data.department || '',
        fiscalYear: data.fiscalYear || data.fiscal_year || new Date().getFullYear(),
        amount: data.amount || '',
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        endDate: data.endDate ? data.endDate.split('T')[0] : '',
        priority: data.priority || 'MEDIUM',
        justification: data.justification || '',
        budget_type: data.budget_type || 'EXPENSE',
        account_id: data.account_id || null,
        account_code: data.account_code || '',
        monthly: data.monthly || {
          january: 0, february: 0, march: 0, april: 0, may: 0, june: 0,
          july: 0, august: 0, september: 0, october: 0, november: 0, december: 0
        }
      });
      
      setBudgetType(data.budget_type || 'EXPENSE');
      
      const hasMonthlyData = Object.values(data.monthly || {}).some(v => v > 0);
      if (hasMonthlyData) setDistributionType('monthly');
      
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

  const handleBudgetTypeChange = (type) => {
    setBudgetType(type);
    setFormData(prev => ({ ...prev, budget_type: type }));
  };

  const handleAccountSelect = (accountId) => {
    let selectedAccount = null;
    Object.values(STANDARD_CHART_OF_ACCOUNTS).forEach(accounts => {
      const found = accounts.find(acc => acc.id === accountId || acc.code === accountId);
      if (found) selectedAccount = found;
    });
    
    if (selectedAccount) {
      setFormData(prev => ({
        ...prev,
        account_id: selectedAccount.id,
        account_code: selectedAccount.code,
        department: selectedAccount.category || getAccountTypeName(selectedAccount.type),
        name: prev.name || `${selectedAccount.name} Budget ${prev.fiscalYear}`
      }));
    }
  };

  const handleMonthlyChange = (month, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      monthly: { ...prev.monthly, [month]: numValue }
    }));
  };

  const getTotalMonthlyAmount = () => {
    return Object.values(formData.monthly).reduce((sum, val) => sum + val, 0);
  };

  const distributeAmountEvenly = () => {
    const total = parseFloat(formData.amount) || 0;
    const monthlyAmount = total / 12;
    const newMonthly = {};
    months.forEach(month => {
      newMonthly[month.key] = monthlyAmount;
    });
    setFormData(prev => ({ ...prev, monthly: newMonthly }));
    toast.success(`₵${formatCurrency(total)} distributed evenly across 12 months`);
  };

  const distributeByDays = () => {
    const total = parseFloat(formData.amount) || 0;
    const totalDays = months.reduce((sum, month) => sum + month.days, 0);
    const dailyRate = total / totalDays;
    const newMonthly = {};
    months.forEach(month => {
      newMonthly[month.key] = dailyRate * month.days;
    });
    setFormData(prev => ({ ...prev, monthly: newMonthly }));
    toast.success(`₵${formatCurrency(total)} distributed based on days per month`);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Budget name is required');
      return false;
    }
    if (!formData.department) {
      toast.error('Please select an account first');
      return false;
    }
    if (!formData.account_code) {
      toast.error('Please select an account from the Chart of Accounts');
      return false;
    }
    
    const totalAmount = distributionType === 'annual' 
      ? formData.amount 
      : getTotalMonthlyAmount();
    
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error(`Valid ${budgetType === 'REVENUE' ? 'revenue' : 'expense'} amount is required`);
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
      const totalAmount = distributionType === 'annual' 
        ? parseFloat(formData.amount) 
        : getTotalMonthlyAmount();
      
      const budgetData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        department: formData.department,
        fiscal_year: parseInt(formData.fiscalYear),
        amount: totalAmount,
        priority: formData.priority,
        budget_type: budgetType,
        justification: formData.justification.trim(),
        period: distributionType === 'annual' ? 'annual' : 'monthly',
        account_id: formData.account_id,
        account_code: formData.account_code
      };
      
      if (distributionType === 'monthly') {
        budgetData.monthly = formData.monthly;
      }
      
      if (formData.startDate) budgetData.start_date = formData.startDate;
      if (formData.endDate) budgetData.end_date = formData.endDate;

      if (isEditMode) {
        await treasurerService.updateBudget(id, budgetData);
        toast.success('Budget updated successfully');
      } else {
        await treasurerService.createBudget(budgetData);
        toast.success(`${budgetType === 'REVENUE' ? 'Revenue' : 'Expense'} budget created successfully`);
      }
      
      navigate('/treasurer/budgets');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const totalMonthlyAmount = getTotalMonthlyAmount();
  const isMonthlyDistribution = distributionType === 'monthly';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              : 'Select an account from the Chart of Accounts to create a budget'}
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
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Account from Chart of Accounts *
              </label>
              <AccountSelector
                value={formData.account_id || formData.account_code}
                onChange={handleAccountSelect}
                accountType={budgetType === 'REVENUE' ? 'REVENUE' : 'EXPENSE'}
                placeholder="Search and select an account..."
              />
              {formData.account_code && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {formData.account_code} - {formData.department}
                      </p>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Budget Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleBudgetTypeChange('REVENUE')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    budgetType === 'REVENUE'
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <ArrowTrendingUpIcon className={`h-6 w-6 mx-auto mb-2 ${budgetType === 'REVENUE' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${budgetType === 'REVENUE' ? 'text-green-700' : 'text-gray-600'}`}>
                    Revenue Budget
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Income, tithes, offerings</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleBudgetTypeChange('EXPENSE')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    budgetType === 'EXPENSE'
                      ? 'border-red-500 bg-red-50 shadow-sm'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <ArrowTrendingDownIcon className={`h-6 w-6 mx-auto mb-2 ${budgetType === 'EXPENSE' ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${budgetType === 'EXPENSE' ? 'text-red-700' : 'text-gray-600'}`}>
                    Expense Budget
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Programs, operations, salaries</p>
                </button>
              </div>
            </div>

            {/* Budget Name */}
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                placeholder={`e.g., ${budgetType === 'REVENUE' ? 'Tithe & Offering Projections 2026' : 'Youth Ministry Programs 2026'}`}
              />
            </div>

            {/* Department (read-only from account) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department / Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FolderIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.department || (formData.account_code ? 'Select account above' : 'No account selected')}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Auto-filled from selected account</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                placeholder="Brief description of the budget purpose and expected outcomes"
              />
            </div>

            {/* Financial Details */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                  >
                    {priorities.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Distribution Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Distribution Method</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="annual"
                      checked={!isMonthlyDistribution}
                      onChange={() => setDistributionType('annual')}
                      className="form-radio text-[rgb(31,178,86)]"
                    />
                    <span className="ml-2 text-sm text-gray-600">Annual Total</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="monthly"
                      checked={isMonthlyDistribution}
                      onChange={() => setDistributionType('monthly')}
                      className="form-radio text-[rgb(31,178,86)]"
                    />
                    <span className="ml-2 text-sm text-gray-600">Monthly Breakdown</span>
                  </label>
                </div>
              </div>

              {/* Amount Input */}
              {!isMonthlyDistribution ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total {budgetType === 'REVENUE' ? 'Revenue' : 'Expense'} Amount (GHS) *
                  </label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleNumberChange}
                      min="0"
                      step="0.01"
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Monthly Breakdown (GHS)</label>
                    {parseFloat(formData.amount) > 0 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={distributeAmountEvenly}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          Distribute Evenly
                        </button>
                        <button
                          type="button"
                          onClick={distributeByDays}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          Distribute by Days
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {months.map((month) => (
                      <div key={month.key}>
                        <label className="block text-xs text-gray-600 mb-1">{month.name}</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">₵</span>
                          <input
                            type="number"
                            value={formData.monthly[month.key] || ''}
                            onChange={(e) => handleMonthlyChange(month.key, e.target.value)}
                            placeholder="0.00"
                            className="pl-6 pr-2 py-2 w-full text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                            step="0.01"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total:</span>
                      <span className={`text-lg font-bold ${budgetType === 'REVENUE' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalMonthlyAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
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
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Justification</h2>
              <textarea
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                placeholder="Explain why this budget is needed, how it aligns with church goals, and the expected impact..."
              />
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Budget Workflow:</p>
                  <ul className="space-y-1">
                    <li>• Select an account from the Chart of Accounts to associate with this budget</li>
                    <li>• Budgets start as <span className="font-semibold">DRAFT</span> - you can edit freely</li>
                    <li>• When ready, <span className="font-semibold">submit for approval</span> to the pastor</li>
                    <li>• Pastor will review and <span className="font-semibold">approve or reject</span> the budget</li>
                    <li>• Approved budgets are used for variance analysis in financial statements</li>
                    {isMonthlyDistribution && (
                      <li>• Monthly breakdowns enable better cash flow planning and variance analysis</li>
                    )}
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
                  {isEditMode ? 'Update Budget' : `Create ${budgetType === 'REVENUE' ? 'Revenue' : 'Expense'} Budget`}
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