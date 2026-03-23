// pages/Accountant/ChartOfAccountsForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  XCircleIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import { STANDARD_CHART_OF_ACCOUNTS, getNextAccountCode, getAccountTypeColor, getAccountTypeName } from '../../constants/chartOfAccounts';
import toast from 'react-hot-toast';

const ChartOfAccountsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    displayName: '',
    type: 'ASSET',
    category: '',
    subCategory: '',
    description: '',
    normalBalance: 'debit',
    isActive: true,
    openingBalance: 0,
    isContra: false,
    level: 1,
    parentAccountId: null
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [parentAccounts, setParentAccounts] = useState([]);

  const accountTypes = [
    { id: 'ASSET', name: 'Asset', icon: BanknotesIcon, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', standardCount: STANDARD_CHART_OF_ACCOUNTS.ASSET.length },
    { id: 'LIABILITY', name: 'Liability', icon: BriefcaseIcon, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', standardCount: STANDARD_CHART_OF_ACCOUNTS.LIABILITY.length },
    { id: 'EQUITY', name: 'Equity', icon: ScaleIcon, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', standardCount: STANDARD_CHART_OF_ACCOUNTS.EQUITY.length },
    { id: 'REVENUE', name: 'Revenue', icon: CurrencyDollarIcon, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', standardCount: STANDARD_CHART_OF_ACCOUNTS.REVENUE.length },
    { id: 'EXPENSE', name: 'Expense', icon: CurrencyDollarIcon, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', standardCount: STANDARD_CHART_OF_ACCOUNTS.EXPENSE.length },
  ];

  const normalBalanceOptions = [
    { id: 'debit', name: 'Debit', description: 'Increases with debit entries' },
    { id: 'credit', name: 'Credit', description: 'Increases with credit entries' }
  ];

  // Load account data if in edit mode
  useEffect(() => {
    if (id) {
      loadAccountData();
    }
    fetchParentAccounts();
    
    // Auto-generate account code for new accounts
    if (!id && !formData.code) {
      generateAccountCode(formData.type);
    }
  }, [id]);

  // Generate account code when type changes for new accounts
  useEffect(() => {
    if (!id && formData.type) {
      generateAccountCode(formData.type);
    }
  }, [formData.type, id]);

  const generateAccountCode = (type) => {
    // Get existing accounts of this type
    const existingCodes = STANDARD_CHART_OF_ACCOUNTS[type]?.map(acc => acc.code) || [];
    
    // Find the next available code
    let baseCode = '';
    switch(type) {
      case 'ASSET': baseCode = '1'; break;
      case 'LIABILITY': baseCode = '2'; break;
      case 'EQUITY': baseCode = '3'; break;
      case 'REVENUE': baseCode = '4'; break;
      case 'EXPENSE': baseCode = '5'; break;
      default: baseCode = '9';
    }
    
    // Find max code number in this type
    let maxNumber = 0;
    existingCodes.forEach(code => {
      if (code.startsWith(baseCode)) {
        const num = parseInt(code);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    // If no existing codes, start from baseCode + 10
    if (maxNumber === 0) {
      maxNumber = parseInt(baseCode + '10');
    }
    
    const nextCode = (maxNumber + 1).toString();
    setFormData(prev => ({ ...prev, code: nextCode }));
  };

  const loadAccountData = async () => {
    try {
      setInitialLoading(true);
      const response = await accountantService.getAccount(id);
      const accountData = response.account || response;
      
      setFormData({
        code: accountData.account_code || accountData.code || '',
        name: accountData.name || '',
        displayName: accountData.display_name || accountData.name || '',
        type: accountData.account_type || accountData.type || 'ASSET',
        category: accountData.category || '',
        subCategory: accountData.sub_category || '',
        description: accountData.description || '',
        normalBalance: accountData.normal_balance || 
          (accountData.account_type === 'ASSET' || accountData.account_type === 'EXPENSE' ? 'debit' : 'credit'),
        isActive: accountData.is_active !== false,
        openingBalance: accountData.opening_balance || 0,
        isContra: accountData.is_contra || false,
        level: accountData.level || 1,
        parentAccountId: accountData.parent_account_id || null
      });
    } catch (error) {
      console.error('Error loading account:', error);
      toast.error('Failed to load account data');
      navigate('/accountant/chart-of-accounts');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchParentAccounts = async () => {
    try {
      const response = await accountantService.getAccounts();
      const accountsList = response.accounts || response.data?.accounts || response || [];
      const parents = accountsList.filter(acc => 
        (acc.level === 1 || !acc.parent_account_id) && 
        (!id || acc.id !== parseInt(id))
      );
      setParentAccounts(parents);
    } catch (error) {
      console.error('Error fetching parent accounts:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Account code is required';
    } else if (!/^\d{4}$/.test(formData.code) && !/^\d{4}-\d{2,4}$/.test(formData.code)) {
      newErrors.code = 'Account code should be in format: 4 digits (e.g., 4010) or with sub-account (e.g., 4010-01)';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }
    
    if (formData.level === 1 && formData.parentAccountId) {
      newErrors.parentAccountId = 'Level 1 accounts cannot have a parent account';
    }
    
    if (formData.level > 1 && !formData.parentAccountId) {
      newErrors.parentAccountId = 'Sub-accounts require a parent account';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        displayName: formData.displayName || formData.name,
        type: formData.type,
        category: formData.category,
        subCategory: formData.subCategory,
        description: formData.description,
        normalBalance: formData.normalBalance,
        isActive: formData.isActive,
        openingBalance: parseFloat(formData.openingBalance) || 0,
        isContra: formData.isContra,
        level: parseInt(formData.level) || 1,
        parentAccountId: formData.parentAccountId || null
      };

      if (id) {
        await accountantService.updateAccount(id, payload);
        toast.success('Account updated successfully');
      } else {
        await accountantService.createAccount(payload);
        toast.success('Account created successfully');
      }
      
      navigate('/accountant/chart-of-accounts');
      
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error(error.response?.data?.error || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate('/accountant/chart-of-accounts');
  };

  const getTypeIcon = (typeId) => {
    const type = accountTypes.find(t => t.id === typeId);
    if (!type) return <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />;
    const Icon = type.icon;
    return <Icon className={`h-5 w-5 ${type.color}`} />;
  };

  const getTypeColorClass = (typeId) => {
    const type = accountTypes.find(t => t.id === typeId);
    return type ? `${type.bgColor} ${type.color} ${type.borderColor}` : 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getStandardAccountsForType = (type) => {
    return STANDARD_CHART_OF_ACCOUNTS[type] || [];
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <ArrowPathIcon className="animate-spin h-8 w-8 text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading account data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {id ? 'Edit Account' : 'Create New Account'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {id ? 'Update account details' : 'Add a new account to the chart of accounts'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Selected Type Indicator */}
          <div className={`mb-6 p-3 rounded-lg border ${getTypeColorClass(formData.type)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getTypeIcon(formData.type)}
                <span className="ml-2 font-medium">
                  Account Type: {accountTypes.find(t => t.id === formData.type)?.name}
                </span>
              </div>
              <span className="text-xs">
                {getStandardAccountsForType(formData.type).length} standard accounts of this type
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., 4010 or 4010-01"
                  disabled={!!id}
                />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                {!id && (
                  <p className="text-xs text-gray-400 mt-1">
                    Auto-generated based on account type. You can modify it.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const normalBalance = (newType === 'ASSET' || newType === 'EXPENSE') ? 'debit' : 'credit';
                    setFormData({ ...formData, type: newType, normalBalance });
                    if (!id) generateAccountCode(newType);
                  }}
                  className={`w-full px-3 py-2 border rounded-md ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={!!id}
                >
                  {accountTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Tithes"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Display Name (Optional)</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Display name if different from account name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Income, Current Assets"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sub Category</label>
                <input
                  type="text"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Tithes & Offerings"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Brief description of the account"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!!id}
                >
                  <option value={1}>Level 1 - Main Account</option>
                  <option value={2}>Level 2 - Sub Account</option>
                  <option value={3}>Level 3 - Detailed Account</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Parent Account</label>
                <select
                  value={formData.parentAccountId || ''}
                  onChange={(e) => setFormData({ ...formData, parentAccountId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={formData.level === 1}
                >
                  <option value="">None (Top Level Account)</option>
                  {parentAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.name}
                    </option>
                  ))}
                </select>
                {errors.parentAccountId && <p className="text-xs text-red-500 mt-1">{errors.parentAccountId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Normal Balance</label>
                <select
                  value={formData.normalBalance}
                  onChange={(e) => setFormData({ ...formData, normalBalance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!!id}
                >
                  {normalBalanceOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {formData.normalBalance === 'debit' 
                    ? 'Account increases with debit entries' 
                    : 'Account increases with credit entries'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                  disabled={!!id}
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isContra}
                  onChange={(e) => setFormData({ ...formData, isContra: e.target.checked })}
                  className="h-4 w-4 text-green-600 rounded"
                  disabled={!!id}
                />
                <span className="ml-2 text-sm">Is Contra Account</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-green-600 rounded"
                />
                <span className="ml-2 text-sm">Account is active</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  id ? 'Update Account' : 'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Standard Account Reference */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Standard Account Reference</h4>
            <p className="text-xs text-blue-700 mb-2">
              Based on the church accounting document. Here are the standard accounts in this category:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {getStandardAccountsForType(formData.type).slice(0, 6).map(acc => (
                <div key={acc.code} className="flex items-center gap-1 text-blue-600">
                  <span className="font-mono">{acc.code}</span>
                  <span>-</span>
                  <span className="truncate">{acc.name}</span>
                </div>
              ))}
              {getStandardAccountsForType(formData.type).length > 6 && (
                <div className="text-blue-500 italic">
                  +{getStandardAccountsForType(formData.type).length - 6} more...
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChartOfAccountsForm;