// pages/Accountant/Reconciliation.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  DocumentTextIcon,
  WalletIcon,
  ReceiptPercentIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Reconciliation = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountType, setAccountType] = useState('bank');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAccountDetails, setSelectedAccountDetails] = useState(null);
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reconciledBalance, setReconciledBalance] = useState(0);
  const [difference, setDifference] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);

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
      
      const accountsList = response.accounts || [];
      setAccounts(accountsList);
      
      if (accountsList.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsList[0].id);
        setSelectedAccountDetails(accountsList[0]);
        // Set book balance from account balance
        setBookBalance(accountsList[0].balance || 0);
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
        asOf: reconciliationDate
      };

      const response = await accountantService.getReconciliationData(params);
      const data = response.data || response;
      
      // Update account details with latest balance
      if (data.account) {
        setSelectedAccountDetails(data.account);
        setBookBalance(data.account.current_balance || data.account.balance || bookBalance);
      }
      
      setStatementBalance(data.statementBalance || data.bankBalance || 0);
      
      // Process transactions
      const rawTransactions = data.transactions || data.items || data.unreconciled_items || [];
      const processedTransactions = rawTransactions.map(t => ({
        id: t.id,
        date: t.date || t.transactionDate || t.entry_date,
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
        !t.reconciled && t.amount > 0 && t.type === 'deposit'
      );
      
      const outstandingChecks = processedTransactions.filter(t => 
        !t.reconciled && t.amount < 0
      );
      
      setOutstandingItems({
        depositsInTransit,
        outstandingChecks,
        bankErrors: data.bankErrors || [],
        bookErrors: data.bookErrors || []
      });
      
      setReconciledItems(data.reconciledItems || processedTransactions.filter(t => t.reconciled));
      setAdjustments(data.differences || data.adjustments || []);
      
      calculateSummary(processedTransactions, data.differences || []);
      calculateReconciliation();
      
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
        accountId: selectedAccount
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
    if (transaction.type === 'petty_cash') return 'petty_cash';
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

  const calculateReconciliation = () => {
    let balance = bookBalance;
    balance += outstandingItems.depositsInTransit.reduce((sum, d) => sum + d.amount, 0);
    balance -= outstandingItems.outstandingChecks.reduce((sum, c) => sum + Math.abs(c.amount), 0);
    balance += adjustments.reduce((sum, a) => sum + a.amount, 0);
    
    setReconciledBalance(balance);
    const diff = statementBalance - balance;
    setDifference(diff);
    setIsBalanced(Math.abs(diff) < 0.01);
  };

  const handleReconcile = async (transactionId) => {
    try {
      setSubmitting(true);
      await accountantService.reconcileTransaction(transactionId, {
        reconciliationDate
      });
      
      setTransactions(prev =>
        prev.map(t =>
          t.id === transactionId ? { ...t, reconciled: true, cleared: true } : t
        )
      );
      
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        setReconciledItems(prev => [...prev, { ...transaction, reconciled: true }]);
        
        setOutstandingItems(prev => {
          if (transaction.amount > 0) {
            return {
              ...prev,
              depositsInTransit: prev.depositsInTransit.filter(t => t.id !== transactionId)
            };
          } else if (transaction.amount < 0) {
            return {
              ...prev,
              outstandingChecks: prev.outstandingChecks.filter(t => t.id !== transactionId)
            };
          }
          return prev;
        });
      }
      
      calculateReconciliation();
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
      await accountantService.unreconcileTransaction(transactionId);
      
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
          } else if (transaction.amount < 0) {
            return {
              ...prev,
              outstandingChecks: [...prev.outstandingChecks, transaction]
            };
          }
          return prev;
        });
      }
      
      calculateReconciliation();
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
      const journalEntry = {
        entry_date: reconciliationDate,
        description: `${accountType === 'bank' ? 'Bank' : 'Petty Cash'} Adjustment: ${adjustmentData.description}`,
        lines: [
          {
            account_id: selectedAccount,
            description: adjustmentData.description,
            debit: adjustmentData.type === 'addition' ? amount : 0,
            credit: adjustmentData.type === 'addition' ? 0 : amount
          }
        ]
      };

      await accountantService.createJournalEntry(journalEntry);

      setAdjustments(prev => [
        ...prev,
        {
          id: Date.now(),
          description: adjustmentData.description,
          amount: signedAmount,
          side: adjustmentData.side,
          date: reconciliationDate
        }
      ]);

      setShowAdjustmentModal(false);
      setAdjustmentData({ description: '', amount: '', type: 'addition', side: 'bank' });
      toast.success('Adjustment added');
      
      calculateReconciliation();
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

    setShowConfirmModal(true);
  };

  const confirmCompleteReconciliation = async () => {
    try {
      setSubmitting(true);
      
      await accountantService.completeReconciliation({
        accountId: selectedAccount,
        reconciliationDate,
        reconciledItems: reconciledItems.map(i => i.id),
        adjustments,
        statementBalance,
        bookBalance: reconciledBalance,
        closingBalance: reconciledBalance
      });
      
      toast.success('Reconciliation completed successfully');
      setShowConfirmModal(false);
      fetchReconciliationData();
      fetchReconciliationHistory();
      
    } catch (error) {
      console.error('Error completing reconciliation:', error);
      toast.error(error.response?.data?.error || 'Failed to complete reconciliation');
    } finally {
      setSubmitting(false);
    }
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
        {depositsTotal > 0 && (
          <p className="font-mono text-green-600">
            + Deposits in Transit: {formatCurrency(depositsTotal)}
          </p>
        )}
        {checksTotal > 0 && (
          <p className="font-mono text-red-600">
            - Outstanding Checks: {formatCurrency(checksTotal)}
          </p>
        )}
        {adjustmentsTotal !== 0 && (
          <p className="font-mono text-blue-600">
            ± Adjustments: {formatCurrency(adjustmentsTotal)}
          </p>
        )}
        <p className="font-mono font-bold border-t pt-1 mt-1">
          = Reconciled Balance: {formatCurrency(reconciledBalance)}
        </p>
      </div>
    );
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Reconciliation</h1>
            <p className="text-sm text-gray-500 mt-1">
              {accountType === 'bank' 
                ? 'Match bank statements with your books. Identify outstanding checks and deposits in transit.'
                : 'Reconcile petty cash fund. Account for all expenses and reimbursements.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
              History
            </button>
            <button
              onClick={fetchReconciliationData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Account Type Selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setAccountType('bank');
              setSelectedAccount(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              accountType === 'bank'
                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <BuildingOfficeIcon className="h-5 w-5" />
            Bank Accounts
          </button>
          <button
            onClick={() => {
              setAccountType('petty_cash');
              setSelectedAccount(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              accountType === 'petty_cash'
                ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <WalletIcon className="h-5 w-5" />
            Petty Cash
          </button>
        </div>

        {/* Account Selection & Date */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {accountType === 'bank' ? 'Bank Account' : 'Petty Cash Fund'}
              </label>
              <select
                value={selectedAccount || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  setSelectedAccount(id);
                  const account = accounts.find(a => a.id === id);
                  setSelectedAccountDetails(account);
                  if (account) setBookBalance(account.balance || 0);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
              >
                <option value="">Select Account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.accountNumber || account.bank || 'No ref'} 
                    ({formatCurrency(account.balance || 0)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reconciliation Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={reconciliationDate}
                  onChange={(e) => setReconciliationDate(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statement Balance</label>
              <input
                type="number"
                value={statementBalance}
                onChange={(e) => setStatementBalance(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {selectedAccount && (
          <>
            {/* Account Balance Card */}
            {selectedAccountDetails && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Current {accountType === 'bank' ? 'Bank' : 'Petty Cash'} Balance</p>
                    <p className="text-3xl font-bold">{formatCurrency(bookBalance)}</p>
                    <p className="text-xs opacity-75 mt-1">{selectedAccountDetails.name}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    {accountType === 'bank' ? (
                      <BuildingOfficeIcon className="h-8 w-8" />
                    ) : (
                      <WalletIcon className="h-8 w-8" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Balance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Statement Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(statementBalance)}</p>
                <p className="text-xs text-gray-400 mt-2">Per bank statement / cash count</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Book Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(bookBalance)}</p>
                <p className="text-xs text-gray-400 mt-2">Per accounting records</p>
              </div>
              <div className={`bg-white rounded-2xl shadow-sm p-6 border-2 ${
                isBalanced ? 'border-green-500' : 'border-yellow-500'
              }`}>
                <p className="text-sm text-gray-500 mb-1">Reconciled Balance</p>
                <p className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-yellow-600'}`}>
                  {formatCurrency(reconciledBalance)}
                </p>
                {getReconciliationFormula()}
              </div>
            </div>

            {/* Outstanding Items Section */}
            {(outstandingItems.depositsInTransit.length > 0 || 
              outstandingItems.outstandingChecks.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {outstandingItems.depositsInTransit.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                      Deposits in Transit ({outstandingItems.depositsInTransit.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {outstandingItems.depositsInTransit.map(deposit => (
                        <div key={deposit.id} className="flex justify-between text-sm">
                          <span className="text-green-700">{formatDate(deposit.date)} - {deposit.description}</span>
                          <span className="font-medium text-green-700">{formatCurrency(deposit.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {outstandingItems.outstandingChecks.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                      Outstanding Checks ({outstandingItems.outstandingChecks.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {outstandingItems.outstandingChecks.map(check => (
                        <div key={check.id} className="flex justify-between text-sm">
                          <span className="text-red-700">
                            {check.checkNumber ? `#${check.checkNumber} - ` : ''}{check.description}
                          </span>
                          <span className="font-medium text-red-700">{formatCurrency(Math.abs(check.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Adjustments Section */}
            {adjustments.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Adjustments
                </h3>
                <div className="space-y-2">
                  {adjustments.map((adj, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-blue-700">{adj.description}</span>
                      <span className={adj.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {adj.amount > 0 ? '+' : ''}{formatCurrency(adj.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full sm:w-64 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                    >
                      <option value="all">All</option>
                      <option value="reconciled">Reconciled</option>
                      <option value="unreconciled">Unreconciled</option>
                      <option value="checks">Checks</option>
                      <option value="deposits">Deposits</option>
                    </select>
                    <button
                      onClick={() => setShowAdjustmentModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Adjustment
                    </button>
                    {isBalanced && reconciledItems.length > 0 && (
                      <button
                        onClick={handleCompleteReconciliation}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Complete Reconciliation
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
                  <tbody className="bg-white divide-y divide-gray-100">
                    {getFilteredTransactions().length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                          <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No transactions found</p>
                        </td>
                      </tr>
                    ) : (
                      getFilteredTransactions().map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              {transaction.type === 'check' && (
                                <ClipboardDocumentListIcon className="h-4 w-4 text-blue-500" />
                              )}
                              {transaction.type === 'deposit' && (
                                <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                              )}
                              {transaction.type === 'withdrawal' && (
                                <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                              )}
                              {transaction.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                <CheckCircleIcon className="h-3 w-3" />
                                Reconciled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                <ClockIcon className="h-3 w-3" />
                                Outstanding
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowTransactionDetail(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              {transaction.reconciled ? (
                                <button
                                  onClick={() => handleUnreconcile(transaction.id)}
                                  disabled={submitting}
                                  className="p-1 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                  title="Unreconcile"
                                >
                                  <ArrowPathIcon className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReconcile(transaction.id)}
                                  disabled={submitting}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Reconcile"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Adjustment Modal */}
        <AnimatePresence>
          {showAdjustmentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowAdjustmentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Add Adjustment</h2>
                  <button
                    onClick={() => setShowAdjustmentModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={adjustmentData.description}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      placeholder="e.g., Bank fees, Interest, Minor expense"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustmentData.amount}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={adjustmentData.type}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                    >
                      <option value="bank">Bank Statement</option>
                      <option value="book">Books</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowAdjustmentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAdjustment}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Adjustment
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction Detail Modal */}
        <AnimatePresence>
          {showTransactionDetail && selectedTransaction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowTransactionDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                  <button
                    onClick={() => setShowTransactionDetail(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(selectedTransaction.date)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Description:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedTransaction.description}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Reference:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedTransaction.reference || '-'}</span>
                  </div>
                  {selectedTransaction.checkNumber && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Check #:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTransaction.checkNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Amount:</span>
                    <span className={`text-sm font-bold ${selectedTransaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedTransaction.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`text-sm font-medium ${selectedTransaction.reconciled ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedTransaction.reconciled ? 'Reconciled' : 'Outstanding'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowTransactionDetail(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Reconciliation History</h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {reconciliationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {reconciliationHistory.map((item, index) => (
                        <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">{formatDate(item.date)}</span>
                            <span className="text-xs text-gray-500">
                              {item.transactionsCount || 0} transactions reconciled
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
                    <div className="text-center py-8 text-gray-400">
                      <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No reconciliation history found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Complete Reconciliation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Complete Reconciliation</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Are you sure you want to complete this reconciliation? This action will lock the reconciled transactions.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Reconciled Balance:</span>
                    <span className="font-medium text-green-600">{formatCurrency(reconciledBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Statement Balance:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(statementBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-gray-200 mt-1">
                    <span className="text-gray-500">Difference:</span>
                    <span className="font-medium text-green-600">{formatCurrency(0)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmCompleteReconciliation}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Complete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Reconciliation;