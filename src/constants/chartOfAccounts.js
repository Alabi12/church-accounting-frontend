// src/constants/chartOfAccounts.js

export const STANDARD_CHART_OF_ACCOUNTS = {
  REVENUE: [
    { code: '4010', name: 'Tithes', category: 'Income', normal_balance: 'credit' },
    { code: '4020', name: 'Thanks Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4030', name: 'Harvest Proceeds', category: 'Income', normal_balance: 'credit' },
    { code: '4040', name: 'Statutory Income', category: 'Income', normal_balance: 'credit' },
    { code: '4050', name: 'Cemetery Income', category: 'Income', normal_balance: 'credit' },
    { code: '4060', name: 'Special Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4070', name: 'Donations Received', category: 'Income', normal_balance: 'credit' },
    { code: '4080', name: 'Adults\' Normal Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4090', name: 'Junior Youth Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4100', name: 'Children Service Offering', category: 'Income', normal_balance: 'credit' },
    { code: '4110', name: 'Welfare Income', category: 'Income', normal_balance: 'credit' },
    { code: '4120', name: 'Scholarship Income', category: 'Income', normal_balance: 'credit' },
    { code: '4130', name: 'Interest', category: 'Income', normal_balance: 'credit' },
    { code: '4190', name: 'Other Income', category: 'Income', normal_balance: 'credit' },
  ],
  EXPENSE: [
    { code: '5010', name: 'Income Contribution', category: 'Expenses', normal_balance: 'debit' },
    { code: '5020', name: 'Cemetery', category: 'Expenses', normal_balance: 'debit' },
    { code: '5030', name: 'Staff Cost', category: 'Expenses', normal_balance: 'debit' },
    { code: '5040', name: 'Printing and Stationeries', category: 'Expenses', normal_balance: 'debit' },
    { code: '5050', name: 'Transportation', category: 'Expenses', normal_balance: 'debit' },
    { code: '5060', name: 'Utilities', category: 'Expenses', normal_balance: 'debit' },
    { code: '5070', name: 'General Repairs and Maintenance', category: 'Expenses', normal_balance: 'debit' },
    { code: '5080', name: 'Chapel Repairs and Maintenance', category: 'Expenses', normal_balance: 'debit' },
    { code: '5090', name: 'Manse Repairs and Maintenance', category: 'Expenses', normal_balance: 'debit' },
    { code: '5100', name: 'Evangelism Expenses', category: 'Expenses', normal_balance: 'debit' },
    { code: '5110', name: 'Conference and Meetings', category: 'Expenses', normal_balance: 'debit' },
    { code: '5120', name: 'Eucharist', category: 'Expenses', normal_balance: 'debit' },
    { code: '5130', name: 'Donations', category: 'Expenses', normal_balance: 'debit' },
    { code: '5140', name: 'Training and Courses', category: 'Expenses', normal_balance: 'debit' },
    { code: '5150', name: 'Entertainment and Hospitality', category: 'Expenses', normal_balance: 'debit' },
    { code: '5160', name: 'General and Admin. Expenses', category: 'Expenses', normal_balance: 'debit' },
    { code: '5170', name: 'Professional Charges', category: 'Expenses', normal_balance: 'debit' },
    { code: '5180', name: 'Bank Charges', category: 'Expenses', normal_balance: 'debit' },
    { code: '5190', name: 'Harvest Expense', category: 'Expenses', normal_balance: 'debit' },
    { code: '5200', name: 'Sundry Expense', category: 'Expenses', normal_balance: 'debit' },
    { code: '5210', name: 'Depreciation', category: 'Expenses', normal_balance: 'debit' },
  ],
  ASSET: [
    { code: '1010', name: 'Cash', category: 'Current Assets', normal_balance: 'debit' },
    { code: '1020', name: 'Bank', category: 'Current Assets', normal_balance: 'debit' },
    { code: '1030', name: 'Accounts Receivable', category: 'Current Assets', normal_balance: 'debit' },
    { code: '1040', name: 'Stock', category: 'Current Assets', normal_balance: 'debit' },
    { code: '1050', name: 'Investment', category: 'Non-Current Assets', normal_balance: 'debit' },
    { code: '1510', name: 'Tangible Non-Current Assets', category: 'Non-Current Assets', normal_balance: 'debit' },
  ],
  LIABILITY: [
    { code: '2010', name: 'Accounts Payable', category: 'Current Liabilities', normal_balance: 'credit' },
    { code: '2020', name: 'Loans', category: 'Non-Current Liabilities', normal_balance: 'credit' },
    { code: '2030', name: 'Accrued Expense', category: 'Current Liabilities', normal_balance: 'credit' },
  ],
  EQUITY: [
    { code: '3010', name: 'Accumulated Fund', category: 'Equity', normal_balance: 'credit' },
  ],
};

// Helper function to get next available account code
export const getNextAccountCode = (type, existingAccounts = []) => {
  const standardCodes = STANDARD_CHART_OF_ACCOUNTS[type]?.map(acc => parseInt(acc.code)) || [];
  const existingCodes = existingAccounts.map(acc => parseInt(acc.code)) || [];
  const allCodes = [...standardCodes, ...existingCodes];
  const maxCode = Math.max(...allCodes, 0);
  return (maxCode + 1).toString();
};

// Helper to get account type name
export const getAccountTypeName = (type) => {
  const names = {
    ASSET: 'Asset',
    LIABILITY: 'Liability',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expense'
  };
  return names[type] || type;
};

// Helper to get account type color
export const getAccountTypeColor = (type) => {
  const colors = {
    ASSET: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    LIABILITY: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    EQUITY: { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    REVENUE: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    EXPENSE: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  };
  return colors[type] || { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
};