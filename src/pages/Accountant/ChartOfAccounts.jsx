// pages/Accountant/ChartOfAccounts.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
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
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { 
  STANDARD_CHART_OF_ACCOUNTS, 
  getAccountTypeName, 
  getAccountTypeColor 
} from '../../constants/chartOfAccounts';

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
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, accountId: null, accountName: '' });
  const [statusDialog, setStatusDialog] = useState({ isOpen: false, accountId: null, accountName: '', currentStatus: null });

  // Fetch chart of accounts from backend
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['chartOfAccounts'],
    queryFn: () => accountantService.getAccounts(),
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

  // Get accounts from API response
  const accounts = data?.accounts || [];
  
  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.type || account.account_type || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {});

  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Chart of Accounts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your church's chart of accounts based on the standard church accounting structure.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/accountant/standard-chart-of-accounts')}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
            View Standard Chart
          </button>
          <button
            type="button"
            onClick={() => navigate('/accountant/chart-of-accounts/new')}
            className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)]"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Account
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

      {/* Account Types Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {accountTypes.map((type) => {
          const colors = getAccountTypeColor(type);
          const count = groupedAccounts[type]?.length || 0;
          return (
            <div key={type} className={`rounded-lg p-4 ${colors.bg} border ${colors.border}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getTypeIcon(type)}
                  <span className={`ml-2 text-sm font-medium ${colors.text}`}>
                    {getAccountTypeName(type)}
                  </span>
                </div>
                <span className={`text-lg font-bold ${colors.text}`}>
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standard Chart of Accounts Reference */}
      <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Standard Chart of Accounts Reference</h3>
        <p className="text-xs text-blue-700 mb-3">
          Based on the church accounting document. Use these as a reference when creating new accounts.
          These accounts are not automatically created - you need to add them manually.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div>
            <span className="font-medium text-green-600">Revenue:</span>
            <span className="text-gray-600 ml-1">{STANDARD_CHART_OF_ACCOUNTS.REVENUE.length} accounts</span>
            <button 
              onClick={() => navigate('/accountant/chart-of-accounts/new', { state: { suggestedType: 'REVENUE' } })}
              className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
            >
              (Add)
            </button>
          </div>
          <div>
            <span className="font-medium text-red-600">Expense:</span>
            <span className="text-gray-600 ml-1">{STANDARD_CHART_OF_ACCOUNTS.EXPENSE.length} accounts</span>
            <button 
              onClick={() => navigate('/accountant/chart-of-accounts/new', { state: { suggestedType: 'EXPENSE' } })}
              className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
            >
              (Add)
            </button>
          </div>
          <div>
            <span className="font-medium text-blue-600">Asset:</span>
            <span className="text-gray-600 ml-1">{STANDARD_CHART_OF_ACCOUNTS.ASSET.length} accounts</span>
            <button 
              onClick={() => navigate('/accountant/chart-of-accounts/new', { state: { suggestedType: 'ASSET' } })}
              className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
            >
              (Add)
            </button>
          </div>
          <div>
            <span className="font-medium text-orange-600">Liability:</span>
            <span className="text-gray-600 ml-1">{STANDARD_CHART_OF_ACCOUNTS.LIABILITY.length} accounts</span>
            <button 
              onClick={() => navigate('/accountant/chart-of-accounts/new', { state: { suggestedType: 'LIABILITY' } })}
              className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
            >
              (Add)
            </button>
          </div>
          <div>
            <span className="font-medium text-purple-600">Equity:</span>
            <span className="text-gray-600 ml-1">{STANDARD_CHART_OF_ACCOUNTS.EQUITY.length} accounts</span>
            <button 
              onClick={() => navigate('/accountant/chart-of-accounts/new', { state: { suggestedType: 'EQUITY' } })}
              className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
            >
              (Add)
            </button>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {Object.keys(groupedAccounts).length > 0 ? (
          accountTypes.map((type) => {
            const accountsList = groupedAccounts[type] || [];
            if (accountsList.length === 0) return null;
            
            return (
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
                    <span className={`ml-2 text-lg font-semibold ${getAccountTypeColor(type).text}`}>
                      {getAccountTypeName(type)}
                    </span>
                    <span className="ml-3 text-sm text-gray-500">
                      ({accountsList.length} accounts)
                    </span>
                  </div>
                </button>

                {/* Accounts */}
                {expandedTypes[type] && (
                  <div className="px-6 py-4 overflow-x-auto">
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
                        {accountsList.map((account) => (
                          <tr key={account.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                              {account.code || account.account_code}
                             </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {account.display_name || account.name}
                             </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {account.category || '-'}
                             </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                GHS {account.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No accounts found in the system.</p>
            <p className="text-sm text-gray-400 mb-4">
              Refer to the standard chart of accounts above for guidance on what accounts to create.
            </p>
            <button
              onClick={() => navigate('/accountant/chart-of-accounts/new')}
              className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create First Account
            </button>
          </div>
        )}
      </div>

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
