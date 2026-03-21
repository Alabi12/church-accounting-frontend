import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AccountForm from '../../components/accountant/AccountForm';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const AccountManagement = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
    isActive: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [statusDialog, setStatusDialog] = useState({ isOpen: false, id: null, currentStatus: false });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accounts', page, filters],
    queryFn: () => accountantService.getAccounts({ 
      page, 
      perPage: 10,
      ...filters 
    }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => accountantService.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      toast.success('Account deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => accountantService.toggleAccountStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      toast.success('Account status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update account status');
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate(deleteDialog.id);
    setDeleteDialog({ isOpen: false, id: null });
  };

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate({ 
      id: statusDialog.id, 
      isActive: !statusDialog.currentStatus 
    });
    setStatusDialog({ isOpen: false, id: null, currentStatus: false });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const getTypeColor = (type) => {
    const colors = {
      asset: 'bg-blue-100 text-blue-800',
      liability: 'bg-orange-100 text-orange-800',
      equity: 'bg-purple-100 text-purple-800',
      income: 'bg-green-100 text-green-800',
      expense: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const accountTypes = [
    { id: 'asset', name: 'Asset' },
    { id: 'liability', name: 'Liability' },
    { id: 'equity', name: 'Equity' },
    { id: 'income', name: 'Income' },
    { id: 'expense', name: 'Expense' },
  ];

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your chart of accounts
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => {
                setEditingAccount(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Account
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total Accounts</p>
            <p className="text-xl font-bold text-gray-900">{data?.accounts?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Active Accounts</p>
            <p className="text-xl font-bold text-green-600">
              {data?.accounts?.filter(a => a.isActive).length || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Asset Accounts</p>
            <p className="text-xl font-bold text-blue-600">
              {data?.accounts?.filter(a => a.type === 'asset').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Income/Expense</p>
            <p className="text-xl font-bold text-purple-600">
              {data?.accounts?.filter(a => a.type === 'income' || a.type === 'expense').length || 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-gray-200 p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Account Type</label>
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    {accountTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    name="isActive"
                    value={filters.isActive}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="all">All</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Search by code or name..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.accounts?.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-medium text-gray-900">
                        {account.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">{account.name}</div>
                      {account.description && (
                        <div className="text-xs text-gray-500 mt-1">{account.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(account.type)}`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {account.category?.replace(/_/g, ' ') || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(account.balance || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setStatusDialog({ 
                          isOpen: true, 
                          id: account.id, 
                          currentStatus: account.isActive 
                        })}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          account.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {account.isActive ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingAccount(account);
                            setShowForm(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          title="Edit Account"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, id: account.id })}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Delete Account"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(!data?.accounts || data.accounts.length === 0) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-sm font-medium text-gray-900">No accounts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or create a new account.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Form Modal */}
        {showForm && (
          <AccountForm
            account={editingAccount}
            onClose={() => {
              setShowForm(false);
              setEditingAccount(null);
            }}
            onSuccess={() => {
              refetch();
              setShowForm(false);
              setEditingAccount(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, id: null })}
          onConfirm={handleDelete}
          title="Delete Account"
          message="Are you sure you want to delete this account? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />

        {/* Status Toggle Dialog */}
        <ConfirmDialog
          isOpen={statusDialog.isOpen}
          onClose={() => setStatusDialog({ isOpen: false, id: null, currentStatus: false })}
          onConfirm={handleToggleStatus}
          title={`${statusDialog.currentStatus ? 'Deactivate' : 'Activate'} Account`}
          message={`Are you sure you want to ${statusDialog.currentStatus ? 'deactivate' : 'activate'} this account?`}
          confirmText={statusDialog.currentStatus ? 'Deactivate' : 'Activate'}
          type={statusDialog.currentStatus ? 'warning' : 'success'}
        />
      </div>
    </div>
  );
};

export default AccountManagement;