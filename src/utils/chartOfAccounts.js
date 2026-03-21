// utils/chartOfAccounts.js
/**
 * Chart of Accounts constants and helpers
 * Based on standard church accounting structure
 */

// Account type definitions
export const ACCOUNT_TYPES = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE'
};

// Account type display names
export const ACCOUNT_TYPE_NAMES = {
  [ACCOUNT_TYPES.ASSET]: 'Asset',
  [ACCOUNT_TYPES.LIABILITY]: 'Liability',
  [ACCOUNT_TYPES.EQUITY]: 'Equity',
  [ACCOUNT_TYPES.REVENUE]: 'Revenue',
  [ACCOUNT_TYPES.EXPENSE]: 'Expense'
};

// Account type colors for UI
export const ACCOUNT_TYPE_COLORS = {
  [ACCOUNT_TYPES.ASSET]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    light: 'bg-blue-50'
  },
  [ACCOUNT_TYPES.LIABILITY]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    light: 'bg-orange-50'
  },
  [ACCOUNT_TYPES.EQUITY]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    light: 'bg-purple-50'
  },
  [ACCOUNT_TYPES.REVENUE]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    light: 'bg-green-50'
  },
  [ACCOUNT_TYPES.EXPENSE]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    light: 'bg-red-50'
  }
};

// Account type icons
export const ACCOUNT_TYPE_ICONS = {
  [ACCOUNT_TYPES.ASSET]: '💰',
  [ACCOUNT_TYPES.LIABILITY]: '📋',
  [ACCOUNT_TYPES.EQUITY]: '⚖️',
  [ACCOUNT_TYPES.REVENUE]: '📈',
  [ACCOUNT_TYPES.EXPENSE]: '📉'
};

// Normal balance rules
export const NORMAL_BALANCE = {
  [ACCOUNT_TYPES.ASSET]: 'debit',
  [ACCOUNT_TYPES.EXPENSE]: 'debit',
  [ACCOUNT_TYPES.LIABILITY]: 'credit',
  [ACCOUNT_TYPES.EQUITY]: 'credit',
  [ACCOUNT_TYPES.REVENUE]: 'credit'
};

// Standard account code ranges
export const ACCOUNT_CODE_RANGES = {
  [ACCOUNT_TYPES.ASSET]: { min: 1000, max: 1999 },
  [ACCOUNT_TYPES.LIABILITY]: { min: 2000, max: 2999 },
  [ACCOUNT_TYPES.EQUITY]: { min: 3000, max: 3999 },
  [ACCOUNT_TYPES.REVENUE]: { min: 4000, max: 4999 },
  [ACCOUNT_TYPES.EXPENSE]: { min: 5000, max: 5999 }
};

// Category groups for financial statements
export const CATEGORY_GROUPS = {
  income: {
    'Tithes': ['4010'],
    'Offerings': ['4020', '4060', '4080', '4090', '4100'],
    'Donations': ['4070'],
    'Special Income': ['4030', '4040', '4050', '4110', '4120', '4130', '4190'],
  },
  expenses: {
    'Staff Costs': ['5020', '5021', '5022', '5023'],
    'Operational Expenses': ['5030', '5040', '5050', '5060', '5070', '5080'],
    'Ministry Expenses': ['5090', '5100', '5110', '5120', '5130', '5140'],
    'Administrative Expenses': ['5150', '5160'],
    'Financial Costs': ['5170'],
    'Other Expenses': ['5010', '5180', '5190', '5200'],
  }
};

// Default chart of accounts structure
export const DEFAULT_CHART_OF_ACCOUNTS = {
  [ACCOUNT_TYPES.REVENUE]: [
    { code: '4010', name: 'Tithes', category: 'Tithes', normalBalance: 'credit' },
    { code: '4020', name: 'Thanks Offering', category: 'Offerings', normalBalance: 'credit' },
    { code: '4030', name: 'Harvest Proceeds', category: 'Special Income', normalBalance: 'credit' },
    { code: '4040', name: 'Statutory Income', category: 'Special Income', normalBalance: 'credit' },
    { code: '4050', name: 'Cemetery Income', category: 'Special Income', normalBalance: 'credit' },
    { code: '4060', name: 'Special Offering', category: 'Offerings', normalBalance: 'credit' },
    { code: '4070', name: 'Donations Received', category: 'Donations', normalBalance: 'credit' },
    { code: '4080', name: 'Adults\' Normal Offering', category: 'Offerings', normalBalance: 'credit' },
    { code: '4090', name: 'Junior Youth Offering', category: 'Offerings', normalBalance: 'credit' },
    { code: '4100', name: 'Children Service Offering', category: 'Offerings', normalBalance: 'credit' },
    { code: '4110', name: 'Welfare Income', category: 'Special Income', normalBalance: 'credit' },
    { code: '4120', name: 'Scholarship Income', category: 'Special Income', normalBalance: 'credit' },
    { code: '4130', name: 'Interest Income', category: 'Special Income', normalBalance: 'credit' },
    { code: '4190', name: 'Other Income', category: 'Other Income', normalBalance: 'credit' },
  ],
  
  [ACCOUNT_TYPES.EXPENSE]: [
    { code: '5010', name: 'Income Contribution', category: 'Other Expenses', normalBalance: 'debit' },
    { code: '5020', name: 'Staff Cost - Salaries', category: 'Staff Costs', normalBalance: 'debit' },
    { code: '5021', name: 'Staff Cost - Wages', category: 'Staff Costs', normalBalance: 'debit' },
    { code: '5022', name: 'Staff Cost - Benefits', category: 'Staff Costs', normalBalance: 'debit' },
    { code: '5023', name: 'Staff Cost - Allowances', category: 'Staff Costs', normalBalance: 'debit' },
    { code: '5030', name: 'Printing and Stationeries', category: 'Operational Expenses', normalBalance: 'debit' },
    { code: '5040', name: 'Transportation', category: 'Operational Expenses', normalBalance: 'debit' },
    { code: '5050', name: 'Utilities', category: 'Operational Expenses', normalBalance: 'debit' },
    { code: '5060', name: 'General Repairs and Maintenance', category: 'Operational Expenses', normalBalance: 'debit' },
    { code: '5070', name: 'Chapel Repairs and Maintenance', category: 'Operational Expenses', normalBalance: 'debit' },
    { code: '5080', name: 'Manse Repairs and Maintenance', category: 'Operational Expenses', normalBalance: 'debit' },
    { code: '5090', name: 'Evangelism Expenses', category: 'Ministry Expenses', normalBalance: 'debit' },
    { code: '5100', name: 'Conference and Meetings', category: 'Ministry Expenses', normalBalance: 'debit' },
    { code: '5110', name: 'Eucharist', category: 'Ministry Expenses', normalBalance: 'debit' },
    { code: '5120', name: 'Donations Given', category: 'Ministry Expenses', normalBalance: 'debit' },
    { code: '5130', name: 'Training and Courses', category: 'Ministry Expenses', normalBalance: 'debit' },
    { code: '5140', name: 'Entertainment and Hospitality', category: 'Ministry Expenses', normalBalance: 'debit' },
    { code: '5150', name: 'General and Admin Expenses', category: 'Administrative Expenses', normalBalance: 'debit' },
    { code: '5160', name: 'Professional Charges', category: 'Administrative Expenses', normalBalance: 'debit' },
    { code: '5170', name: 'Bank Charges', category: 'Financial Costs', normalBalance: 'debit' },
    { code: '5180', name: 'Harvest Expense', category: 'Other Expenses', normalBalance: 'debit' },
    { code: '5190', name: 'Sundry Expense', category: 'Other Expenses', normalBalance: 'debit' },
    { code: '5200', name: 'Depreciation', category: 'Other Expenses', normalBalance: 'debit' },
  ],
  
  [ACCOUNT_TYPES.ASSET]: [
    { code: '1010', name: 'Cash - Petty Cash', category: 'Cash', normalBalance: 'debit' },
    { code: '1020', name: 'Cash - Main Cash', category: 'Cash', normalBalance: 'debit' },
    { code: '1110', name: 'Bank - Current Account', category: 'Bank', normalBalance: 'debit' },
    { code: '1120', name: 'Bank - Savings Account', category: 'Bank', normalBalance: 'debit' },
    { code: '1130', name: 'Bank - Fixed Deposit', category: 'Bank', normalBalance: 'debit' },
    { code: '1210', name: 'Accounts Receivable', category: 'Receivables', normalBalance: 'debit' },
    { code: '1220', name: 'Stock/Inventory', category: 'Inventory', normalBalance: 'debit' },
    { code: '1230', name: 'Investments - Short Term', category: 'Investments', normalBalance: 'debit' },
    { code: '1410', name: 'Investments - Long Term', category: 'Investments', normalBalance: 'debit' },
    { code: '1510', name: 'Land', category: 'Tangible Assets', normalBalance: 'debit' },
    { code: '1520', name: 'Buildings - Chapel', category: 'Tangible Assets', normalBalance: 'debit' },
    { code: '1530', name: 'Buildings - Manse', category: 'Tangible Assets', normalBalance: 'debit' },
    { code: '1540', name: 'Vehicles', category: 'Tangible Assets', normalBalance: 'debit' },
    { code: '1550', name: 'Furniture and Fixtures', category: 'Tangible Assets', normalBalance: 'debit' },
    { code: '1560', name: 'Computers and Equipment', category: 'Tangible Assets', normalBalance: 'debit' },
    { code: '1570', name: 'Church Equipment', category: 'Tangible Assets', normalBalance: 'debit' },
    { code: '1910', name: 'Accumulated Depreciation - Buildings', category: 'Depreciation', isContra: true, normalBalance: 'credit' },
    { code: '1920', name: 'Accumulated Depreciation - Vehicles', category: 'Depreciation', isContra: true, normalBalance: 'credit' },
    { code: '1930', name: 'Accumulated Depreciation - Equipment', category: 'Depreciation', isContra: true, normalBalance: 'credit' },
  ],
  
  [ACCOUNT_TYPES.LIABILITY]: [
    { code: '2010', name: 'Accounts Payable', category: 'Payables', normalBalance: 'credit' },
    { code: '2020', name: 'Accrued Expenses', category: 'Accruals', normalBalance: 'credit' },
    { code: '2030', name: 'PAYE Payable', category: 'Taxes', normalBalance: 'credit' },
    { code: '2040', name: 'SSNIT Payable', category: 'Statutory', normalBalance: 'credit' },
    { code: '2050', name: 'Tithe Payable', category: 'Payables', normalBalance: 'credit' },
    { code: '2310', name: 'Loans - Bank', category: 'Loans', normalBalance: 'credit' },
    { code: '2320', name: 'Loans - Members', category: 'Loans', normalBalance: 'credit' },
    { code: '2330', name: 'Mortgages', category: 'Loans', normalBalance: 'credit' },
  ],
  
  [ACCOUNT_TYPES.EQUITY]: [
    { code: '3010', name: 'Accumulated Fund', category: 'Accumulated Fund', normalBalance: 'credit' },
    { code: '3020', name: 'Retained Earnings', category: 'Retained Earnings', normalBalance: 'credit' },
    { code: '3090', name: 'Current Year Surplus/Deficit', category: 'Temporary', normalBalance: 'credit' },
  ]
};

// Helper functions
export const getAccountTypeFromCode = (code) => {
  if (!code) return null;
  const codeStr = code.toString();
  const firstDigit = codeStr.charAt(0);
  
  const typeMap = {
    '1': ACCOUNT_TYPES.ASSET,
    '2': ACCOUNT_TYPES.LIABILITY,
    '3': ACCOUNT_TYPES.EQUITY,
    '4': ACCOUNT_TYPES.REVENUE,
    '5': ACCOUNT_TYPES.EXPENSE,
  };
  
  return typeMap[firstDigit] || null;
};

export const validateAccountCode = (code, type) => {
  const expectedType = getAccountTypeFromCode(code);
  if (!expectedType) return { valid: false, message: 'Invalid account code format' };
  if (expectedType !== type) {
    return { 
      valid: false, 
      message: `Account code ${code} should be for ${expectedType} accounts, not ${type}` 
    };
  }
  return { valid: true, message: 'Valid account code' };
};

export const getSuggestedCode = (type, category) => {
  const ranges = ACCOUNT_CODE_RANGES[type];
  if (!ranges) return null;
  
  // Return the start of the range as a suggestion
  return ranges.min.toString();
};

export const formatAccountCode = (code) => {
  if (!code) return '';
  return code.toString().padStart(4, '0');
};

export default {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_NAMES,
  ACCOUNT_TYPE_COLORS,
  ACCOUNT_TYPE_ICONS,
  NORMAL_BALANCE,
  ACCOUNT_CODE_RANGES,
  CATEGORY_GROUPS,
  DEFAULT_CHART_OF_ACCOUNTS,
  getAccountTypeFromCode,
  validateAccountCode,
  getSuggestedCode,
  formatAccountCode
};