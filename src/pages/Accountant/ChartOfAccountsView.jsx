// pages/Accountant/ChartOfAccountsView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import toast from 'react-hot-toast';

const ChartOfAccountsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccountDetails();
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const response = await accountantService.getAccount(id);
      setAccount(response.account || response);
      setError(null);
    } catch (err) {
      console.error('Error fetching account details:', err);
      setError('Failed to load account details');
      toast.error('Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'ASSET':
        return <BanknotesIcon className="h-6 w-6 text-blue-600" />;
      case 'LIABILITY':
        return <BriefcaseIcon className="h-6 w-6 text-orange-600" />;
      case 'EQUITY':
        return <ScaleIcon className="h-6 w-6 text-purple-600" />;
      case 'REVENUE':
        return <CurrencyDollarIcon className="h-6 w-6 text-green-600" />;
      case 'EXPENSE':
        return <CurrencyDollarIcon className="h-6 w-6 text-red-600" />;
      default:
        return <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'ASSET': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'LIABILITY': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'EQUITY': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'REVENUE': return 'bg-green-50 border-green-200 text-green-800';
      case 'EXPENSE': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorAlert message={error || 'Account not found'} />
          <button
            onClick={() => navigate('/accountant/chart-of-accounts')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Chart of Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/accountant/chart-of-accounts')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Chart of Accounts
          </button>
          <button
            onClick={() => navigate(`/accountant/chart-of-accounts/edit/${id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[rgb(31,178,86)] hover:bg-[rgb(25,142,69)]"
          >
            <PencilSquareIcon className="h-5 w-5 mr-2" />
            Edit Account
          </button>
        </div>

        {/* Account Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg overflow-hidden"
        >
          {/* Header with Type */}
          <div className={`px-6 py-4 border-b ${getTypeColor(account.account_type)}`}>
            <div className="flex items-center">
              {getTypeIcon(account.account_type)}
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                {account.display_name || account.name}
              </h1>
              {account.is_active ? (
                <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Inactive
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {account.account_code} • {account.account_type}
            </p>
          </div>

          {/* Account Details Grid */}
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Code</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{account.account_code}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{account.account_type}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{account.display_name || '-'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{account.category || '-'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Sub Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{account.sub_category || '-'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Normal Balance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`capitalize ${account.normal_balance === 'debit' ? 'text-green-600' : 'text-blue-600'}`}>
                    {account.normal_balance}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Current Balance</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  GHS {account.current_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Opening Balance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  GHS {account.opening_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Level</dt>
                <dd className="mt-1 text-sm text-gray-900">{account.level || 1}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Is Contra Account</dt>
                <dd className="mt-1 text-sm text-gray-900">{account.is_contra ? 'Yes' : 'No'}</dd>
              </div>

              {account.parent_account_id && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Parent Account</dt>
                  <dd className="mt-1 text-sm text-gray-900">ID: {account.parent_account_id}</dd>
                </div>
              )}

              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{account.description || 'No description provided'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {account.created_at ? new Date(account.created_at).toLocaleString() : '-'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {account.updated_at ? new Date(account.updated_at).toLocaleString() : '-'}
                </dd>
              </div>
            </dl>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChartOfAccountsView;