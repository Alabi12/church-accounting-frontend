// pages/Admin/ChurchManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  MagnifyingGlassIcon,  // Add this missing import
  ArrowPathIcon,        // Add this for loading spinner
  CheckCircleIcon,      // Add this for status indicators
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { churchService } from '../../services/church';
import { accountService } from '../../services/account';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';


const ChurchManagement = () => {
  const { user } = useAuth();
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [showPettyCash, setShowPettyCash] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [pettyCashFunds, setPettyCashFunds] = useState([]);
  const [activeTab, setActiveTab] = useState('churches');

  useEffect(() => {
    fetchChurches();
  }, []);

  useEffect(() => {
    if (selectedChurch) {
      if (activeTab === 'bankAccounts') {
        fetchBankAccounts(selectedChurch.id);
      } else if (activeTab === 'pettyCash') {
        fetchPettyCashFunds(selectedChurch.id);
      }
    }
  }, [activeTab, selectedChurch]);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const response = await churchService.getChurches();
      setChurches(response.churches || []);
    } catch (error) {
      console.error('Error fetching churches:', error);
      toast.error('Failed to load churches');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async (churchId) => {
    try {
      setLoading(true);
      const response = await accountService.getAccounts({ 
        church_id: churchId,
        type: 'bank'
      });
      setBankAccounts(response.accounts || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPettyCashFunds = async (churchId) => {
    try {
      setLoading(true);
      // You'll need to create this service method
      const response = await churchService.getPettyCashFunds(churchId);
      setPettyCashFunds(response.funds || []);
    } catch (error) {
      console.error('Error fetching petty cash funds:', error);
      toast.error('Failed to load petty cash funds');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChurch = async (formData) => {
    try {
      await churchService.createChurch(formData);
      toast.success('Church created successfully');
      setShowForm(false);
      fetchChurches();
    } catch (error) {
      console.error('Error creating church:', error);
      toast.error(error.response?.data?.error || 'Failed to create church');
    }
  };

  const handleUpdateChurch = async (churchId, formData) => {
    try {
      await churchService.updateChurch(churchId, formData);
      toast.success('Church updated successfully');
      setShowForm(false);
      setSelectedChurch(null);
      fetchChurches();
    } catch (error) {
      console.error('Error updating church:', error);
      toast.error(error.response?.data?.error || 'Failed to update church');
    }
  };

  const handleDeleteChurch = async (churchId) => {
    if (!window.confirm('Are you sure you want to delete this church? This will also delete all associated accounts and data.')) return;
    
    try {
      await churchService.deleteChurch(churchId);
      toast.success('Church deleted successfully');
      fetchChurches();
    } catch (error) {
      console.error('Error deleting church:', error);
      toast.error(error.response?.data?.error || 'Failed to delete church');
    }
  };

  const handleCreateBankAccount = async (accountData) => {
    try {
      await accountService.createAccount({
        ...accountData,
        church_id: selectedChurch.id,
        type: 'bank'
      });
      toast.success('Bank account created successfully');
      fetchBankAccounts(selectedChurch.id);
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast.error(error.response?.data?.error || 'Failed to create bank account');
    }
  };

  const handleUpdateBankAccount = async (accountId, accountData) => {
    try {
      await accountService.updateAccount(accountId, accountData);
      toast.success('Bank account updated successfully');
      fetchBankAccounts(selectedChurch.id);
    } catch (error) {
      console.error('Error updating bank account:', error);
      toast.error(error.response?.data?.error || 'Failed to update bank account');
    }
  };

  const handleDeleteBankAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;
    
    try {
      await accountService.deleteAccount(accountId);
      toast.success('Bank account deleted successfully');
      fetchBankAccounts(selectedChurch.id);
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error(error.response?.data?.error || 'Failed to delete bank account');
    }
  };

  const handleCreatePettyCash = async (fundData) => {
    try {
      await churchService.createPettyCashFund({
        ...fundData,
        church_id: selectedChurch.id
      });
      toast.success('Petty cash fund created successfully');
      fetchPettyCashFunds(selectedChurch.id);
    } catch (error) {
      console.error('Error creating petty cash fund:', error);
      toast.error(error.response?.data?.error || 'Failed to create petty cash fund');
    }
  };

  const handleUpdatePettyCash = async (fundId, fundData) => {
    try {
      await churchService.updatePettyCashFund(fundId, fundData);
      toast.success('Petty cash fund updated successfully');
      fetchPettyCashFunds(selectedChurch.id);
    } catch (error) {
      console.error('Error updating petty cash fund:', error);
      toast.error(error.response?.data?.error || 'Failed to update petty cash fund');
    }
  };

  const handleDeletePettyCash = async (fundId) => {
    if (!window.confirm('Are you sure you want to delete this petty cash fund?')) return;
    
    try {
      await churchService.deletePettyCashFund(fundId);
      toast.success('Petty cash fund deleted successfully');
      fetchPettyCashFunds(selectedChurch.id);
    } catch (error) {
      console.error('Error deleting petty cash fund:', error);
      toast.error(error.response?.data?.error || 'Failed to delete petty cash fund');
    }
  };

  const handleTopupPettyCash = async (fundId, amount) => {
    try {
      await churchService.topupPettyCashFund(fundId, { amount });
      toast.success('Petty cash fund topped up successfully');
      fetchPettyCashFunds(selectedChurch.id);
    } catch (error) {
      console.error('Error topping up petty cash:', error);
      toast.error(error.response?.data?.error || 'Failed to top up petty cash');
    }
  };

  const filteredChurches = churches.filter(church => 
    church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !showForm && !selectedChurch) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Church & Financial Management</h1>
          <p className="text-sm text-gray-600">Manage churches, bank accounts, and petty cash funds</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search churches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] w-64"
            />
          </div>
          <button
            onClick={() => {
              setSelectedChurch(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Church
          </button>
        </div>
      </div>

      {/* Churches Grid */}
      {filteredChurches.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Churches Found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No churches match your search criteria.' : 'Get started by creating your first church.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Church
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChurches.map((church) => (
            <motion.div
              key={church.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[rgb(31,178,86)] bg-opacity-10 rounded-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-[rgb(31,178,86)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{church.name}</h3>
                      <p className="text-sm text-gray-500">{church.city || 'No city'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    church.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {church.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {church.email && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="font-medium w-20">Email:</span>
                      <span className="truncate">{church.email}</span>
                    </p>
                  )}
                  {church.phone && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <span className="font-medium w-20">Phone:</span>
                      <span>{church.phone}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedChurch(church);
                      setActiveTab('bankAccounts');
                      setShowBankAccounts(true);
                    }}
                    className="text-sm text-[rgb(31,178,86)] hover:underline flex items-center"
                  >
                    <BanknotesIcon className="h-4 w-4 mr-1" />
                    Bank Accounts
                  </button>
                  <button
                    onClick={() => {
                      setSelectedChurch(church);
                      setActiveTab('pettyCash');
                      setShowPettyCash(true);
                    }}
                    className="text-sm text-[rgb(31,178,86)] hover:underline flex items-center"
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Petty Cash
                  </button>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={() => {
                      setSelectedChurch(church);
                      setShowForm(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Church"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteChurch(church.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Delete Church"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Church Form Modal */}
      {showForm && (
        <ChurchForm
          church={selectedChurch}
          onClose={() => {
            setShowForm(false);
            setSelectedChurch(null);
          }}
          onSubmit={selectedChurch ? 
            (data) => handleUpdateChurch(selectedChurch.id, data) : 
            handleCreateChurch
          }
        />
      )}

      {/* Bank Accounts Modal */}
      {showBankAccounts && selectedChurch && (
        <BankAccountsModal
          church={selectedChurch}
          accounts={bankAccounts}
          onClose={() => {
            setShowBankAccounts(false);
            setSelectedChurch(null);
          }}
          onCreate={handleCreateBankAccount}
          onUpdate={handleUpdateBankAccount}
          onDelete={handleDeleteBankAccount}
        />
      )}

      {/* Petty Cash Modal */}
      {showPettyCash && selectedChurch && (
        <PettyCashModal
          church={selectedChurch}
          funds={pettyCashFunds}
          onClose={() => {
            setShowPettyCash(false);
            setSelectedChurch(null);
          }}
          onCreate={handleCreatePettyCash}
          onUpdate={handleUpdatePettyCash}
          onDelete={handleDeletePettyCash}
          onTopup={handleTopupPettyCash}
        />
      )}
    </div>
  );
};

// Church Form Component
const ChurchForm = ({ church, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: church?.name || '',
    address: church?.address || '',
    city: church?.city || '',
    state: church?.state || '',
    country: church?.country || 'Ghana',
    phone: church?.phone || '',
    email: church?.email || '',
    website: church?.website || '',
    tax_id: church?.tax_id || '',
    founded_date: church?.founded_date?.split('T')[0] || '',
    description: church?.description || '',
    is_active: church?.is_active ?? true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Church name is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={church ? 'Edit Church' : 'Create New Church'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Church Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
                errors.name ? 'border-red-300' : ''
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
                errors.email ? 'border-red-300' : ''
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State/Region</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Founded Date</label>
            <input
              type="date"
              name="founded_date"
              value={formData.founded_date}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
            />
          </div>

          <div className="col-span-2 flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active Church</label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[rgb(31,178,86)] hover:bg-[rgb(25,142,69)] disabled:opacity-50">
            {submitting ? 'Saving...' : church ? 'Update Church' : 'Create Church'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Bank Accounts Modal
const BankAccountsModal = ({ church, accounts, onClose, onCreate, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  return (
    <Modal title={`Bank Accounts - ${church.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Bank Accounts</h3>
          <button
            onClick={() => {
              setSelectedAccount(null);
              setShowForm(true);
            }}
            className="px-3 py-1 bg-[rgb(31,178,86)] text-white rounded-lg text-sm flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Account
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {accounts.map(account => (
            <div key={account.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{account.name}</h4>
                  <p className="text-sm text-gray-600">Account: {account.account_number}</p>
                  <p className="text-sm text-gray-600">Bank: {account.bank_name}</p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowForm(true);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(account.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <BankAccountForm
            account={selectedAccount}
            churchId={church.id}
            onClose={() => {
              setShowForm(false);
              setSelectedAccount(null);
            }}
            onSubmit={selectedAccount ? 
              (data) => onUpdate(selectedAccount.id, data) : 
              (data) => onCreate(data)
            }
          />
        )}
      </div>
    </Modal>
  );
};

// Bank Account Form
const BankAccountForm = ({ account, churchId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    account_number: account?.account_number || '',
    bank_name: account?.bank_name || '',
    branch: account?.branch || '',
    opening_balance: account?.opening_balance || 0,
    current_balance: account?.current_balance || 0,
    is_active: account?.is_active ?? true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ ...formData, church_id: churchId });
    onClose();
  };

  return (
    <div className="border-t pt-4">
      <h4 className="font-medium mb-3">{account ? 'Edit Account' : 'New Account'}</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Account Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="Account Number"
          value={formData.account_number}
          onChange={(e) => setFormData({...formData, account_number: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="Bank Name"
          value={formData.bank_name}
          onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <input
          type="number"
          placeholder="Opening Balance"
          value={formData.opening_balance}
          onChange={(e) => setFormData({...formData, opening_balance: parseFloat(e.target.value)})}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-3 py-1 border rounded-lg">
            Cancel
          </button>
          <button type="submit" className="px-3 py-1 bg-[rgb(31,178,86)] text-white rounded-lg">
            {account ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Petty Cash Modal
const PettyCashModal = ({ church, funds, onClose, onCreate, onUpdate, onDelete, onTopup }) => {
  const [showForm, setShowForm] = useState(false);
  const [showTopup, setShowTopup] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);

  return (
    <Modal title={`Petty Cash Funds - ${church.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Petty Cash Funds</h3>
          <button
            onClick={() => {
              setSelectedFund(null);
              setShowForm(true);
            }}
            className="px-3 py-1 bg-[rgb(31,178,86)] text-white rounded-lg text-sm flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Fund
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {funds.map(fund => (
            <div key={fund.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{fund.name}</h4>
                  <p className="text-sm text-gray-600">Custodian: {fund.custodian_name}</p>
                  <p className="text-sm text-gray-600">Float: {formatCurrency(fund.float_amount)}</p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    Balance: {formatCurrency(fund.current_balance)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowTopup(fund)}
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Top Up
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFund(fund);
                      setShowForm(true);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(fund.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <PettyCashForm
            fund={selectedFund}
            churchId={church.id}
            onClose={() => {
              setShowForm(false);
              setSelectedFund(null);
            }}
            onSubmit={selectedFund ? 
              (data) => onUpdate(selectedFund.id, data) : 
              (data) => onCreate(data)
            }
          />
        )}

        {showTopup && (
          <TopupForm
            fund={showTopup}
            onClose={() => setShowTopup(null)}
            onTopup={(amount) => onTopup(showTopup.id, amount)}
          />
        )}
      </div>
    </Modal>
  );
};

// Petty Cash Form
const PettyCashForm = ({ fund, churchId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: fund?.name || '',
    custodian_id: fund?.custodian_id || '',
    float_amount: fund?.float_amount || 0,
    max_transaction_amount: fund?.max_transaction_amount || 100,
    requires_approval: fund?.requires_approval ?? true,
    approval_threshold: fund?.approval_threshold || 50
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ ...formData, church_id: churchId });
    onClose();
  };

  return (
    <div className="border-t pt-4">
      <h4 className="font-medium mb-3">{fund ? 'Edit Fund' : 'New Petty Cash Fund'}</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Fund Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="Float Amount"
          value={formData.float_amount}
          onChange={(e) => setFormData({...formData, float_amount: parseFloat(e.target.value)})}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="Max Transaction Amount"
          value={formData.max_transaction_amount}
          onChange={(e) => setFormData({...formData, max_transaction_amount: parseFloat(e.target.value)})}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.requires_approval}
            onChange={(e) => setFormData({...formData, requires_approval: e.target.checked})}
            className="h-4 w-4 text-[rgb(31,178,86)] rounded"
          />
          <label className="ml-2 text-sm">Requires Approval</label>
        </div>
        {formData.requires_approval && (
          <input
            type="number"
            placeholder="Approval Threshold"
            value={formData.approval_threshold}
            onChange={(e) => setFormData({...formData, approval_threshold: parseFloat(e.target.value)})}
            className="w-full px-3 py-2 border rounded-lg"
          />
        )}
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-3 py-1 border rounded-lg">
            Cancel
          </button>
          <button type="submit" className="px-3 py-1 bg-[rgb(31,178,86)] text-white rounded-lg">
            {fund ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Topup Form
const TopupForm = ({ fund, onClose, onTopup }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    try {
      await onTopup(parseFloat(amount));
      onClose();
    } catch (error) {
      console.error('Topup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Top Up - {fund.name}</h3>
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600 mb-2">Current Balance: {formatCurrency(fund.current_balance)}</p>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mb-4"
            required
            min="1"
            step="0.01"
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg disabled:opacity-50">
              {loading ? 'Processing...' : 'Top Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <XCircleIcon className="h-6 w-6" />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

// Helper function for currency formatting (temporary)
const formatCurrency = (amount) => {
  return `GH₵ ${parseFloat(amount || 0).toFixed(2)}`;
};

export default ChurchManagement;