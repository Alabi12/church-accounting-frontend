// pages/Expenses/EditExpense.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const EditExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
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
  const [originalAmount, setOriginalAmount] = useState(0);
  
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    description: '',
    category: '',
    payment_method: 'cash',
    date: '',
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

  useEffect(() => {
    fetchData();
  }, [id]);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch accounts
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

      // Fetch expense details
      const expenseRes = await api.get(`/expenses/${id}`);
      const expense = expenseRes.data;
      
      setFormData({
        account_id: expense.account_id,
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        payment_method: expense.payment_method || 'cash',
        date: expense.date,
        reference: expense.reference || ''
      });
      
      setOriginalAmount(expense.amount);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load expense details');
      navigate('/expenses');
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
    
    const newAmount = parseFloat(formData.amount);
    const amountDifference = newAmount - originalAmount;
    
    // Only check if the new amount is greater than original
    if (amountDifference > 0) {
      const available = accountBalance.available_balance + originalAmount;
      
      if (newAmount > available) {
        const deficit = newAmount - available;
        setBalanceCheck({
          isSufficient: false,
          checking: false,
          message: `Insufficient funds! Required additional: ${formatCurrency(amountDifference, 'GHS')}, Available: ${formatCurrency(available, 'GHS')}`
        });
        return;
      }
    }
    
    setBalanceCheck({
      isSufficient: true,
      checking: false,
      message: `Sufficient funds available`
    });
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
      newErrors.amount = 'Insufficient funds for this change';
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
      await api.put(`/expenses/${id}`, {
        ...formData,
        amount: parseFloat(formData.amount)
      });

      toast.success('Expense updated successfully');
      navigate('/expenses');
    } catch (error) {
      console.error('Error updating expense:', error);
      
      if (error.response?.status === 402) {
        const details = error.response.data.details;
        toast.error(
          <div className="space-y-1">
            <p className="font-bold">Insufficient Funds!</p>
            <p>Required: {formatCurrency(details.requested_amount, 'GHS')}</p>
            <p>Available: {formatCurrency(details.current_balance, 'GHS')}</p>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(error.response?.data?.error || 'Failed to update expense');
      }
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
        </div>

        {/* Edit Form - Similar to AddExpense but with originalAmount tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Similar form fields as AddExpense */}
            {/* ... (reuse the form fields from AddExpense) ... */}
            
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
                className="px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Updating...
                  </span>
                ) : (
                  'Update Expense'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EditExpense;