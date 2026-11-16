// pages/Accountant/Reconciliation.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  XMarkIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
  LockClosedIcon,
  ChartBarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

// ============================================================
// CONSTANTS
// ============================================================
const RECONCILIATION_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  BALANCED: 'BALANCED',
  COMPLETED: 'COMPLETED',
  LOCKED: 'LOCKED',
};

const ADJUSTMENT_TYPE = {
  ADDITION: 'addition',
  SUBTRACTION: 'subtraction',
};

const ADJUSTMENT_SIDE = {
  BANK: 'bank',
  BOOK: 'book',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const safeParseFloat = (val, fallback = 0) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Professional reconciliation formula:
 *   Reconciled Bank Balance = Statement Balance
 *     - Deposits in Transit (already booked, not on statement → subtract to match books)
 *     + Outstanding Checks (already booked, not on statement → add back)
 *     ± Bank Errors
 *
 *   Reconciled Book Balance = Book Balance
 *     ± Book Errors
 *     + Bank Adjustments (interest, fees not yet recorded)
 */

// ============================================================
// COMPONENT
// ============================================================
const Reconciliation = () => {
  // ---- Core state ----
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountType, setAccountType] = useState('bank');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [reconciliationDate, setReconciliationDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // ---- Reconciliation data ----
  const [accountDetails, setAccountDetails] = useState(null);
  const [bookBalance, setBookBalance] = useState(0);
  const [statementBalance, setStatementBalance] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [reconciliationRecord, setReconciliationRecord] = useState(null);
  const [reconciliationHistory, setReconciliationHistory] = useState([]);

  // ---- UI state ----
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [adjustmentData, setAdjustmentData] = useState({
    description: '',
    amount: '',
    type: ADJUSTMENT_TYPE.ADDITION,
    side: ADJUSTMENT_SIDE.BOOK,
  });

  // ============================================================
  // FETCH: Accounts
  // ============================================================
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountantService.getReconciliationAccounts({
        type: accountType,
      });

      const list = response.accounts || response.data || [];
      setAccounts(list);

      if (list.length > 0) {
        const stillExists = list.some((a) => a.id === selectedAccountId);
        if (!stillExists) {
          setSelectedAccountId(list[0].id);
        }
      } else {
        setSelectedAccountId(null);
        setAccountDetails(null);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error(
        error.response?.data?.error ||
          `Failed to load ${accountType === 'bank' ? 'bank' : 'petty cash'} accounts`
      );
      setAccounts([]);
      setSelectedAccountId(null);
    } finally {
      setLoading(false);
    }
  }, [accountType, selectedAccountId]);

  // ============================================================
  // FETCH: Reconciliation data (transactions + balances)
  // ============================================================
  const fetchReconciliationData = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      setLoading(true);
      const response = await accountantService.getReconciliationData({
        accountId: selectedAccountId,
        asOf: reconciliationDate,
      });

      const data = response.data || response;

      setAccountDetails(data.account || null);
      setBookBalance(
        safeParseFloat(
          data.account?.current_balance ?? data.book_balance ?? data.bookBalance
        )
      );
      setStatementBalance(safeParseFloat(data.statement_balance ?? data.statementBalance));
      setOpeningBalance(safeParseFloat(data.opening_balance ?? data.openingBalance));
      setReconciliationRecord(data.reconciliation || null);

      const rawTx = data.transactions || data.unreconciled_items || data.items || [];
      setTransactions(
        rawTx.map((t) => normalizeTransaction(t))
      );

      setAdjustments(
        (data.adjustments || []).map((a) => normalizeAdjustment(a))
      );
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      toast.error(
        error.response?.data?.error || 'Failed to load reconciliation data'
      );
      setTransactions([]);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, reconciliationDate]);

  // ============================================================
  // FETCH: History
  // ============================================================
  const fetchReconciliationHistory = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const response = await accountantService.getReconciliationHistory({
        accountId: selectedAccountId,
      });
      setReconciliationHistory(response.history || response.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [selectedAccountId]);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchReconciliationData();
      fetchReconciliationHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, reconciliationDate]);

  // ============================================================
  // NORMALIZERS
  // ============================================================
  const normalizeTransaction = (t) => {
    const debit = safeParseFloat(t.debit);
    const credit = safeParseFloat(t.credit);
    const rawAmount = safeParseFloat(t.amount, debit - credit);

    // Determine direction
    let direction = 'debit';
    if (t.direction) {
      direction = t.direction.toLowerCase();
    } else if (credit > 0) {
      direction = 'credit';
    }

    const type =
      t.type ||
      (t.check_number ? 'check' : debit > 0 ? 'deposit' : credit > 0 ? 'withdrawal' : 'other');

    return {
      id: t.id,
      date: t.date || t.transaction_date || t.entry_date,
      description: t.description || t.narration || 'Transaction',
      reference: t.reference || t.reference_number || null,
      checkNumber: t.check_number || null,
      type,
      direction,
      debit: roundToTwo(debit),
      credit: roundToTwo(credit),
      amount: roundToTwo(rawAmount),
      category: t.category || 'General',
      reconciled: Boolean(t.reconciled || t.cleared),
      cleared: Boolean(t.cleared),
      journalEntryId: t.journal_entry_id || t.journalEntryId || null,
      source: t.source || 'journal',
    };
  };

  const normalizeAdjustment = (a) => ({
    id: a.id || `adj-${Date.now()}-${Math.random()}`,
    description: a.description || '',
    amount: roundToTwo(safeParseFloat(a.amount)),
    type: a.type || (safeParseFloat(a.amount) >= 0 ? 'addition' : 'subtraction'),
    side: a.side || 'book',
    date: a.date || reconciliationDate,
    journalEntryId: a.journal_entry_id || null,
  });

  // ============================================================
  // COMPUTED: Outstanding items
  // ============================================================
  const outstandingItems = useMemo(() => {
    const depositsInTransit = transactions.filter(
      (t) => !t.reconciled && t.type === 'deposit'
    );
    const outstandingChecks = transactions.filter(
      (t) => !t.reconciled && t.type === 'check'
    );
    const withdrawals = transactions.filter(
      (t) => !t.reconciled && t.type === 'withdrawal'
    );
    return { depositsInTransit, outstandingChecks, withdrawals };
  }, [transactions]);

  // ============================================================
  // COMPUTED: Professional reconciliation math
  // ============================================================
  const reconciliation = useMemo(() => {
    // ---- BANK SIDE ----
    const bankAdjustments = adjustments.filter((a) => a.side === 'bank');
    const bankAdjustmentsTotal = bankAdjustments.reduce(
      (sum, a) => sum + safeParseFloat(a.amount),
      0
    );

    const depositsInTransitTotal = outstandingItems.depositsInTransit.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    const outstandingChecksTotal = outstandingItems.outstandingChecks.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    // Bank side: Statement + DIT - OC + bank adjustments
    const reconciledBankBalance = roundToTwo(
      statementBalance +
        depositsInTransitTotal -
        outstandingChecksTotal +
        bankAdjustmentsTotal
    );

    // ---- BOOK SIDE ----
    const bookAdjustments = adjustments.filter((a) => a.side === 'book');
    const bookAdjustmentsTotal = bookAdjustments.reduce(
      (sum, a) => sum + safeParseFloat(a.amount),
      0
    );

    const reconciledBookBalance = roundToTwo(bookBalance + bookAdjustmentsTotal);

    // ---- DIFFERENCE ----
    const difference = roundToTwo(reconciledBankBalance - reconciledBookBalance);
    const isBalanced = Math.abs(difference) < 0.01;

    // ---- STATUS ----
    let status = RECONCILIATION_STATUS.NOT_STARTED;
    if (reconciliationRecord?.status === 'COMPLETED') {
      status = RECONCILIATION_STATUS.COMPLETED;
    } else if (transactions.some((t) => t.reconciled)) {
      status = isBalanced
        ? RECONCILIATION_STATUS.BALANCED
        : RECONCILIATION_STATUS.IN_PROGRESS;
    } else if (statementBalance > 0) {
      status = RECONCILIATION_STATUS.IN_PROGRESS;
    }

    const isLocked = reconciliationRecord?.status === 'COMPLETED';

    return {
      reconciledBankBalance,
      reconciledBookBalance,
      difference,
      isBalanced,
      status,
      isLocked,
      depositsInTransitTotal,
      outstandingChecksTotal,
      bankAdjustmentsTotal,
      bookAdjustmentsTotal,
      clearedCount: transactions.filter((t) => t.reconciled).length,
      unclearedCount: transactions.filter((t) => !t.reconciled).length,
    };
  }, [statementBalance, bookBalance, adjustments, outstandingItems, transactions, reconciliationRecord]);

  // ============================================================
  // ACTIONS: Reconcile / Unreconcile
  // ============================================================
  const handleReconcile = async (transactionId) => {
    if (reconciliation.isLocked) {
      toast.error('This reconciliation is locked');
      return;
    }
    try {
      setSubmitting(true);
      await accountantService.reconcileTransaction(transactionId, {
        reconciliationDate,
        accountId: selectedAccountId,
      });
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, reconciled: true, cleared: true } : t
        )
      );
      toast.success('Transaction reconciled');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reconcile transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnreconcile = async (transactionId) => {
    if (reconciliation.isLocked) {
      toast.error('This reconciliation is locked');
      return;
    }
    try {
      setSubmitting(true);
      await accountantService.unreconcileTransaction(transactionId, {
        accountId: selectedAccountId,
      });
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, reconciled: false, cleared: false } : t
        )
      );
      toast.success('Transaction unreconciled');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to unreconcile transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkReconcile = async () => {
    const unreconciledIds = transactions.filter((t) => !t.reconciled).map((t) => t.id);
    if (unreconciledIds.length === 0) {
      toast('All transactions are already reconciled');
      return;
    }
    try {
      setSubmitting(true);
      await accountantService.bulkReconcile({
        accountId: selectedAccountId,
        reconciliationDate,
        transactionIds: unreconciledIds,
      });
      setTransactions((prev) =>
        prev.map((t) => ({ ...t, reconciled: true, cleared: true }))
      );
      toast.success(`${unreconciledIds.length} transactions reconciled`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to bulk reconcile');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // ACTIONS: Adjustments
  // ============================================================
  const handleAddAdjustment = async () => {
    if (!adjustmentData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    const amount = safeParseFloat(adjustmentData.amount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount greater than zero');
      return;
    }

    const signedAmount =
      adjustmentData.type === ADJUSTMENT_TYPE.ADDITION ? amount : -amount;

    try {
      setSubmitting(true);
      const result = await accountantService.createReconciliationAdjustment({
        accountId: selectedAccountId,
        reconciliationDate,
        description: adjustmentData.description,
        amount: signedAmount,
        side: adjustmentData.side,
      });

      setAdjustments((prev) => [
        ...prev,
        normalizeAdjustment({
          id: result.adjustment?.id || `adj-${Date.now()}`,
          description: adjustmentData.description,
          amount: signedAmount,
          type: adjustmentData.type,
          side: adjustmentData.side,
          date: reconciliationDate,
          journal_entry_id: result.adjustment?.journal_entry_id,
        }),
      ]);

      setShowAdjustmentModal(false);
      setAdjustmentData({
        description: '',
        amount: '',
        type: ADJUSTMENT_TYPE.ADDITION,
        side: ADJUSTMENT_SIDE.BOOK,
      });
      toast.success('Adjustment recorded');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAdjustment = async (adjustmentId) => {
    if (reconciliation.isLocked) {
      toast.error('Cannot modify adjustments for a locked reconciliation');
      return;
    }
    try {
      await accountantService.deleteReconciliationAdjustment(adjustmentId);
      setAdjustments((prev) => prev.filter((a) => a.id !== adjustmentId));
      toast.success('Adjustment removed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove adjustment');
    }
  };

  // ============================================================
  // ACTIONS: Complete Reconciliation
  // ============================================================
  const handleCompleteReconciliation = () => {
    if (!reconciliation.isBalanced) {
      toast.error(
        `Cannot complete: Out of balance by ${formatCurrency(
          Math.abs(reconciliation.difference)
        )}`
      );
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmCompleteReconciliation = async () => {
    try {
      setSubmitting(true);
      await accountantService.completeReconciliation({
        accountId: selectedAccountId,
        reconciliationDate,
        openingBalance,
        statementBalance,
        bookBalance,
        reconciledBankBalance: reconciliation.reconciledBankBalance,
        reconciledBookBalance: reconciliation.reconciledBookBalance,
        difference: reconciliation.difference,
        reconciledTransactionIds: transactions
          .filter((t) => t.reconciled)
          .map((t) => t.id),
        adjustmentIds: adjustments.map((a) => a.id),
      });

      toast.success('Reconciliation completed and locked');
      setShowConfirmModal(false);
      await fetchReconciliationData();
      await fetchReconciliationHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete reconciliation');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // ACTIONS: Unlock
  // ============================================================
  const confirmUnlock = async () => {
    if (!unlockReason.trim()) {
      toast.error('Please provide a reason for unlocking');
      return;
    }
    try {
      setSubmitting(true);
      await accountantService.unlockReconciliation({
        accountId: selectedAccountId,
        reconciliationDate,
        reason: unlockReason,
      });
      toast.success('Reconciliation unlocked');
      setShowUnlockModal(false);
      setUnlockReason('');
      await fetchReconciliationData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to unlock reconciliation');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // FILTERED TRANSACTIONS
  // ============================================================
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    if (filter === 'reconciled') list = list.filter((t) => t.reconciled);
    else if (filter === 'unreconciled') list = list.filter((t) => !t.reconciled);
    else if (filter === 'checks') list = list.filter((t) => t.type === 'check');
    else if (filter === 'deposits') list = list.filter((t) => t.type === 'deposit');
    else if (filter === 'withdrawals') list = list.filter((t) => t.type === 'withdrawal');

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q) ||
          t.checkNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, filter, searchTerm]);

  // ============================================================
  // SELECTED ACCOUNT OBJECT
  // ============================================================
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  // ============================================================
  // RENDER HELPERS
  // ============================================================
  const getStatusBadge = () => {
    const map = {
      NOT_STARTED: { label: 'Not Started', cls: 'bg-gray-100 text-gray-700' },
      IN_PROGRESS: { label: 'In Progress', cls: 'bg-yellow-100 text-yellow-700' },
      BALANCED: { label: 'Balanced', cls: 'bg-blue-100 text-blue-700' },
      COMPLETED: { label: 'Completed', cls: 'bg-green-100 text-green-700' },
      LOCKED: { label: 'Locked', cls: 'bg-gray-800 text-white' },
    };
    const s = map[reconciliation.status] || map.NOT_STARTED;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${s.cls}`}>
        {reconciliation.status === 'COMPLETED' && <LockClosedIcon className="h-3 w-3" />}
        {s.label}
      </span>
    );
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  if (loading && !selectedAccountId) return <LoadingSpinner fullScreen />;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Account Reconciliation</h1>
              {getStatusBadge()}
            </div>
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
              onClick={() => {
                fetchReconciliationData();
                fetchReconciliationHistory();
              }}
              disabled={loading || !selectedAccountId}
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
            onClick={() => setAccountType('bank')}
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
            onClick={() => setAccountType('petty_cash')}
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
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(parseInt(e.target.value) || null)}
                disabled={accounts.length === 0}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} — {account.account_code || 'N/A'} (
                    {formatCurrency(account.current_balance || 0)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reconciliation Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={reconciliationDate}
                  onChange={(e) => setReconciliationDate(e.target.value)}
                  disabled={reconciliation.isLocked}
                  className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statement Balance
              </label>
              <input
                type="number"
                value={statementBalance}
                onChange={(e) => setStatementBalance(safeParseFloat(e.target.value))}
                disabled={reconciliation.isLocked}
                step="0.01"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent disabled:bg-gray-50"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {selectedAccountId && (
          <>
            {/* Reconciliation Summary — Professional Format */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Bank Side */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
                  Bank Side Reconciliation
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statement Balance</span>
                    <span className="font-semibold">{formatCurrency(statementBalance)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>+ Deposits in Transit</span>
                    <span>+{formatCurrency(reconciliation.depositsInTransitTotal)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>− Outstanding Checks</span>
                    <span>−{formatCurrency(reconciliation.outstandingChecksTotal)}</span>
                  </div>
                  {reconciliation.bankAdjustmentsTotal !== 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>± Bank Adjustments</span>
                      <span>
                        {reconciliation.bankAdjustmentsTotal >= 0 ? '+' : ''}
                        {formatCurrency(reconciliation.bankAdjustmentsTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-base">
                    <span>= Reconciled Bank Balance</span>
                    <span className="text-blue-700">
                      {formatCurrency(reconciliation.reconciledBankBalance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book Side */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-purple-500" />
                  Book Side Reconciliation
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Book Balance</span>
                    <span className="font-semibold">{formatCurrency(bookBalance)}</span>
                  </div>
                  {reconciliation.bookAdjustmentsTotal !== 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>± Book Adjustments</span>
                      <span>
                        {reconciliation.bookAdjustmentsTotal >= 0 ? '+' : ''}
                        {formatCurrency(reconciliation.bookAdjustmentsTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-base">
                    <span>= Reconciled Book Balance</span>
                    <span className="text-purple-700">
                      {formatCurrency(reconciliation.reconciledBookBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Balance Status Card */}
            <div
              className={`rounded-2xl p-6 mb-6 text-white ${
                reconciliation.isBalanced
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">
                    {reconciliation.isBalanced ? 'Reconciliation Balanced' : 'Out of Balance'}
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(Math.abs(reconciliation.difference))}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {reconciliation.isBalanced
                      ? 'Bank and book sides match — ready to complete'
                      : 'Resolve the difference before completing'}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  {reconciliation.isBalanced ? (
                    <CheckCircleIcon className="h-8 w-8" />
                  ) : (
                    <ExclamationTriangleIcon className="h-8 w-8" />
                  )}
                </div>
              </div>
            </div>

            {/* Outstanding Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {outstandingItems.depositsInTransit.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                    Deposits in Transit ({outstandingItems.depositsInTransit.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {outstandingItems.depositsInTransit.map((d) => (
                      <div key={d.id} className="flex justify-between text-sm">
                        <span className="text-green-700 truncate">
                          {formatDate(d.date)} — {d.description}
                        </span>
                        <span className="font-medium text-green-700 ml-2">
                          {formatCurrency(Math.abs(d.amount))}
                        </span>
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
                    {outstandingItems.outstandingChecks.map((c) => (
                      <div key={c.id} className="flex justify-between text-sm">
                        <span className="text-red-700 truncate">
                          {c.checkNumber ? `#${c.checkNumber} — ` : ''}
                          {c.description}
                        </span>
                        <span className="font-medium text-red-700 ml-2">
                          {formatCurrency(Math.abs(c.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Adjustments Section */}
            {adjustments.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Adjustments ({adjustments.length})
                </h3>
                <div className="space-y-2">
                  {adjustments.map((adj) => (
                    <div key={adj.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="text-blue-700">{adj.description}</span>
                        <span className="ml-2 text-xs text-blue-500">
                          ({adj.side === 'bank' ? 'Bank' : 'Book'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            adj.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                          }
                        >
                          {adj.amount > 0 ? '+' : ''}
                          {formatCurrency(adj.amount)}
                        </span>
                        {!reconciliation.isLocked && (
                          <button
                            onClick={() => handleRemoveAdjustment(adj.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Remove adjustment"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {reconciliation.clearedCount} reconciled · {reconciliation.unclearedCount} outstanding
                    </p>
                  </div>
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
                      <option value="unreconciled">Outstanding</option>
                      <option value="checks">Checks</option>
                      <option value="deposits">Deposits</option>
                      <option value="withdrawals">Withdrawals</option>
                    </select>
                    {!reconciliation.isLocked && (
                      <>
                        <button
                          onClick={() => setShowAdjustmentModal(true)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Adjustment
                        </button>
                        <button
                          onClick={handleBulkReconcile}
                          disabled={submitting || reconciliation.unclearedCount === 0}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-lg hover:bg-[rgb(25,142,69)] transition-colors disabled:opacity-50"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Reconcile All
                        </button>
                      </>
                    )}
                    {reconciliation.isBalanced && reconciliation.status !== 'COMPLETED' && (
                      <button
                        onClick={handleCompleteReconciliation}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <LockClosedIcon className="h-4 w-4" />
                        Complete
                      </button>
                    )}
                    {reconciliation.status === 'COMPLETED' && (
                      <button
                        onClick={() => setShowUnlockModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" />
                        Unlock
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref/Check</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                          <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No transactions found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t, index) => (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(t.date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              {t.type === 'check' && (
                                <ClipboardDocumentListIcon className="h-4 w-4 text-blue-500" />
                              )}
                              {t.type === 'deposit' && (
                                <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                              )}
                              {t.type === 'withdrawal' && (
                                <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                              )}
                              <span className="truncate">{t.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {t.checkNumber || t.reference || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                            {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                            {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {t.reconciled ? (
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
                                  setSelectedTransaction(t);
                                  setShowTransactionDetail(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              {!reconciliation.isLocked &&
                                (t.reconciled ? (
                                  <button
                                    onClick={() => handleUnreconcile(t.id)}
                                    disabled={submitting}
                                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                    title="Unreconcile"
                                  >
                                    <ArrowPathIcon className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReconcile(t.id)}
                                    disabled={submitting}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Reconcile"
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                  </button>
                                ))}
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

        {/* Empty state if no account selected */}
        {!selectedAccountId && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <BanknotesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Selected</h3>
            <p className="text-sm text-gray-500">
              Select a {accountType === 'bank' ? 'bank account' : 'petty cash fund'} to begin reconciliation.
            </p>
          </div>
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

                <div className="bg-blue-50 rounded-lg p-3 mb-4 text-xs text-blue-800 flex gap-2">
                  <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Adjustments create journal entries. Bank-side adjustments affect the bank
                    reconciliation; book-side affect the book balance.
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={adjustmentData.description}
                      onChange={(e) =>
                        setAdjustmentData({ ...adjustmentData, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      placeholder="e.g., Bank service fee, Interest earned"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustmentData.amount}
                      onChange={(e) =>
                        setAdjustmentData({ ...adjustmentData, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={adjustmentData.type}
                        onChange={(e) =>
                          setAdjustmentData({ ...adjustmentData, type: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      >
                        <option value={ADJUSTMENT_TYPE.ADDITION}>Addition (+)</option>
                        <option value={ADJUSTMENT_TYPE.SUBTRACTION}>Subtraction (−)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apply to</label>
                      <select
                        value={adjustmentData.side}
                        onChange={(e) =>
                          setAdjustmentData({ ...adjustmentData, side: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      >
                        <option value={ADJUSTMENT_SIDE.BOOK}>Book Balance</option>
                        <option value={ADJUSTMENT_SIDE.BANK}>Bank Balance</option>
                      </select>
                    </div>
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
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Adjustment'}
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
                  {[
                    ['Date', formatDate(selectedTransaction.date)],
                    ['Description', selectedTransaction.description],
                    ['Reference', selectedTransaction.reference || '-'],
                    ['Check #', selectedTransaction.checkNumber || '-'],
                    ['Type', selectedTransaction.type],
                    ['Debit', formatCurrency(selectedTransaction.debit)],
                    ['Credit', formatCurrency(selectedTransaction.credit)],
                    ['Status', selectedTransaction.reconciled ? 'Reconciled' : 'Outstanding'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-sm text-gray-500">{label}:</span>
                      <span className="text-sm font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
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
                              {item.transactionsCount || 0} reconciled
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Opening:</span>
                              <span className="ml-1 font-medium">
                                {formatCurrency(item.openingBalance)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Closing:</span>
                              <span className="ml-1 font-medium">
                                {formatCurrency(item.closingBalance)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Statement:</span>
                              <span className="ml-1 font-medium">
                                {formatCurrency(item.statementBalance)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Difference:</span>
                              <span
                                className={`ml-1 font-medium ${
                                  item.difference === 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
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

        {/* Confirm Complete Modal */}
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
                    <LockClosedIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Complete Reconciliation</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    This will lock all reconciled transactions. Unlocking requires an administrator.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reconciled Bank:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(reconciliation.reconciledBankBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reconciled Book:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(reconciliation.reconciledBookBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                    <span className="text-gray-500">Difference:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(reconciliation.difference)}
                    </span>
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
                    {submitting ? 'Processing...' : 'Lock & Complete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unlock Modal */}
        <AnimatePresence>
          {showUnlockModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowUnlockModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Unlock Reconciliation</h2>
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="bg-orange-50 rounded-lg p-3 mb-4 text-xs text-orange-800 flex gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>Unlocking will be logged in the audit trail.</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for unlocking
                  </label>
                  <textarea
                    value={unlockReason}
                    onChange={(e) => setUnlockReason(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                    placeholder="e.g., Correcting a miscoded transaction..."
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUnlock}
                    disabled={submitting || !unlockReason.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Unlocking...' : 'Unlock'}
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