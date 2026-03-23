// pages/Accountant/StandardChartOfAccountsView.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { 
  STANDARD_CHART_OF_ACCOUNTS, 
  getAccountTypeName, 
  getAccountTypeColor 
} from '../../constants/chartOfAccounts';

function StandardChartOfAccountsView() {
  const navigate = useNavigate();
  const [expandedTypes, setExpandedTypes] = useState({
    ASSET: true,
    LIABILITY: true,
    EQUITY: true,
    REVENUE: true,
    EXPENSE: true
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
  
  // Calculate totals
  const totalAccounts = Object.values(STANDARD_CHART_OF_ACCOUNTS).reduce(
    (sum, accounts) => sum + accounts.length, 0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/accountant/chart-of-accounts')}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Standard Chart of Accounts</h1>
              <p className="mt-1 text-sm text-gray-500">
                Based on the church accounting document. Use this as a reference when creating accounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/accountant/chart-of-accounts')}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              My Accounts
            </button>
            <button
              onClick={() => navigate('/accountant/chart-of-accounts/new')}
              className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Custom Account
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {accountTypes.map((type) => {
            const colors = getAccountTypeColor(type);
            const count = STANDARD_CHART_OF_ACCOUNTS[type].length;
            return (
              <div key={type} className={`rounded-lg p-4 ${colors.bg} border ${colors.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getTypeIcon(type)}
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${colors.text}`}>
                        {getAccountTypeName(type)}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCreateAccount(type)}
                    className={`p-1 rounded-full hover:bg-white/50 transition-colors ${colors.text}`}
                    title={`Add ${getAccountTypeName(type)} account`}
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Accounts Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentDuplicateIcon className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm font-medium opacity-90">Total Standard Accounts</p>
                <p className="text-2xl font-bold">{totalAccounts}</p>
              </div>
            </div>
            <p className="text-sm opacity-80">
              Based on church accounting guidelines
            </p>
          </div>
        </div>

        {/* Account Types List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {accountTypes.map((type) => {
            const accounts = STANDARD_CHART_OF_ACCOUNTS[type];
            const colors = getAccountTypeColor(type);
            
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
                    <span className={`ml-2 text-lg font-semibold ${colors.text}`}>
                      {getAccountTypeName(type)}
                    </span>
                    <span className="ml-3 text-sm text-gray-500">
                      ({accounts.length} accounts)
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

                {/* Accounts Table */}
                {expandedTypes[type] && (
                  <div className="px-6 py-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Normal Balance
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accounts.map((account, index) => (
                          <motion.tr
                            key={account.code}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.01 }}
                            className="hover:bg-gray-50"
                          >
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
                          </motion.tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-sm text-gray-500">
                            Total: {accounts.length} accounts
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
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>This is the standard chart of accounts based on church accounting guidelines.</p>
          <p>Click "Create" to add any of these accounts to your chart of accounts, or create custom accounts as needed.</p>
        </div>
      </div>
    </div>
  );
}

export default StandardChartOfAccountsView;