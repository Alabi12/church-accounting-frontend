// components/accounts/AccountSelector.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import { ACCOUNT_TYPE_NAMES, ACCOUNT_TYPE_COLORS } from '../../utils/chartOfAccounts';

const AccountSelector = ({
  value,
  onChange,
  accountType,
  excludeIds = [],
  placeholder = 'Select an account',
  disabled = false,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, [accountType]);

  useEffect(() => {
    if (value && accounts.length > 0) {
      const account = accounts.find(a => a.id === value) || 
                     accounts.flatMap(a => a.children || []).find(c => c.id === value);
      setSelectedAccount(account);
    } else {
      setSelectedAccount(null);
    }
  }, [value, accounts]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await accountantService.getAccounts({ perPage: 100 });
      let filteredAccounts = response.accounts || [];
      
      if (accountType) {
        filteredAccounts = filteredAccounts.filter(a => a.type === accountType);
      }
      
      if (excludeIds.length > 0) {
        filteredAccounts = filteredAccounts.filter(a => !excludeIds.includes(a.id));
      }
      
      setAccounts(filteredAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const searchLower = search.toLowerCase();
    return (
      account.name.toLowerCase().includes(searchLower) ||
      account.code?.toLowerCase().includes(searchLower) ||
      (account.category || '').toLowerCase().includes(searchLower)
    );
  });

  const getAccountColor = (type) => {
    return ACCOUNT_TYPE_COLORS[type]?.text || 'text-gray-700';
  };

  const handleSelect = (account) => {
    setSelectedAccount(account);
    onChange(account.id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedAccount(null);
    onChange(null);
  };

  const flattenAccounts = (accList, level = 0) => {
    let result = [];
    accList.forEach(account => {
      result.push({ ...account, level });
      if (account.children && account.children.length > 0) {
        result = result.concat(flattenAccounts(account.children, level + 1));
      }
    });
    return result;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected account display */}
      <div
        className={`relative w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
          disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedAccount ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <span className="text-sm font-mono text-gray-500">
                {selectedAccount.account_code}
              </span>
              <span className={`text-sm ${getAccountColor(selectedAccount.account_type)}`}>
                {selectedAccount.name}
              </span>
              {selectedAccount.category && (
                <span className="text-xs text-gray-400">
                  ({selectedAccount.category})
                </span>
              )}
            </div>
            {!disabled && (
              <button
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{placeholder}</span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {/* Search input */}
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts..."
              className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              autoFocus
            />
          </div>

          {/* Account list */}
          <div className="py-1">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                Loading...
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No accounts found
              </div>
            ) : (
              flattenAccounts(filteredAccounts).map((account) => (
                <div
                  key={account.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    account.id === value ? 'bg-blue-50' : ''
                  }`}
                  style={{ paddingLeft: `${16 + (account.level || 0) * 16}px` }}
                  onClick={() => handleSelect(account)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-400">
                      {account.account_code}
                    </span>
                    <span className={`text-sm ${getAccountColor(account.account_type)}`}>
                      {account.name}
                    </span>
                    {!account.is_active && (
                      <span className="text-xs text-gray-400">(inactive)</span>
                    )}
                  </div>
                  {account.category && (
                    <div className="text-xs text-gray-400 mt-1 ml-6">
                      {account.category}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Required indicator */}
      {required && !selectedAccount && (
        <p className="mt-1 text-xs text-red-600">This field is required</p>
      )}
    </div>
  );
};

export default AccountSelector;