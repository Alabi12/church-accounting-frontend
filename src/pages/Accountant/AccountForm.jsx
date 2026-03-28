// pages/Accounting/AccountForm.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import toast from 'react-hot-toast';

const AccountForm = ({ account, onClose, onSuccess, predefinedAccounts = null }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET',
    category: '',
    description: '',
    normalBalance: 'debit',
    isActive: true,
    openingBalance: 0
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPredefined, setShowPredefined] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPredefined, setSelectedPredefined] = useState(null);

  const accountTypes = [
    { id: 'ASSET', name: 'Asset' },
    { id: 'LIABILITY', name: 'Liability' },
    { id: 'EQUITY', name: 'Equity' },
    { id: 'REVENUE', name: 'Revenue' },
    { id: 'EXPENSE', name: 'Expense' },
  ];

  const normalBalanceOptions = [
    { id: 'debit', name: 'Debit' },
    { id: 'credit', name: 'Credit' }
  ];

  // Filter predefined accounts based on search and type
  const filteredPredefinedAccounts = predefinedAccounts ? 
    predefinedAccounts.filter(acc => 
      (!formData.type || acc.type === formData.type) &&
      (searchTerm === '' || 
        acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code || account.account_code || '',
        name: account.name || '',
        type: account.type || account.account_type || 'ASSET',
        category: account.category || '',
        description: account.description || '',
        normalBalance: account.normal_balance || 'debit',
        isActive: account.is_active !== false,
        openingBalance: account.opening_balance || 0
      });
    }
  }, [account]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Account code is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Account type is required';
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
        type: formData.type,
        category: formData.category,
        description: formData.description,
        normalBalance: formData.normalBalance,
        isActive: formData.isActive,
        openingBalance: parseFloat(formData.openingBalance) || 0
      };

      if (account) {
        await accountantService.updateAccount(account.id, payload);
        toast.success('Account updated successfully');
      } else {
        await accountantService.createAccount(payload);
        toast.success('Account created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error(error.response?.data?.error || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPredefined = (predefAccount) => {
    setFormData({
      ...formData,
      code: predefAccount.code,
      name: predefAccount.name,
      type: predefAccount.type,
      category: predefAccount.category || '',
      description: predefAccount.description || `Standard ${predefAccount.type.toLowerCase()} account: ${predefAccount.name}`,
      normalBalance: predefAccount.normalBalance || (predefAccount.type === 'ASSET' ? 'debit' : 'credit')
    });
    setShowPredefined(false);
    setSelectedPredefined(predefAccount);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {account ? 'Edit Account' : 'Create New Account'}
          </h2>
          <button onClick={onClose}>
            <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
          </button>
        </div>

        {/* Show predefined accounts button for new accounts */}
        {!account && predefinedAccounts && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowPredefined(!showPredefined)}
              className="flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
            >
              <BookOpenIcon className="h-4 w-4 mr-2" />
              {showPredefined ? 'Hide Standard Accounts' : 'Select from Standard Chart of Accounts'}
            </button>
          </div>
        )}

        {/* Predefined accounts selection */}
        {showPredefined && filteredPredefinedAccounts.length > 0 && (
          <div className="mb-4 border rounded-lg p-3 bg-gray-50">
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {filteredPredefinedAccounts.map(acc => (
                  <button
                    key={acc.code}
                    type="button"
                    onClick={() => handleSelectPredefined(acc)}
                    className="text-left p-2 hover:bg-white rounded border border-gray-200"
                  >
                    <div className="font-medium text-sm">{acc.code} - {acc.name}</div>
                    <div className="text-xs text-gray-500">{acc.type}</div>
                    {acc.category && <div className="text-xs text-gray-400">{acc.category}</div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
                placeholder="e.g., 1010"
                disabled={!!account} // Disable code editing for existing accounts
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
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
              placeholder="e.g., Cash - Operating"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Current Assets"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Brief description of the account"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Normal Balance</label>
              <select
                value={formData.normalBalance}
                onChange={(e) => setFormData({ ...formData, normalBalance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {normalBalanceOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
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
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-green-600 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm">
              Account is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AccountForm;