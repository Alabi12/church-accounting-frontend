// pages/Accountant/Reconciliation.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  EyeIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';  // Updated import
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Reconciliation = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountType, setAccountType] = useState('bank');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [reconciliationDate, setReconciliationDate] = useState(new Date().toISOString().split('T')[0]);
  const [statementBalance, setStatementBalance] = useState(0);
  const [bookBalance, setBookBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [reconciledItems, setReconciledItems] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [outstandingItems, setOutstandingItems] = useState({
    depositsInTransit: [],
    outstandingChecks: [],
    bankErrors: [],
    bookErrors: []
  });
  const [reconciliationHistory, setReconciliationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    description: '',
    amount: '',
    type: 'addition',
    side: 'bank'
  });
  const [reconciliationSummary, setReconciliationSummary] = useState({
    previousBalance: 0,
    clearedDebits: 0,
    clearedCredits: 0,
    unclearedDebits: 0,
    unclearedCredits: 0,
    adjustments: 0
  });

  useEffect(() => {
    fetchAccounts();
  }, [accountType]);

  useEffect(() => {
    if (selectedAccount) {
      fetchReconciliationData();
      fetchReconciliationHistory();
    }
  }, [selectedAccount, reconciliationDate]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      let response;
      
      if (accountType === 'bank') {
        response = await accountantService.getBankAccounts();
      } else {
        response = await accountantService.getPettyCashAccounts();
      }
      
      setAccounts(response.accounts || []);
      
      if (response.accounts?.length > 0 && !selectedAccount) {
        setSelectedAccount(response.accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error(`Failed to load ${accountType === 'bank' ? 'bank' : 'petty cash'} accounts`);
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliationData = async () => {
    try {
      setLoading(true);
      
      const params = {
        accountId: selectedAccount,
        accountType: accountType,
        asOf: reconciliationDate
      };

      const response = await accountantService.getReconciliationData(params);
      
      // Handle different response structures
      const data = response.data || response;
      
      // Set balances
      setStatementBalance(data.statementBalance || data.bankBalance || 0);
      setBookBalance(data.bookBalance || data.ledgerBalance || 0);
      
      // Process transactions
      const rawTransactions = data.transactions || data.items || [];
      const processedTransactions = rawTransactions.map(t => ({
        id: t.id,
        date: t.date || t.transactionDate,
        description: t.description || t.narration || 'Transaction',
        reference: t.reference || t.referenceNumber || t.checkNumber,
        checkNumber: t.checkNumber,
        type: determineTransactionType(t),
        amount: parseFloat(t.amount || t.debit || t.credit || 0),
        category: t.category || t.type || 'General',
        reconciled: t.reconciled || t.isReconciled || false,
        cleared: t.cleared || t.reconciled || false
      }));
      
      setTransactions(processedTransactions);
      
      // Categorize outstanding items
      const depositsInTransit = processedTransactions.filter(t => 
        !t.reconciled && t.amount > 0
      );
      
      const outstandingChecks = processedTransactions.filter(t => 
        !t.reconciled && t.amount < 0 && t.type === 'check'
      );
      
      setOutstandingItems({
        depositsInTransit,
        outstandingChecks,
        bankErrors: data.bankErrors || [],
        bookErrors: data.bookErrors || []
      });
      
      // Set reconciled items
      setReconciledItems(data.reconciledItems || processedTransactions.filter(t => t.reconciled));
      
      // Set adjustments
      setAdjustments(data.differences || data.adjustments || []);
      
      // Calculate summary
      calculateSummary(processedTransactions, data.differences || []);
      
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliationHistory = async () => {
    try {
      const response = await accountantService.getReconciliationHistory({
        accountId: selectedAccount,
        accountType
      });
      setReconciliationHistory(response.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const determineTransactionType = (transaction) => {
    if (transaction.type === 'check' || transaction.checkNumber) return 'check';
    if (transaction.amount > 0) return 'deposit';
    if (transaction.amount < 0) return 'withdrawal';
    if (transaction.type === 'fee') return 'fee';
    return transaction.type || 'other';
  };

  const calculateSummary = (transactions, adjustments) => {
    const cleared = transactions.filter(t => t.reconciled);
    const uncleared = transactions.filter(t => !t.reconciled);
    
    setReconciliationSummary({
      previousBalance: bookBalance - cleared.reduce((sum, t) => sum + t.amount, 0),
      clearedDebits: cleared.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      clearedCredits: cleared.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
      unclearedDebits: uncleared.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      unclearedCredits: uncleared.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
      adjustments: adjustments.reduce((sum, a) => sum + a.amount, 0)
    });
  };

  const handleReconcile = async (transactionId) => {
    try {
      setSubmitting(true);
      await accountantService.reconcileTransaction(transactionId, {
        reconciliationDate,
        accountType
      });
      
      // Update local state
      setTransactions(prev =>
        prev.map(t =>
          t.id === transactionId ? { ...t, reconciled: true, cleared: true } : t
        )
      );
      
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        setReconciledItems(prev => [...prev, { ...transaction, reconciled: true }]);
        
        // Remove from outstanding items
        setOutstandingItems(prev => {
          if (transaction.amount > 0) {
            return {
              ...prev,
              depositsInTransit: prev.depositsInTransit.filter(t => t.id !== transactionId)
            };
          } else if (transaction.type === 'check') {
            return {
              ...prev,
              outstandingChecks: prev.outstandingChecks.filter(t => t.id !== transactionId)
            };
          }
          return prev;
        });
      }
      
      toast.success('Transaction reconciled');
    } catch (error) {
      console.error('Error reconciling transaction:', error);
      toast.error(error.response?.data?.error || 'Failed to reconcile transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnreconcile = async (transactionId) => {
    try {
      setSubmitting(true);
      await accountantService.unreconcileTransaction(transactionId, { accountType });
      
      setTransactions(prev =>
        prev.map(t =>
          t.id === transactionId ? { ...t, reconciled: false, cleared: false } : t
        )
      );
      
      setReconciledItems(prev => prev.filter(i => i.id !== transactionId));
      
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        setOutstandingItems(prev => {
          if (transaction.amount > 0) {
            return {
              ...prev,
              depositsInTransit: [...prev.depositsInTransit, transaction]
            };
          } else if (transaction.type === 'check') {
            return {
              ...prev,
              outstandingChecks: [...prev.outstandingChecks, transaction]
            };
          }
          return prev;
        });
      }
      
      toast.success('Transaction unreconciled');
    } catch (error) {
      console.error('Error unreconciling transaction:', error);
      toast.error(error.response?.data?.error || 'Failed to unreconcile transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdjustment = async () => {
    if (!adjustmentData.description || !adjustmentData.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(adjustmentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const signedAmount = adjustmentData.type === 'addition' ? amount : -amount;

    try {
      // Create journal entry for adjustment
      const journalEntry = {
        date: reconciliationDate,
        description: `${accountType === 'bank' ? 'Bank' : 'Petty Cash'} Adjustment: ${adjustmentData.description}`,
        accountId: selectedAccount,
        entries: [
          {
            accountId: selectedAccount,
            description: adjustmentData.description,
            debit: adjustmentData.type === 'addition' ? amount : 0,
            credit: adjustmentData.type === 'addition' ? 0 : amount
          }
        ]
      };

      await accountantService.createAdjustmentEntry(journalEntry);

      setAdjustments(prev => [
        ...prev,
        {
          description: adjustmentData.description,
          amount: signedAmount,
          side: adjustmentData.side,
          date: reconciliationDate
        }
      ]);

      setShowAdjustmentModal(false);
      setAdjustmentData({ description: '', amount: '', type: 'addition', side: 'bank' });
      toast.success('Adjustment added');
      
      fetchReconciliationData();
    } catch (error) {
      console.error('Error adding adjustment:', error);
      toast.error(error.response?.data?.error || 'Failed to add adjustment');
    }
  };

  const handleCompleteReconciliation = async () => {
    if (!isBalanced) {
      toast.error('Cannot complete reconciliation: Balances do not match');
      return;
    }

    try {
      setSubmitting(true);
      
      await accountantService.completeReconciliation({
        accountId: selectedAccount,
        accountType,
        reconciliationDate,
        reconciledItems: reconciledItems.map(i => i.id),
        adjustments,
        statementBalance,
        bookBalance: reconciledBalance
      });
      
      toast.success('Reconciliation completed');
      fetchReconciliationData();
      fetchReconciliationHistory();
      
    } catch (error) {
      console.error('Error completing reconciliation:', error);
      toast.error(error.response?.data?.error || 'Failed to complete reconciliation');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateReconciledBalance = () => {
    let balance = bookBalance;
    balance += outstandingItems.depositsInTransit.reduce((sum, d) => sum + d.amount, 0);
    balance -= outstandingItems.outstandingChecks.reduce((sum, c) => sum + Math.abs(c.amount), 0);
    balance += adjustments.reduce((sum, a) => sum + a.amount, 0);
    return balance;
  };

  const getReconciliationFormula = () => {
    const depositsTotal = outstandingItems.depositsInTransit.reduce((sum, d) => sum + d.amount, 0);
    const checksTotal = outstandingItems.outstandingChecks.reduce((sum, c) => sum + Math.abs(c.amount), 0);
    const adjustmentsTotal = adjustments.reduce((sum, a) => sum + a.amount, 0);
    
    return (
      <div className="text-xs space-y-1 mt-2 p-2 bg-gray-50 rounded">
        <p className="font-mono">
          Book Balance: {formatCurrency(bookBalance)}
        </p>
        <p className="font-mono text-green-600">
          + Deposits in Transit: {formatCurrency(depositsTotal)}
        </p>
        <p className="font-mono text-red-600">
          - Outstanding Checks: {formatCurrency(checksTotal)}
        </p>
        <p className="font-mono text-blue-600">
          ± Adjustments: {formatCurrency(adjustmentsTotal)}
        </p>
        <p className="font-mono font-bold border-t pt-1 mt-1">
          = Reconciled Balance: {formatCurrency(reconciledBalance)}
        </p>
      </div>
    );
  };

  const reconciledBalance = calculateReconciledBalance();
  const isBalanced = Math.abs(reconciledBalance - statementBalance) < 0.01;
  const difference = statementBalance - reconciledBalance;

  const getFilteredTransactions = () => {
    let filtered = transactions;

    if (filter === 'reconciled') {
      filtered = filtered.filter(t => t.reconciled);
    } else if (filter === 'unreconciled') {
      filtered = filtered.filter(t => !t.reconciled);
    } else if (filter === 'checks') {
      filtered = filtered.filter(t => t.type === 'check');
    } else if (filter === 'deposits') {
      filtered = filtered.filter(t => t.type === 'deposit');
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.checkNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  if (loading && !selectedAccount) return <LoadingSpinner fullScreen />;


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {accountType === 'bank' ? 'Bank' : 'Petty Cash'} Reconciliation
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {accountType === 'bank' 
                ? 'Match bank statement with your books. Identify outstanding checks and deposits in transit.'
                : 'Reconcile petty cash fund. Account for all expenses and reimbursements.'}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
              History
            </button>
            <button
              onClick={fetchReconciliationData}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Account Type Selector */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setAccountType('bank')}
            className={`px-4 py-2 rounded-lg flex items-center ${
              accountType === 'bank'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            Bank Accounts
          </button>
          <button
            onClick={() => setAccountType('petty_cash')}
            className={`px-4 py-2 rounded-lg flex items-center ${
              accountType === 'petty_cash'
                ? 'bg-green-100 text-green-700 border-2 border-green-500'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <BanknotesIcon className="h-5 w-5 mr-2" />
            Petty Cash
          </button>
        </div>

        {/* Account Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {accountType === 'bank' ? 'Bank Account' : 'Petty Cash Fund'}
              </label>
              <select
                value={selectedAccount || ''}
                onChange={(e) => setSelectedAccount(parseInt(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.accountNumber || account.bank || 'No ref'} 
                    ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statement Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={reconciliationDate}
                  onChange={(e) => setReconciliationDate(e.target.value)}
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statement Balance
              </label>
              <input
                type="number"
                value={statementBalance}
                onChange={(e) => setStatementBalance(parseFloat(e.target.value) || 0)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowAdjustmentModal(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Adjustment
              </button>
            </div>
          </div>
        </div>

        {selectedAccount && (
          <>
            {/* Balance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Statement Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(statementBalance)}</p>
                <p className="text-xs text-gray-500 mt-2">Per bank statement / cash count</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Book Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(bookBalance)}</p>
                <p className="text-xs text-gray-500 mt-2">Per accounting records</p>
              </div>
              <div className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                isBalanced ? 'border-green-500' : 'border-yellow-500'
              }`}>
                <p className="text-sm text-gray-500 mb-1">Reconciled Balance</p>
                <p className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-yellow-600'}`}>
                  {formatCurrency(reconciledBalance)}
                </p>
                {getReconciliationFormula()}
              </div>
            </div>

            {/* Outstanding Items */}
            {(outstandingItems.depositsInTransit.length > 0 || 
              outstandingItems.outstandingChecks.length > 0 ||
              outstandingItems.bankErrors.length > 0 ||
              outstandingItems.bookErrors.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {outstandingItems.depositsInTransit.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-2" />
                      Deposits in Transit ({outstandingItems.depositsInTransit.length})
                    </h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {outstandingItems.depositsInTransit.map(deposit => (
                        <div key={deposit.id} className="flex justify-between text-xs text-green-700">
                          <span>{formatDate(deposit.date)} - {deposit.description}</span>
                          <span>{formatCurrency(deposit.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {outstandingItems.outstandingChecks.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                      Outstanding Checks ({outstandingItems.outstandingChecks.length})
                    </h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {outstandingItems.outstandingChecks.map(check => (
                        <div key={check.id} className="flex justify-between text-xs text-red-700">
                          <span>#{check.checkNumber} - {check.description}</span>
                          <span>{formatCurrency(Math.abs(check.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {outstandingItems.bankErrors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Bank Errors</h3>
                    <div className="space-y-1">
                      {outstandingItems.bankErrors.map((error, i) => (
                        <div key={i} className="text-xs text-yellow-700">
                          {error.description}: {formatCurrency(error.amount)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {outstandingItems.bookErrors.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Book Errors</h3>
                    <div className="space-y-1">
                      {outstandingItems.bookErrors.map((error, i) => (
                        <div key={i} className="text-xs text-blue-700">
                          {error.description}: {formatCurrency(error.amount)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Adjustments */}
            {adjustments.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Adjustments</h3>
                <div className="space-y-1">
                  {adjustments.map((adj, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-blue-700">{adj.description}</span>
                      <span className={adj.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(adj.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
                  <div className="flex space-x-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-40 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="reconciled">Reconciled</option>
                      <option value="unreconciled">Unreconciled</option>
                      <option value="checks">Checks</option>
                      <option value="deposits">Deposits</option>
                    </select>
                    {isBalanced && reconciledItems.length > 0 && (
                      <button
                        onClick={handleCompleteReconciliation}
                        disabled={submitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref/Check #</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredTransactions().map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center">
                            {transaction.type === 'check' && (
                              <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600 mr-2" />
                            )}
                            {transaction.type === 'deposit' && (
                              <ArrowTrendingDownIcon className="h-4 w-4 text-green-600 mr-2" />
                            )}
                            {transaction.type === 'withdrawal' && (
                              <ArrowTrendingUpIcon className="h-4 w-4 text-red-600 mr-2" />
                            )}
                            {transaction.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.checkNumber || transaction.reference || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                          {transaction.amount > 0 ? formatCurrency(transaction.amount) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          {transaction.amount < 0 ? formatCurrency(Math.abs(transaction.amount)) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {transaction.reconciled ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Reconciled
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Outstanding
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowTransactionDetail(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {transaction.reconciled ? (
                              <button
                                onClick={() => handleUnreconcile(transaction.id)}
                                disabled={submitting}
                                className="text-yellow-600 hover:text-yellow-700"
                              >
                                <ArrowPathIcon className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReconcile(transaction.id)}
                                disabled={submitting}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Adjustment Modal */}
        {showAdjustmentModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Add Adjustment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={adjustmentData.description}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, description: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={accountType === 'bank' ? 'Bank fees, Interest, etc.' : 'Minor expense, Replenishment'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustmentData.amount}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={adjustmentData.type}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="addition">Addition (+)</option>
                    <option value="subtraction">Subtraction (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apply to</label>
                  <select
                    value={adjustmentData.side}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, side: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bank">Bank Statement</option>
                    <option value="book">Books</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAdjustment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Adjustment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Detail Modal */}
        {showTransactionDetail && selectedTransaction && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h2>
              
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-24 text-sm text-gray-500">Date:</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedTransaction.date)}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-500">Description:</span>
                  <span className="text-sm text-gray-900">{selectedTransaction.description}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-500">Reference:</span>
                  <span className="text-sm text-gray-900">{selectedTransaction.reference || '-'}</span>
                </div>
                {selectedTransaction.checkNumber && (
                  <div className="flex">
                    <span className="w-24 text-sm text-gray-500">Check #:</span>
                    <span className="text-sm text-gray-900">{selectedTransaction.checkNumber}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="w-24 text-sm text-gray-500">Amount:</span>
                  <span className={`text-sm font-medium ${
                    selectedTransaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 text-sm text-gray-500">Status:</span>
                  <span className="text-sm">
                    {selectedTransaction.reconciled ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Reconciled
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        Outstanding
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTransactionDetail(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Reconciliation History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {reconciliationHistory.length > 0 ? (
                <div className="space-y-4">
                  {reconciliationHistory.map((item, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{formatDate(item.date)}</span>
                        <span className="text-xs text-gray-500">
                          {item.transactionsCount} transactions
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Opening:</span>
                          <span className="ml-1 font-medium">{formatCurrency(item.openingBalance)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Closing:</span>
                          <span className="ml-1 font-medium">{formatCurrency(item.closingBalance)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Statement:</span>
                          <span className="ml-1 font-medium">{formatCurrency(item.statementBalance)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Difference:</span>
                          <span className={`ml-1 font-medium ${item.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(item.difference)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No reconciliation history found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reconciliation;