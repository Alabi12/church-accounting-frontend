// components/accounts/AccountTree.jsx
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters';
import { ACCOUNT_TYPE_COLORS } from '../../utils/chartOfAccounts';

const AccountTree = ({ accounts, onSelect, selectedId, level = 0 }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getAccountColor = (type) => {
    return ACCOUNT_TYPE_COLORS[type]?.text || 'text-gray-700';
  };

  const renderAccount = (account) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expanded[account.id];
    const isSelected = selectedId === account.id;
    const indent = level * 20;

    return (
      <div key={account.id} className="select-none">
        <div
          className={`flex items-center py-2 px-2 hover:bg-gray-50 cursor-pointer ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${16 + indent}px` }}
          onClick={() => onSelect?.(account)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(account.id);
              }}
              className="mr-1 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5 mr-1" />}
          
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-mono text-gray-500">
                {account.account_code}
              </span>
              <span className={`text-sm font-medium ${getAccountColor(account.account_type)}`}>
                {account.name}
              </span>
              {!account.is_active && (
                <span className="text-xs text-gray-400">(inactive)</span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(account.current_balance || 0)}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <AccountTree
            accounts={account.children}
            onSelect={onSelect}
            selectedId={selectedId}
            level={level + 1}
          />
        )}
      </div>
    );
  };

  return <div className="divide-y divide-gray-100">{accounts.map(renderAccount)}</div>;
};

export default AccountTree;