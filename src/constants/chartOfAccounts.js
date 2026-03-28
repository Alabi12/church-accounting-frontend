export const STANDARD_CHART_OF_ACCOUNTS = {
  ASSET: [
    { code: '1010', name: 'Cash', category: 'Cash', normal_balance: 'debit' },
    { code: '1020', name: 'Bank', category: 'Bank', normal_balance: 'debit' },
    { code: '1030', name: 'Accounts Receivable', category: 'Receivables', normal_balance: 'debit' },
    { code: '1040', name: 'Stock', category: 'Inventory', normal_balance: 'debit' },
    { code: '1050', name: 'Investment', category: 'Investments', normal_balance: 'debit' },
    { code: '1510', name: 'Land', category: 'Tangible Assets', sub_category: 'Land', normal_balance: 'debit' },
    { code: '1520', name: 'Buildings - Chapel', category: 'Tangible Assets', sub_category: 'Buildings', normal_balance: 'debit' },
    { code: '1530', name: 'Buildings - Manse', category: 'Tangible Assets', sub_category: 'Buildings', normal_balance: 'debit' },
    { code: '1540', name: 'Vehicles', category: 'Tangible Assets', sub_category: 'Vehicles', normal_balance: 'debit' },
    { code: '1550', name: 'Furniture and Fixtures', category: 'Tangible Assets', sub_category: 'Furniture', normal_balance: 'debit' },
    { code: '1560', name: 'Computers and Equipment', category: 'Tangible Assets', sub_category: 'Equipment', normal_balance: 'debit' },
    { code: '1570', name: 'Church Equipment', category: 'Tangible Assets', sub_category: 'Equipment', normal_balance: 'debit' },
    { code: '1910', name: 'Accumulated Depreciation - Buildings', category: 'Depreciation', normal_balance: 'credit', is_contra: true },
    { code: '1920', name: 'Accumulated Depreciation - Vehicles', category: 'Depreciation', normal_balance: 'credit', is_contra: true },
    { code: '1930', name: 'Accumulated Depreciation - Equipment', category: 'Depreciation', normal_balance: 'credit', is_contra: true },
  ],
  LIABILITY: [
    { code: '2010', name: 'Accounts Payable', category: 'Payables', normal_balance: 'credit' },
    { code: '2020', name: 'Loans', category: 'Loans', normal_balance: 'credit' },
    { code: '2030', name: 'Accrued Expense', category: 'Accruals', normal_balance: 'credit' },
    { code: '2040', name: 'PAYE Payable', category: 'Taxes', normal_balance: 'credit' },
    { code: '2050', name: 'SSNIT Payable', category: 'Statutory', normal_balance: 'credit' },
  ],
  EQUITY: [
    { code: '3010', name: 'Accumulated Fund', category: 'Accumulated Fund', normal_balance: 'credit' },
    { code: '3020', name: 'Retained Earnings', category: 'Retained Earnings', normal_balance: 'credit' },
    { code: '3090', name: 'Current Year Surplus/Deficit', category: 'Temporary', normal_balance: 'credit' },
  ],
  REVENUE: [
    { code: '4010', name: 'Tithes', category: 'Tithes', normal_balance: 'credit' },
    { code: '4020', name: 'Thanks Offering', category: 'Thanks Offering', normal_balance: 'credit' },
    { code: '4030', name: 'Harvest Proceeds', category: 'Harvest Proceeds', normal_balance: 'credit' },
    { code: '4040', name: 'Statutory Income', category: 'Statutory Income', normal_balance: 'credit' },
    { code: '4050', name: 'Cemetery Income', category: 'Cemetery Income', normal_balance: 'credit' },
    { code: '4060', name: 'Special Offering', category: 'Special Offering', normal_balance: 'credit' },
    { code: '4070', name: 'Donations Received', category: 'Donations Received', normal_balance: 'credit' },
    { code: '4080', name: 'Adults\' Normal Offering', category: 'Adults Offering', normal_balance: 'credit' },
    { code: '4090', name: 'Junior Youth Offering', category: 'Youth Offering', normal_balance: 'credit' },
    { code: '4100', name: 'Children Service Offering', category: 'Children Offering', normal_balance: 'credit' },
    { code: '4110', name: 'Welfare Income', category: 'Welfare', normal_balance: 'credit' },
    { code: '4120', name: 'Scholarship Income', category: 'Scholarship', normal_balance: 'credit' },
    { code: '4130', name: 'Interest Income', category: 'Interest', normal_balance: 'credit' },
    { code: '4190', name: 'Other Income', category: 'Other Income', normal_balance: 'credit' },
  ],
  EXPENSE: [
    { code: '5010', name: 'Income Contribution', category: 'Income Contribution', normal_balance: 'debit' },
    { code: '5020', name: 'Cemetery', category: 'Cemetery', normal_balance: 'debit' },
    { code: '5030', name: 'Staff Cost', category: 'Staff Cost', normal_balance: 'debit' },
    { code: '5040', name: 'Printing and Stationeries', category: 'Office Expenses', normal_balance: 'debit' },
    { code: '5050', name: 'Transportation', category: 'Transportation', normal_balance: 'debit' },
    { code: '5060', name: 'Utilities', category: 'Utilities', normal_balance: 'debit' },
    { code: '5070', name: 'General Repairs and Maintenance', category: 'Repairs', sub_category: 'General', normal_balance: 'debit' },
    { code: '5080', name: 'Chapel Repairs and Maintenance', category: 'Repairs', sub_category: 'Chapel', normal_balance: 'debit' },
    { code: '5090', name: 'Manse Repairs and Maintenance', category: 'Repairs', sub_category: 'Manse', normal_balance: 'debit' },
    { code: '5100', name: 'Evangelism Expenses', category: 'Evangelism', normal_balance: 'debit' },
    { code: '5110', name: 'Conference and Meetings', category: 'Meetings', normal_balance: 'debit' },
    { code: '5120', name: 'Eucharist', category: 'Eucharist', normal_balance: 'debit' },
    { code: '5130', name: 'Donations', category: 'Donations', normal_balance: 'debit' },
    { code: '5140', name: 'Training and Courses', category: 'Training', normal_balance: 'debit' },
    { code: '5150', name: 'Entertainment and Hospitality', category: 'Hospitality', normal_balance: 'debit' },
    { code: '5160', name: 'General and Admin. Expenses', category: 'Administrative', normal_balance: 'debit' },
    { code: '5170', name: 'Professional Charges', category: 'Professional Fees', normal_balance: 'debit' },
    { code: '5180', name: 'Bank Charges', category: 'Bank Charges', normal_balance: 'debit' },
    { code: '5190', name: 'Harvest Expense', category: 'Harvest', normal_balance: 'debit' },
    { code: '5200', name: 'Sundry Expense', category: 'Sundry', normal_balance: 'debit' },
    { code: '5210', name: 'Depreciation', category: 'Depreciation', normal_balance: 'debit' },
  ],
};

// Helper function to get account type name
export function getAccountTypeName(type) {
  const names = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expenses'
  };
  return names[type] || type;
}

// Helper function to get account type colors
export function getAccountTypeColor(type) {
  const colors = {
    ASSET: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700'
    },
    LIABILITY: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700'
    },
    EQUITY: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700'
    },
    REVENUE: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700'
    },
    EXPENSE: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700'
    }
  };
  return colors[type] || {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700'
  };
}

// Helper function to get next available account code
export function getNextAccountCode(type, existingAccounts = []) {
  const standardAccounts = STANDARD_CHART_OF_ACCOUNTS[type] || [];
  const standardCodes = standardAccounts.map(acc => parseInt(acc.code));
  
  const customCodes = existingAccounts
    .filter(acc => (acc.account_type === type || acc.type === type))
    .map(acc => parseInt(acc.account_code || acc.code))
    .filter(code => !isNaN(code));
  
  const allCodes = [...standardCodes, ...customCodes];
  
  let startRange = 0;
  let endRange = 0;
  
  switch(type) {
    case 'ASSET':
      startRange = 1010;
      endRange = 1999;
      break;
    case 'LIABILITY':
      startRange = 2010;
      endRange = 2999;
      break;
    case 'EQUITY':
      startRange = 3010;
      endRange = 3999;
      break;
    case 'REVENUE':
      startRange = 4010;
      endRange = 4999;
      break;
    case 'EXPENSE':
      startRange = 5010;
      endRange = 5999;
      break;
    default:
      startRange = 9000;
      endRange = 9999;
  }
  
  for (let i = startRange; i <= endRange; i++) {
    if (!allCodes.includes(i)) {
      return i.toString();
    }
  }
  
  return (endRange + 1).toString();
}