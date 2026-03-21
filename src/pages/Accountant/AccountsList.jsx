// pages/Accounting/AccountsList.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AccountForm from './AccountForm';

const AccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    isActive: true
  });

  useEffect(() => {
    fetchAccounts();
  }, [filters]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountantService.getAccounts({
        type: filters.type || undefined,
        search: filters.search || undefined,
        isActive: filters.isActive ? 'true' : undefined
      });
      setAccounts(response.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      await accountantService.deleteAccount(id);
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.error || 'Failed to delete account');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await accountantService.toggleAccountStatus(id, !currentStatus);
      toast.success(`Account ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchAccounts();
    } catch (error) {
      console.error('Error toggling account status:', error);
      toast.error('Failed to update account status');
    }
  };

  const accountTypes = [
    { id: 'ASSET', name: 'Assets', color: 'text-blue-600 bg-blue-50' },
    { id: 'LIABILITY', name: 'Liabilities', color: 'text-orange-600 bg-orange-50' },
    { id: 'EQUITY', name: 'Equity', color: 'text-purple-600 bg-purple-50' },
    { id: 'REVENUE', name: 'Revenue', color: 'text-green-600 bg-green-50' },
    { id: 'EXPENSE', name: 'Expenses', color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your chart of accounts structure
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAccount(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Account
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Account Types</option>
            {accountTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showActive"
              checked={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.checked })}
              className="h-4 w-4 text-green-600 rounded"
            />
            <label htmlFor="showActive" className="ml-2 text-sm">
              Show active accounts only
            </label>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No accounts found</p>
                    <p className="text-sm">Create your first account to get started.</p>
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <motion.tr
                    key={account.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {account.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        account.type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                        account.type === 'LIABILITY' ? 'bg-orange-100 text-orange-800' :
                        account.type === 'EQUITY' ? 'bg-purple-100 text-purple-800' :
                        account.type === 'REVENUE' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                      {accountantService.formatCurrency(account.balance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowForm(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(account.id, account.is_active)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title={account.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          account={selectedAccount}
          onClose={() => {
            setShowForm(false);
            setSelectedAccount(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedAccount(null);
            fetchAccounts();
          }}
        />
      )}
    </div>
  );
};

export default AccountsList;