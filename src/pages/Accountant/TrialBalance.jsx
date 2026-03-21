// pages/Accountant/TrialBalance.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalculatorIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const TrialBalance = () => {
  const [loading, setLoading] = useState(true);
  const [trialBalance, setTrialBalance] = useState(null);
  const [asAt, setAsAt] = useState(new Date().toISOString().split('T')[0]);
  const [groupByType, setGroupByType] = useState(true);
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrialBalance();
  }, [asAt]);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountantService.getTrialBalance(asAt);
      console.log('📊 Trial Balance Data from API:', data);
      
      // Log the accounts to verify data structure
      if (data.accounts) {
        console.log('First few accounts:', data.accounts.slice(0, 3));
        // Calculate totals manually to verify
        const manualDebits = data.accounts.reduce((sum, acc) => sum + (acc.debit || 0), 0);
        const manualCredits = data.accounts.reduce((sum, acc) => sum + (acc.credit || 0), 0);
        console.log('Manual calculation - Debits:', manualDebits, 'Credits:', manualCredits);
      }
      
      setTrialBalance(data);
    } catch (error) {
      console.error('❌ Error fetching trial balance:', error);
      setError('Failed to load trial balance');
      toast.error('Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!trialBalance?.accounts) return;

    try {
      const headers = ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit'];
      const rows = trialBalance.accounts
        .filter(acc => showZeroBalances || acc.debit !== 0 || acc.credit !== 0)
        .map(acc => [
          acc.code,
          acc.name,
          acc.type,
          acc.debit ? acc.debit.toFixed(2) : '',
          acc.credit ? acc.credit.toFixed(2) : ''
        ]);

      const csvContent = [
        `Trial Balance as at ${formatDate(asAt)}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trial_balance_${asAt}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Trial balance exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export trial balance');
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'ASSET':
        return <BanknotesIcon className="h-5 w-5 text-blue-600" />;
      case 'LIABILITY':
        return <BriefcaseIcon className="h-5 w-5 text-orange-600" />;
      case 'EQUITY':
        return <ScaleIcon className="h-5 w-5 text-purple-600" />;
      case 'REVENUE':
        return <CurrencyDollarIcon className="h-5 w-5 text-green-600" />;
      case 'EXPENSE':
        return <CurrencyDollarIcon className="h-5 w-5 text-red-600" />;
      default:
        return <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'ASSET': return 'text-blue-600 bg-blue-50';
      case 'LIABILITY': return 'text-orange-600 bg-orange-50';
      case 'EQUITY': return 'text-purple-600 bg-purple-50';
      case 'REVENUE': return 'text-green-600 bg-green-50';
      case 'EXPENSE': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Trial Balance</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchTrialBalance}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group accounts by type
  const accountsByType = {};
  if (trialBalance?.accounts) {
    trialBalance.accounts.forEach(acc => {
      if (!accountsByType[acc.type]) {
        accountsByType[acc.type] = [];
      }
      accountsByType[acc.type].push(acc);
    });
  }

  // Calculate totals by type - only sum the appropriate column
  const typeTotals = {};
  Object.keys(accountsByType).forEach(type => {
    typeTotals[type] = {
      debit: accountsByType[type].reduce((sum, acc) => sum + (acc.debit || 0), 0),
      credit: accountsByType[type].reduce((sum, acc) => sum + (acc.credit || 0), 0)
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trial Balance</h1>
            <p className="mt-2 text-sm text-gray-600">
              Verify that total debits equal total credits
            </p>
            <p className="text-xs text-gray-400 mt-1">
              As at {formatDate(asAt)}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleExport}
              disabled={!trialBalance?.accounts?.length}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
            <button
              onClick={fetchTrialBalance}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                As at Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={asAt}
                  onChange={(e) => setAsAt(e.target.value)}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="groupByType"
                checked={groupByType}
                onChange={(e) => setGroupByType(e.target.checked)}
                className="h-4 w-4 text-green-600 rounded"
              />
              <label htmlFor="groupByType" className="ml-2 text-sm text-gray-700">
                Group by account type
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showZeroBalances"
                checked={showZeroBalances}
                onChange={(e) => setShowZeroBalances(e.target.checked)}
                className="h-4 w-4 text-green-600 rounded"
              />
              <label htmlFor="showZeroBalances" className="ml-2 text-sm text-gray-700">
                Show zero balance accounts
              </label>
            </div>
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <span className="text-gray-500">Total Accounts: </span>
                <span className="font-medium">{trialBalance?.accounts?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Debits</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(trialBalance?.totalDebits || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Assets + Expenses
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Credits</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(trialBalance?.totalCredits || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Liabilities + Equity + Revenue
            </p>
          </div>
          <div className={`bg-white rounded-xl shadow-sm p-4 border ${trialBalance?.isBalanced ? 'border-green-200' : 'border-red-200'}`}>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className={`text-lg font-bold ${trialBalance?.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {trialBalance?.isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
            </p>
            {!trialBalance?.isBalanced && (
              <p className="text-xs text-red-500 mt-1">
                Difference: {formatCurrency(Math.abs(trialBalance?.difference || 0))}
              </p>
            )}
          </div>
        </div>

        {/* Trial Balance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit (GHS)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit (GHS)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupByType ? (
                  // Grouped by type
                  Object.entries(accountsByType).map(([type, accounts]) => (
                    <React.Fragment key={type}>
                      {/* Type Header */}
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="px-6 py-2">
                          <div className="flex items-center">
                            {getTypeIcon(type)}
                            <span className={`ml-2 text-sm font-semibold ${getTypeColor(type).split(' ')[0]}`}>
                              {type} ACCOUNTS
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({accounts.length} accounts)
                            </span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Accounts */}
                      {accounts
                        .filter(acc => showZeroBalances || acc.debit !== 0 || acc.credit !== 0)
                        .sort((a, b) => a.code.localeCompare(b.code))
                        .map((account, index) => (
                        <motion.tr
                          key={account.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                            {account.code}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900">
                            {account.name}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(account.type)}`}>
                              {account.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-mono text-green-600">
                            {account.debit ? formatCurrency(account.debit) : '-'}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-mono text-red-600">
                            {account.credit ? formatCurrency(account.credit) : '-'}
                          </td>
                        </motion.tr>
                      ))}
                      
                      {/* Type Total */}
                      {typeTotals[type] && (typeTotals[type].debit !== 0 || typeTotals[type].credit !== 0) && (
                        <tr className="bg-gray-100 font-medium">
                          <td colSpan="3" className="px-6 py-2 text-sm text-right text-gray-700">
                            Total {type}:
                          </td>
                          <td className="px-6 py-2 text-sm text-right text-green-600">
                            {typeTotals[type].debit ? formatCurrency(typeTotals[type].debit) : '-'}
                          </td>
                          <td className="px-6 py-2 text-sm text-right text-red-600">
                            {typeTotals[type].credit ? formatCurrency(typeTotals[type].credit) : '-'}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  // Flat list (not grouped)
                  trialBalance?.accounts
                    ?.filter(acc => showZeroBalances || acc.debit !== 0 || acc.credit !== 0)
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map((account, index) => (
                    <motion.tr
                      key={account.id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                        {account.code}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {account.name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(account.type)}`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-mono text-green-600">
                        {account.debit ? formatCurrency(account.debit) : '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-mono text-red-600">
                        {account.credit ? formatCurrency(account.credit) : '-'}
                      </td>
                    </motion.tr>
                  ))
                )}

                {/* Grand Total Row */}
                <tr className="bg-gray-200 font-bold">
                  <td colSpan="3" className="px-6 py-3 text-sm text-right text-gray-900">
                    GRAND TOTAL
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-green-700">
                    {formatCurrency(trialBalance?.totalDebits || 0)}
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-red-700">
                    {formatCurrency(trialBalance?.totalCredits || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-800 text-green-400 rounded-lg text-xs font-mono">
            <p>API Total Debits: {trialBalance?.totalDebits}</p>
            <p>API Total Credits: {trialBalance?.totalCredits}</p>
            <p>API Balanced: {trialBalance?.isBalanced ? 'Yes' : 'No'}</p>
            <p>Accounts Count: {trialBalance?.accounts?.length}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialBalance;