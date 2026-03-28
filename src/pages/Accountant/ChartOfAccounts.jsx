// pages/Accountant/ChartOfAccounts.jsx
import React, { useState } from 'react';
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
  const [expandedTypes, setExpandedTypes] = useState({
    ASSET: true,
    LIABILITY: true,
    EQUITY: true,
    REVENUE: true,
    EXPENSE: true
  });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, accountId: null, accountName: '' });
  const [statusDialog, setStatusDialog] = useState({ isOpen: false, accountId: null, accountName: '', currentStatus: null });
  const [loading, setLoading] = useState(false);

  const chartOfAccounts = STANDARD_CHART_OF_ACCOUNTS;
  const totalAccounts = Object.values(chartOfAccounts).reduce(
    (sum, accounts) => sum + accounts.length, 0
  );

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

  const handleCreateAccount = (type, suggestedCode = null, suggestedName = null) => {
    navigate('/accountant/chart-of-accounts/new', { 
      state: { 
        suggestedType: type,
        suggestedCode: suggestedCode,
        suggestedName: suggestedName
      } 
    });
  };

  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Standard Chart of Accounts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Based on the church accounting document. Total: {totalAccounts} accounts
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/accountant/chart-of-accounts/new')}
            className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)]"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Custom Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {accountTypes.map((type) => {
          const colors = getAccountTypeColor(type);
          const count = chartOfAccounts[type]?.length || 0;
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

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {totalAccounts > 0 ? (
          accountTypes.map((type) => {
            const accountsList = chartOfAccounts[type] || [];
            if (accountsList.length === 0) return null;
            const colors = getAccountTypeColor(type);
            
            return (
              <div key={type} className="border-b border-gray-200 last:border-0">
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
                    <span className={`ml-2 text-lg font-semibold ${colors.text}`}>
                      {getAccountTypeName(type)}
                    </span>
                    <span className="ml-3 text-sm text-gray-500">
                      ({accountsList.length} accounts)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateAccount(type);
                    }}
                    className={`inline-flex items-center px-2 py-1 text-xs rounded-md ${colors.bg} ${colors.text} hover:opacity-80`}
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add {getAccountTypeName(type)}
                  </button>
                </button>

                {expandedTypes[type] && (
                  <div className="px-6 py-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Code</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Normal Balance</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accountsList.map((account) => (
                          <tr key={account.code} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-600">
                              {account.code}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {account.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {account.category}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                account.normal_balance === 'debit' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {account.normal_balance === 'debit' ? 'Debit' : 'Credit'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handleCreateAccount(type, account.code, account.name)}
                                className="inline-flex items-center text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]"
                              >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Create
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-sm text-gray-500">
                            Total: {accountsList.length} accounts
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleCreateAccount(type)}
                              className="inline-flex items-center text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add Custom
                            </button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No accounts found in the standard chart.</p>
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

      <div className="mt-6 text-center text-xs text-gray-400">
        <p>This is the standard chart of accounts based on church accounting guidelines.</p>
        <p>Click "Create" to add any of these accounts to your chart of accounts, or create custom accounts as needed.</p>
      </div>
    </div>
  );
}

export default ChartOfAccounts;