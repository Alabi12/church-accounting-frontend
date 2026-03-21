// pages/Expenses/AddExpense.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  TagIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const AddExpense = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountBalance, setAccountBalance] = useState(null);
  const [balanceCheck, setBalanceCheck] = useState({
    isSufficient: true,
    checking: false,
    message: ''
  });
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    description: '',
    category: '',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  const categories = [
    'Salaries',
    'Utilities',
    'Rent',
    'Office Supplies',
    'Equipment',
    'Maintenance',
    'Travel',
    'Training',
    'Ministry Programs',
    'Outreach',
    'Missions',
    'Other'
  ];

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: BanknotesIcon },
    { id: 'bank', name: 'Bank Transfer', icon: BuildingOfficeIcon },
    { id: 'cheque', name: 'Cheque', icon: DocumentTextIcon },
    { id: 'mobile_money', name: 'Mobile Money', icon: CurrencyDollarIcon }
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (formData.account_id) {
      fetchAccountBalance(formData.account_id);
      const account = accounts.find(a => a.id === parseInt(formData.account_id));
      setSelectedAccount(account);
    }
  }, [formData.account_id, accounts]);

  useEffect(() => {
    if (formData.amount && formData.amount > 0 && accountBalance) {
      checkBalance();
    }
  }, [formData.amount, accountBalance]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Fetch both bank and petty cash accounts
      const [bankRes, cashRes] = await Promise.allSettled([
        accountantService.getBankAccounts(),
        accountantService.getPettyCashAccounts()
      ]);

      let allAccounts = [];
      
      if (bankRes.status === 'fulfilled') {
        allAccounts = [...allAccounts, ...bankRes.value.accounts.map(acc => ({
          ...acc,
          account_type: 'bank',
          displayName: `🏦 ${acc.name} - ${acc.bank || 'Bank'}`
        }))];
      }
      
      if (cashRes.status === 'fulfilled') {
        allAccounts = [...allAccounts, ...cashRes.value.accounts.map(acc => ({
          ...acc,
          account_type: 'cash',
          displayName: `💰 ${acc.name} - Petty Cash`
        }))];
      }

      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountBalance = async (accountId) => {
    try {
      setBalanceCheck(prev => ({ ...prev, checking: true }));
      const response = await api.get(`/expenses/accounts/${accountId}/balance`);
      setAccountBalance(response.data);
      setBalanceCheck(prev => ({ ...prev, checking: false }));
    } catch (error) {
      console.error('Error fetching account balance:', error);
      setBalanceCheck(prev => ({ ...prev, checking: false }));
    }
  };

 const checkBalance = () => {
  if (!accountBalance || !formData.amount) return;
  
  const amount = parseFloat(formData.amount);
  const currentBalance = accountBalance.current_balance || 0;
  const availableBalance = accountBalance.available_balance || 0;
  const pendingExpenses = accountBalance.pending_expenses || 0;
  
  console.log('Balance check:', {
    amount,
    currentBalance,
    availableBalance,
    pendingExpenses,
    accountBalance
  });
  
  if (amount > availableBalance) {
    const deficit = amount - availableBalance;
    setBalanceCheck({
      isSufficient: false,
      checking: false,
      message: `⚠️ INSUFFICIENT FUNDS! Required: ${formatCurrency(amount, 'GHS')}, Available: ${formatCurrency(availableBalance, 'GHS')}, Deficit: ${formatCurrency(deficit, 'GHS')}`,
      details: {
        currentBalance,
        availableBalance,
        pendingExpenses,
        deficit
      }
    });
    
    // Also show a toast warning
    toast.error(
      <div className="space-y-1">
        <p className="font-bold">Insufficient Funds!</p>
        <p>Amount: {formatCurrency(amount, 'GHS')}</p>
        <p>Available: {formatCurrency(availableBalance, 'GHS')}</p>
        <p>Deficit: {formatCurrency(deficit, 'GHS')}</p>
      </div>,
      { duration: 5000, id: 'insufficient-funds' }
    );
  } else {
    setBalanceCheck({
      isSufficient: true,
      checking: false,
      message: `✅ Sufficient funds available: ${formatCurrency(availableBalance, 'GHS')}`,
      details: {
        currentBalance,
        availableBalance,
        pendingExpenses
      }
    });
  }
};

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.account_id) {
      newErrors.account_id = 'Please select an account';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (!balanceCheck.isSufficient) {
      newErrors.amount = 'Insufficient funds in selected account';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const response = await api.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount)
      });

      toast.success('Expense created successfully');
      navigate('/expenses');
    } catch (error) {
      console.error('Error creating expense:', error);
      
      // Handle insufficient funds error from server
      if (error.response?.status === 402) {
        const details = error.response.data.details;
        toast.error(
          <div className="space-y-1">
            <p className="font-bold">Insufficient Funds!</p>
            <p>Required: {formatCurrency(details.requested_amount, 'GHS')}</p>
            <p>Available: {formatCurrency(details.current_balance, 'GHS')}</p>
            <p>Deficit: {formatCurrency(details.deficit, 'GHS')}</p>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(error.response?.data?.error || 'Failed to create expense');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getAccountIcon = (accountType) => {
    return accountType === 'bank' ? BuildingOfficeIcon : BanknotesIcon;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/expenses')}
            className="p-2 hover:bg-gray-100 rounded-lg mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Expense</h1>
        </div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Account Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Account <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                  errors.account_id
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                }`}
              >
                <option value="">Select an account</option>
                <optgroup label="Bank Accounts">
                  {accounts.filter(a => a.account_type === 'bank').map(account => (
                    <option key={account.id} value={account.id}>
                      {account.displayName}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Petty Cash">
                  {accounts.filter(a => a.account_type === 'cash').map(account => (
                    <option key={account.id} value={account.id}>
                      {account.displayName}
                    </option>
                  ))}
                </optgroup>
              </select>
              {errors.account_id && (
                <p className="text-sm text-red-600">{errors.account_id}</p>
              )}
            </div>

            {/* Account Balance Display */}
            {accountBalance && (
              <div className={`p-4 rounded-lg ${
                accountBalance.available_balance > 0 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(accountBalance.current_balance, 'GHS')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(accountBalance.available_balance, 'GHS')}
                    </p>
                  </div>
                </div>
                {accountBalance.pending_expenses > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Pending expenses: {formatCurrency(accountBalance.pending_expenses, 'GHS')}
                  </p>
                )}
              </div>
            )}

            {/* Amount Input with Balance Check */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">GH₵</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full pl-16 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                    errors.amount
                      ? 'border-red-300 focus:ring-red-500'
                      : !balanceCheck.isSufficient && formData.amount
                      ? 'border-red-300 focus:ring-red-500'
                      : balanceCheck.isSufficient && formData.amount
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                  }`}
                  placeholder="0.00"
                />
                {balanceCheck.checking && (
                  <ArrowPathIcon className="absolute right-4 top-3 h-5 w-5 text-gray-400 animate-spin" />
                )}
              </div>
              
              {/* Balance Check Message */}
              {formData.amount && !balanceCheck.checking && (
                <div className={`mt-2 p-2 rounded-lg flex items-center ${
                  balanceCheck.isSufficient
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {balanceCheck.isSufficient ? (
                    <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                  )}
                  <span className="text-sm">{balanceCheck.message}</span>
                </div>
              )}
              
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                  errors.description
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                }`}
                placeholder="Enter expense description..."
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Category and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                    errors.category
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                    errors.date
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                  }`}
                />
                {errors.date && (
                  <p className="text-sm text-red-600">{errors.date}</p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: method.id })}
                      className={`p-3 border-2 rounded-xl flex flex-col items-center space-y-2 transition-all duration-200 ${
                        formData.payment_method === method.id
                          ? 'border-[rgb(31,178,86)] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${
                        formData.payment_method === method.id
                          ? 'text-[rgb(31,178,86)]'
                          : 'text-gray-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        formData.payment_method === method.id
                          ? 'text-[rgb(31,178,86)]'
                          : 'text-gray-600'
                      }`}>
                        {method.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
                placeholder="Invoice #, Receipt #, etc."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting || (formData.amount && !balanceCheck.isSufficient)}
                className="px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] hover:from-[rgb(25,142,69)] hover:to-[rgb(31,178,86)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Creating...
                  </span>
                ) : (
                  'Create Expense'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Warning Card for Low Balance */}
        {selectedAccount && accountBalance && accountBalance.available_balance < 500 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200"
          >
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Low Balance Warning</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  This account has a low available balance of {formatCurrency(accountBalance.available_balance, 'GHS')}.
                  Please consider replenishing or using a different account.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AddExpense;