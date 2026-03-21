import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalculatorIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import AsyncSelect from 'react-select/async';

const LedgerView = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Check for accountId in URL params
  useEffect(() => {
    const accountId = searchParams.get('accountId');
    if (accountId) {
      loadAccountById(accountId);
    } else {
      setInitialLoading(false);
    }
  }, [searchParams]);

  // Fetch ledger when account is selected or date range changes
  useEffect(() => {
    if (selectedAccount) {
      fetchLedger();
    } else {
      setLedgerData(null);
    }
  }, [selectedAccount, dateRange]);

  const fetchAccounts = async () => {
    try {
      console.log('📋 Fetching accounts...');
      const response = await accountantService.getAccounts();
      console.log('📋 Accounts response:', response);
      
      // Handle different response structures
      let accountsList = [];
      
      if (response.accounts && Array.isArray(response.accounts)) {
        accountsList = response.accounts;
      } else if (response.data?.accounts && Array.isArray(response.data.accounts)) {
        accountsList = response.data.accounts;
      } else if (Array.isArray(response)) {
        accountsList = response;
      } else if (response.flat && Array.isArray(response.flat)) {
        accountsList = response.flat;
      }
      
      console.log('✅ Processed accounts list:', accountsList);
      setAccounts(accountsList);
      setInitialLoading(false);
    } catch (error) {
      console.error('❌ Error fetching accounts:', error);
      setError('Failed to load accounts');
      toast.error('Failed to load accounts');
      setInitialLoading(false);
    }
  };

  const loadAccountById = async (accountId) => {
    try {
      console.log('🔍 Loading account by ID:', accountId);
      
      // Try to get account from already loaded accounts
      const accountFromList = accounts.find(a => a.id === parseInt(accountId));
      
      if (accountFromList) {
        console.log('✅ Account found in list:', accountFromList);
        setSelectedAccount({
          value: accountFromList.id,
          label: `${accountFromList.code || accountFromList.account_code} - ${accountFromList.name}`,
          code: accountFromList.code || accountFromList.account_code,
          type: accountFromList.type || accountFromList.account_type,
        });
        setInitialLoading(false);
        return;
      }
      
      // If not found, fetch specific account
      const account = await accountantService.getAccount(parseInt(accountId));
      
      if (account) {
        console.log('✅ Account fetched by ID:', account);
        setSelectedAccount({
          value: account.id,
          label: `${account.code || account.account_code} - ${account.name}`,
          code: account.code || account.account_code,
          type: account.type || account.account_type,
        });
      } else {
        console.warn('⚠️ Account not found with ID:', accountId);
      }
      setInitialLoading(false);
    } catch (error) {
      console.error('❌ Error loading account:', error);
      setInitialLoading(false);
    }
  };

  const fetchLedger = async () => {
    if (!selectedAccount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📤 Fetching ledger for account:', {
        accountId: selectedAccount.value,
        accountCode: selectedAccount.code,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const data = await accountantService.getLedger(
        selectedAccount.value,
        dateRange.startDate,
        dateRange.endDate
      );
      
      console.log('📥 Ledger data received:', data);
      
      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received from server');
      }
      
      // Process entries to ensure account codes are included
      const processedEntries = (data.entries || []).map(entry => ({
        ...entry,
        // Ensure we have account code in each entry if available
        accountCode: entry.accountCode || selectedAccount.code,
        accountName: entry.accountName || selectedAccount.label.split(' - ')[1],
      }));
      
      // Ensure we have the expected structure
      const formattedData = {
        entries: processedEntries,
        summary: data.summary || {
          openingBalance: 0,
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: 0
        },
        account: data.account || {
          id: selectedAccount.value,
          code: selectedAccount.code,
          name: selectedAccount.label.split(' - ')[1],
          type: selectedAccount.type
        }
      };
      
      console.log('✅ Formatted ledger data:', formattedData);
      setLedgerData(formattedData);
      
    } catch (error) {
      console.error('❌ Error fetching ledger:', error);
      
      // Better error message based on error type
      let errorMessage = 'Failed to load ledger data';
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setLedgerData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountOptions = async (inputValue) => {
    try {
      // Use accounts from state if available
      if (accounts.length > 0) {
        return accounts
          .filter(acc => {
            const code = acc.code || acc.account_code || '';
            const name = acc.name || '';
            const searchTerm = inputValue.toLowerCase();
            return code.toLowerCase().includes(searchTerm) || 
                   name.toLowerCase().includes(searchTerm);
          })
          .map(acc => ({
            value: acc.id,
            label: `${acc.code || acc.account_code} - ${acc.name}`,
            code: acc.code || acc.account_code,
            type: acc.type || acc.account_type,
          }));
      }
      
      // Fallback to API call
      const response = await accountantService.getAccounts();
      const accountsList = response.accounts || response.data?.accounts || response || [];
      
      return accountsList
        .filter(acc => {
          const code = acc.code || acc.account_code || '';
          const name = acc.name || '';
          const searchTerm = inputValue.toLowerCase();
          return code.toLowerCase().includes(searchTerm) || 
                 name.toLowerCase().includes(searchTerm);
        })
        .map(acc => ({
          value: acc.id,
          label: `${acc.code || acc.account_code} - ${acc.name}`,
          code: acc.code || acc.account_code,
          type: acc.type || acc.account_type,
        }));
    } catch (error) {
      console.error('Error loading accounts:', error);
      return [];
    }
  };

  const handleExport = () => {
    if (!selectedAccount || !ledgerData?.entries?.length) {
      toast.error('No ledger data to export');
      return;
    }
    
    try {
      const accountCode = selectedAccount.code;
      const accountName = selectedAccount.label.split(' - ')[1];
      
      const headers = ['Date', 'Description', 'Reference', 'Account Code', 'Debit', 'Credit', 'Balance'];
      const rows = ledgerData.entries.map(entry => [
        formatDate(entry.date),
        entry.description || '',
        entry.reference || '',
        entry.accountCode || accountCode || '',
        entry.debit ? entry.debit.toFixed(2) : '',
        entry.credit ? entry.credit.toFixed(2) : '',
        entry.balance ? entry.balance.toFixed(2) : '0.00',
      ]);
      
      const csvContent = [
        `Account: ${accountCode} - ${accountName}`,
        `Account Type: ${selectedAccount.type}`,
        `Period: ${dateRange.startDate} to ${dateRange.endDate}`,
        `Opening Balance: ${ledgerData.summary?.openingBalance?.toFixed(2) || '0.00'}`,
        `Closing Balance: ${ledgerData.summary?.closingBalance?.toFixed(2) || '0.00'}`,
        `Total Debits: ${ledgerData.summary?.totalDebit?.toFixed(2) || '0.00'}`,
        `Total Credits: ${ledgerData.summary?.totalCredit?.toFixed(2) || '0.00'}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger_${accountCode}_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Ledger exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export ledger');
    }
  };

  const getAccountTypeColor = (type) => {
    const colors = {
      ASSET: 'text-blue-600 bg-blue-50',
      LIABILITY: 'text-orange-600 bg-orange-50',
      EQUITY: 'text-purple-600 bg-purple-50',
      REVENUE: 'text-green-600 bg-green-50',
      EXPENSE: 'text-red-600 bg-red-50',
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  // Show initial loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">General Ledger</h1>
            <p className="mt-2 text-sm text-gray-600">
              View detailed transaction history for any account
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={handleExport}
              disabled={!ledgerData?.entries?.length}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
            <button
              onClick={fetchLedger}
              disabled={!selectedAccount || loading}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Account <span className="text-red-500">*</span>
                </label>
                <AsyncSelect
                  cacheOptions
                  loadOptions={loadAccountOptions}
                  defaultOptions={accounts.map(acc => ({
                    value: acc.id,
                    label: `${acc.code || acc.account_code} - ${acc.name}`,
                    code: acc.code || acc.account_code,
                    type: acc.type || acc.account_type,
                  }))}
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                  placeholder="Search for an account..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isClearable
                  noOptionsMessage={() => "No accounts found"}
                  isLoading={initialLoading}
                  getOptionLabel={(option) => option.label}
                  getOptionValue={(option) => option.value}
                />
                {selectedAccount && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getAccountTypeColor(selectedAccount.type)}`}>
                      {selectedAccount.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      Code: {selectedAccount.code}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    disabled={loading}
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
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Ledger</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchLedger}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading ledger entries...</p>
          </div>
        )}

        {/* Ledger Content */}
        {!loading && selectedAccount && ledgerData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Account Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Opening Balance</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(ledgerData.summary?.openingBalance || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">As of {dateRange.startDate}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Total Debits</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(ledgerData.summary?.totalDebit || 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Total Credits</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(ledgerData.summary?.totalCredit || 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Closing Balance</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(ledgerData.summary?.closingBalance || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">As of {dateRange.endDate}</p>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <InformationCircleIcon className="h-5 w-5 text-[rgb(31,178,86)]" />
                <span className="text-sm text-gray-600">
                  Account: <span className="font-medium">{ledgerData.account?.code} - {ledgerData.account?.name}</span>
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getAccountTypeColor(ledgerData.account?.type)}`}>
                  {ledgerData.account?.type}
                </span>
              </div>
            </div>

            {/* Ledger Entries Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ledgerData.entries && ledgerData.entries.length > 0 ? (
                      ledgerData.entries.map((entry, index) => (
                        <motion.tr
                          key={entry.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="font-medium">{entry.description || 'No description'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.reference || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                            {entry.accountCode || ledgerData.account?.code || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-green-600">
                            {entry.debit ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-red-600">
                            {entry.credit ? formatCurrency(entry.credit) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-gray-900">
                            {entry.balance ? formatCurrency(entry.balance) : '-'}
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          <CalculatorIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-900 mb-2">No Entries Found</p>
                          <p className="text-sm">No transactions found for this account in the selected date range.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* No Account Selected State */}
        {!loading && !selectedAccount && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <CalculatorIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Account Selected</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Select an account from the dropdown above to view its general ledger entries.
            </p>
            {accounts.length === 0 && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Note:</span> No accounts found in the system. 
                  Please create some accounts first in the Account Management section.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerView;