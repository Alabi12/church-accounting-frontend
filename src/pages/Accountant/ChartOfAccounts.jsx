// pages/Accountant/ChartOfAccounts.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

// Define the standard chart of accounts structure
export const CHART_OF_ACCOUNTS = {
  REVENUE: [
    { code: '4010', name: 'Tithes', category: 'Income', normal_balance: 'credit' },
    { code: '4020', name: 'Thanks Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4030', name: 'Harvest Proceeds', category: 'Income', normal_balance: 'credit' },
    { code: '4040', name: 'Statutory Income', category: 'Income', normal_balance: 'credit' },
    { code: '4050', name: 'Cemetery Income', category: 'Income', normal_balance: 'credit' },
    { code: '4060', name: 'Special Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4070', name: 'Donations Received', category: 'Income', normal_balance: 'credit' },
    { code: '4080', name: 'Adults\' Normal Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4090', name: 'Junior Youth Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4100', name: 'Children Service Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4110', name: 'Welfare Income', category: 'Income', normal_balance: 'credit' },
    { code: '4120', name: 'Scholarship Income', category: 'Income', normal_balance: 'credit' },
    { code: '4130', name: 'Interest', category: 'Income', normal_balance: 'credit' },
    { code: '4140', name: 'Other Income', category: 'Income', normal_balance: 'credit' },
  ],
  EXPENSE: [
    { code: '5010', name: 'Income Contribution', category: 'Expenses', normal_balance: 'debit' },
    { code: '5020', name: 'Cemetery', category: 'Expenses', normal_balance: 'debit' },
    { code: '5030', name: 'Staff Cost', category: 'Expenses', normal_balance: 'debit' },
    { code: '5040', name: 'Printing and Stationeries', category: 'Expenses', normal_balance: 'debit' },
    { code: '5050', name: 'Transportation', category: 'Expenses', normal_balance: 'debit' },
    { code: '5060', name: 'Utilities', category: 'Expenses', normal_balance: 'debit' },
    { code: '5070', name: 'General Repairs and Maintenance', category: 'Expenses', normal_balance: 'debit' },
    { code: '5080', name: 'Chapel Repairs and Maintenance', category: 'Expenses', normal_balance: 'debit' },
    { code: '5090', name: 'Manse Repairs and Maintenance', category: 'Expenses', normal_balance: 'debit' },
    { code: '5100', name: 'Evangelism Expenses', category: 'Expenses', normal_balance: 'debit' },
    { code: '5110', name: 'Conference and Meetings', category: 'Expenses', normal_balance: 'debit' },
    { code: '5120', name: 'Eucharist', category: 'Expenses', normal_balance: 'debit' },
    { code: '5130', name: 'Donations', category: 'Expenses', normal_balance: 'debit' },
    { code: '5140', name: 'Training and Courses', category: 'Expenses', normal_balance: 'debit' },
    { code: '5150', name: 'Entertainment and Hospitality', category: 'Expenses', normal_balance: 'debit' },
    { code: '5160', name: 'General and Admin. Expenses', category: 'Expenses', normal_balance: 'debit' },
    { code: '5170', name: 'Professional Charges', category: 'Expenses', normal_balance: 'debit' },
    { code: '5180', name: 'Bank Charges', category: 'Expenses', normal_balance: 'debit' },
    { code: '5190', name: 'Harvest Expense', category: 'Expenses', normal_balance: 'debit' },
    { code: '5200', name: 'Sundry Expense', category: 'Expenses', normal_balance: 'debit' },
    { code: '5210', name: 'Depreciation', category: 'Expenses', normal_balance: 'debit' },
  ],
  ASSET: [
    { code: '1010', name: 'Cash', category: 'Current Assets', normal_balance: 'debit' },
    { code: '1020', name: 'Bank', category: 'Current Assets', normal_balance: 'debit' },
    { code: '1030', name: 'Accounts Receivable', category: 'Current Assets', normal_balance: 'debit' },
    { code: '1040', name: 'Stock', category: 'Current Assets', normal_balance: 'debit' },
    { code: '1050', name: 'Investment', category: 'Non-Current Assets', normal_balance: 'debit' },
    { code: '1060', name: 'Tangible Non-Current Assets', category: 'Non-Current Assets', normal_balance: 'debit' },
  ],
  LIABILITY: [
    { code: '2010', name: 'Accounts Payable', category: 'Current Liabilities', normal_balance: 'credit' },
    { code: '2020', name: 'Loans', category: 'Non-Current Liabilities', normal_balance: 'credit' },
    { code: '2030', name: 'Accrued Expense', category: 'Current Liabilities', normal_balance: 'credit' },
  ],
  EQUITY: [
    { code: '3010', name: 'Accumulated Fund', category: 'Equity', normal_balance: 'credit' },
  ],
};

function ChartOfAccounts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedTypes, setExpandedTypes] = useState({
    ASSET: true,
    LIABILITY: true,
    EQUITY: true,
    REVENUE: true,
    EXPENSE: true
  });
  const [seedDialog, setSeedDialog] = useState({ isOpen: false });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, accountId: null, accountName: '' });
  const [statusDialog, setStatusDialog] = useState({ isOpen: false, accountId: null, accountName: '', currentStatus: null });

  // Fetch chart of accounts
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['chartOfAccounts'],
    queryFn: accountantService.getChartOfAccounts,
  });

  // Seed accounts mutation
  const seedMutation = useMutation({
    mutationFn: accountantService.seedChartOfAccounts,
    onSuccess: () => {
      queryClient.invalidateQueries(['chartOfAccounts']);
      toast.success('Chart of accounts seeded successfully');
      setSeedDialog({ isOpen: false });
    },
    onError: (error) => {
      toast.error('Failed to seed chart of accounts');
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: (accountId) => accountantService.deleteAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries(['chartOfAccounts']);
      toast.success('Account deleted successfully');
      setDeleteDialog({ isOpen: false, accountId: null, accountName: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => accountantService.toggleAccountStatus(id, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chartOfAccounts']);
      toast.success(`Account ${data.isActive ? 'activated' : 'deactivated'} successfully`);
      setStatusDialog({ isOpen: false, accountId: null, accountName: '', currentStatus: null });
    },
    onError: (error) => {
      toast.error('Failed to update account status');
    },
  });

  const toggleType = (type) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
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

  const handleDeleteClick = (account) => {
    setDeleteDialog({
      isOpen: true,
      accountId: account.id,
      accountName: account.name
    });
  };

  const handleStatusToggle = (account) => {
    setStatusDialog({
      isOpen: true,
      accountId: account.id,
      accountName: account.name,
      currentStatus: account.is_active
    });
  };

  const handleViewAccount = (accountId) => {
    navigate(`/accountant/chart-of-accounts/${accountId}`);
  };

  const handleEditAccount = (accountId) => {
    navigate(`/accountant/chart-of-accounts/edit/${accountId}`);
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorAlert message="Failed to load chart of accounts" />;

  const chartData = data?.chart_of_accounts || {};

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Chart of Accounts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your church's chart of accounts. Admin users can create, edit, and delete accounts.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSeedDialog({ isOpen: true })}
            className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)]"
          >
            <DocumentDuplicateIcon className="-ml-1 mr-2 h-5 w-5" />
            Seed Default Accounts
          </button>

          <button
            type="button"
            onClick={() => navigate('/accountant/chart-of-accounts/new')}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Account
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Account Types Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(CHART_OF_ACCOUNTS).map(([type, accounts]) => (
          <div key={type} className={`rounded-lg p-4 ${getTypeColor(type)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getTypeIcon(type)}
                <span className="ml-2 text-sm font-medium">{type}</span>
              </div>
              <span className="text-lg font-bold">{accounts.length}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Accounts List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {Object.entries(chartData).length > 0 ? (
          Object.entries(chartData).map(([type, accounts]) => (
            <div key={type} className="border-b border-gray-200 last:border-0">
              {/* Type Header */}
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  {expandedTypes[type] ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                  )}
                  <span className={`ml-2 text-lg font-semibold ${getTypeColor(type).split(' ')[0]}`}>
                    {type}
                  </span>
                  <span className="ml-3 text-sm text-gray-500">
                    ({accounts.length} accounts)
                  </span>
                </div>
              </button>

              {/* Accounts */}
              {expandedTypes[type] && (
                <div className="px-6 py-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {account.account_code}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {account.display_name || account.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {account.category || '-'}
                            {account.sub_category && ` / ${account.sub_category}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            <span className={account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              GHS {account.current_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <button
                              onClick={() => handleStatusToggle(account)}
                              className="inline-flex items-center"
                              title={account.is_active ? 'Deactivate account' : 'Activate account'}
                            >
                              {account.is_active ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500 hover:text-green-600" />
                              ) : (
                                <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleViewAccount(account.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="View details"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleEditAccount(account.id)}
                                className="text-indigo-600 hover:text-indigo-800"
                                title="Edit account"
                              >
                                <PencilSquareIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(account)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete account"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No accounts found. Click "Seed Default Accounts" to create the standard chart of accounts.</p>
          </div>
        )}
      </div>

      {/* Seed Confirmation Dialog */}
      <ConfirmDialog
        isOpen={seedDialog.isOpen}
        onClose={() => setSeedDialog({ isOpen: false })}
        onConfirm={() => seedMutation.mutate()}
        title="Seed Default Chart of Accounts"
        message="This will create the standard church chart of accounts. Existing accounts will be skipped. Continue?"
        confirmText="Seed Accounts"
        cancelText="Cancel"
        type="info"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, accountId: null, accountName: '' })}
        onConfirm={() => deleteMutation.mutate(deleteDialog.accountId)}
        title="Delete Account"
        message={`Are you sure you want to delete "${deleteDialog.accountName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Status Toggle Confirmation Dialog */}
      <ConfirmDialog
        isOpen={statusDialog.isOpen}
        onClose={() => setStatusDialog({ isOpen: false, accountId: null, accountName: '', currentStatus: null })}
        onConfirm={() => toggleStatusMutation.mutate({ 
          id: statusDialog.accountId, 
          isActive: !statusDialog.currentStatus 
        })}
        title={statusDialog.currentStatus ? 'Deactivate Account' : 'Activate Account'}
        message={`Are you sure you want to ${statusDialog.currentStatus ? 'deactivate' : 'activate'} "${statusDialog.accountName}"?`}
        confirmText={statusDialog.currentStatus ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        type={statusDialog.currentStatus ? 'warning' : 'info'}
      />
    </div>
  );
}

export default ChartOfAccounts;