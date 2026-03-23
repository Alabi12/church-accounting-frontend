// components/common/AccountSelector.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { STANDARD_CHART_OF_ACCOUNTS, getAccountTypeName } from '../../constants/chartOfAccounts';
import { formatCurrency } from '../../utils/formatters';

const AccountSelector = ({ 
  value, 
  onChange, 
  accountType = 'all', 
  placeholder = 'Select an account',
  className = ''
}) => {
  const [accounts, setAccounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTypes, setExpandedTypes] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  
  useEffect(() => {
    // Load accounts from the standard chart of accounts
    loadAccounts();
  }, [accountType]);
  
  const loadAccounts = () => {
    setLoading(true);
    try {
      // Filter accounts by type if specified
      let filteredAccounts = {};
      
      if (accountType === 'all') {
        filteredAccounts = STANDARD_CHART_OF_ACCOUNTS;
      } else if (accountType === 'REVENUE') {
        filteredAccounts = { REVENUE: STANDARD_CHART_OF_ACCOUNTS.REVENUE };
      } else if (accountType === 'EXPENSE') {
        filteredAccounts = { EXPENSE: STANDARD_CHART_OF_ACCOUNTS.EXPENSE };
      } else {
        // For other types like ASSET, LIABILITY, EQUITY
        filteredAccounts = { [accountType]: STANDARD_CHART_OF_ACCOUNTS[accountType] || [] };
      }
      
      setAccounts(filteredAccounts);
      
      // Auto-expand all account types
      const expanded = {};
      Object.keys(filteredAccounts).forEach(type => {
        expanded[type] = true;
      });
      setExpandedTypes(expanded);
      
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleType = (type) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };
  
  const getFilteredAccounts = () => {
    if (!searchTerm) return accounts;
    
    const filtered = {};
    Object.entries(accounts).forEach(([type, accountList]) => {
      const filteredList = accountList.filter(acc => 
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.category && acc.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      if (filteredList.length > 0) {
        filtered[type] = filteredList;
      }
    });
    return filtered;
  };
  
  // Find selected account
  const selectedAccount = value ? (
    Object.values(STANDARD_CHART_OF_ACCOUNTS).flat().find(acc => acc.id === value || acc.code === value)
  ) : null;
  
  const handleAccountSelect = (account) => {
    onChange(account.id || account.code);
    setShowDropdown(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-4 py-2.5 text-left border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent bg-white flex justify-between items-center hover:border-gray-300 transition-colors"
      >
        <div>
          {selectedAccount ? (
            <div className="flex items-center">
              <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {selectedAccount.code}
              </span>
              <span className="ml-2 text-gray-700">{selectedAccount.name}</span>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search accounts by name, code, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading accounts...</div>
              ) : Object.keys(getFilteredAccounts()).length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No accounts match your search' : 'No accounts available'}
                </div>
              ) : (
                Object.entries(getFilteredAccounts()).map(([type, accountList]) => (
                  <div key={type} className="border-b border-gray-100 last:border-0">
                    <button
                      onClick={() => toggleType(type)}
                      className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        {expandedTypes[type] ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-400 mr-2" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-400 mr-2" />
                        )}
                        <span className="font-semibold text-sm text-gray-700">
                          {getAccountTypeName(type)}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({accountList.length} accounts)
                        </span>
                      </div>
                    </button>
                    
                    {expandedTypes[type] && (
                      <div className="py-1">
                        {accountList.map(account => (
                          <button
                            key={account.code}
                            onClick={() => handleAccountSelect(account)}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                              (value === account.id || value === account.code) ? 'bg-green-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {account.code}
                                  </span>
                                  <span className="ml-2 text-sm text-gray-700">{account.name}</span>
                                </div>
                                {account.category && (
                                  <p className="text-xs text-gray-400 mt-1 ml-1">
                                    Category: {account.category}
                                  </p>
                                )}
                              </div>
                              {(value === account.id || value === account.code) && (
                                <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountSelector;