import api from './api';

export const accountantService = {
  // ==================== DASHBOARD METHODS ====================
  getDashboardStats: async () => {
    try {
      console.log('📊 Fetching dashboard stats...');
      const response = await api.get('/accounting/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        accountCounts: {},
        journalEntryStats: { posted: 0, draft: 0, pending: 0, void: 0 },
        recentEntries: 0,
        incomeByCategory: [],
        expenseByCategory: []
      };
    }
  },

  getRecentEntries: async (limit = 5) => {
    try {
      console.log(`📝 Fetching ${limit} recent entries...`);
      const response = await api.get(`/accounting/recent-entries?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent entries:', error);
      return { entries: [] };
    }
  },

  getMonthlyTrend: async () => {
    try {
      console.log('📈 Fetching monthly trend...');
      const response = await api.get('/accounting/monthly-trend');
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
      return [];
    }
  },

  // Add these to your accountantService object

createAccount: async (data) => {
  try {
    console.log('📊 Creating account...', data);
    const response = await api.post('/accounting/accounts', data);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
},

updateAccount: async (id, data) => {
  try {
    console.log(`📊 Updating account ${id}...`, data);
    const response = await api.put(`/accounting/accounts/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
},

deleteAccount: async (id) => {
  try {
    console.log(`📊 Deleting account ${id}...`);
    const response = await api.delete(`/accounting/accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
},

toggleAccountStatus: async (id, isActive) => {
  try {
    console.log(`📊 Toggling account ${id} status to ${isActive}...`);
    const response = await api.put(`/accounting/accounts/${id}/status`, { isActive });
    return response.data;
  } catch (error) {
    console.error('Error toggling account status:', error);
    throw error;
  }
},

  getAccountBalances: async () => {
    try {
      console.log('💰 Fetching account balances...');
      const response = await api.get('/accounting/account-balances');
      return response.data;
    } catch (error) {
      console.error('Error fetching account balances:', error);
      return { ASSET: 0, LIABILITY: 0, EQUITY: 0, REVENUE: 0, EXPENSE: 0 };
    }
  },

  getAlerts: async () => {
    try {
      console.log('🔔 Fetching alerts...');
      const response = await api.get('/accounting/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return { alerts: [] };
    }
  },

  // ==================== JOURNAL ENTRY METHODS ====================
// In accountant.js, update the getJournalEntries method:
getJournalEntries: async (params = {}) => {
  try {
    console.log('📝 Fetching journal entries with params:', params);
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.perPage) queryParams.append('perPage', params.perPage);
    if (params.startDate) queryParams.append('start_date', params.startDate); // Note: snake_case
    if (params.endDate) queryParams.append('end_date', params.endDate);       // Note: snake_case
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    
    // Use the correct route with underscore
    const response = await api.get(`/journal_entries?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    throw error;
  }
},

// Update createJournalEntry:
// In accountant.js
createJournalEntry: async (data) => {
  try {
    const payload = {
      entry_date: data.entry_date,
      description: data.description,
      reference: data.reference || '',
      notes: data.notes || '',
      lines: data.lines.map(line => ({
        account_id: line.account_id,
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
        description: line.description || ''
      })),
      submit_for_approval: data.submit_for_approval || false
    };
    
    console.log('📤 Creating journal entry with payload:', JSON.stringify(payload, null, 2));
    
    // Make sure the URL matches your backend route
    const response = await api.post('/journal_entries', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
},

// In accountant.js - add this method to your accountantService object

getJournalEntry: async (id) => {
  try {
    console.log(`📥 Fetching journal entry ${id} from accountantService...`);
    
    // Try to get the journal entry
    const response = await api.get(`/journal_entries/${id}`);
    console.log('📦 Journal entry response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching journal entry:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    throw error;
  }
},

// Update updateJournalEntry:
updateJournalEntry: async (id, data) => {
  try {
    const payload = {
      entry_date: data.entry_date,
      description: data.description,
      reference: data.reference || '',
      notes: data.notes || '',
      lines: data.lines.map(line => ({
        account_id: line.account_id,
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
        description: line.description || ''
      })),
      submit_for_approval: data.submitForApproval || false
    };
    
    console.log(`📤 Updating journal entry ${id}:`, payload);
    const response = await api.put(`/journal_entries/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
},

// Update postJournalEntry:
postJournalEntry: async (id) => {
  try {
    console.log(`📝 Posting journal entry ${id}...`);
    const response = await api.post(`/journal_entries/${id}/post`);
    return response.data;
  } catch (error) {
    console.error('Error posting journal entry:', error);
    throw error;
  }
},

// Update voidJournalEntry:
voidJournalEntry: async (id, reason) => {
  try {
    console.log(`📝 Voiding journal entry ${id}...`);
    const response = await api.post(`/journal_entries/${id}/void`, { reason });
    return response.data;
  } catch (error) {
    console.error('Error voiding journal entry:', error);
    throw error;
  }
},

// Update deleteJournalEntry:
deleteJournalEntry: async (id) => {
  try {
    console.log(`📝 Deleting journal entry ${id}...`);
    const response = await api.delete(`/journal_entries/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
},

  postJournalEntry: async (id) => {
    try {
      console.log(`📝 Posting journal entry ${id}...`);
      const response = await api.post(`/journal_entries/${id}/post`);
      return response.data;
    } catch (error) {
      console.error('Error posting journal entry:', error);
      throw error;
    }
  },

  voidJournalEntry: async (id, reason) => {
    try {
      console.log(`📝 Voiding journal entry ${id}...`);
      const response = await api.post(`/journal_entries/${id}/void`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error voiding journal entry:', error);
      throw error;
    }
  },

  // ==================== CHART OF ACCOUNTS METHODS ====================
  getChartOfAccounts: async () => {
    try {
      console.log('📊 Fetching chart of accounts...');
      const response = await api.get('/accounting/chart-of-accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      throw error;
    }
  },

  // ==================== ACCOUNT METHODS ====================
  getAccounts: async (params = {}) => {
    try {
      console.log('📊 Fetching accounts with params:', params);
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('perPage', params.perPage);
      if (params.type) queryParams.append('type', params.type);
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive) queryParams.append('isActive', params.isActive);
      
      const response = await api.get(`/accounting/accounts?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  getAccount: async (id) => {
    try {
      console.log(`📊 Fetching account ${id}...`);
      const response = await api.get(`/accounting/accounts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  },

  // ==================== LEDGER METHODS ====================
  getLedger: async (accountId, startDate, endDate) => {
    try {
      console.log(`📚 Fetching ledger for account ${accountId}...`);
      const params = new URLSearchParams({
        accountId,
        startDate,
        endDate
      });
      
      const response = await api.get(`/accounting/ledger?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ledger:', error);
      throw error;
    }
  },

  // ==================== TRIAL BALANCE ====================
  getTrialBalance: async (asAt = null) => {
    try {
      console.log('⚖️ Fetching trial balance...');
      const params = new URLSearchParams();
      if (asAt) {
        params.append('asAt', asAt);
      }
      
      const response = await api.get(`/accounting/trial-balance?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trial balance:', error);
      throw error;
    }
  },


getTrialBalance: async (asAt = null) => {
  try {
    console.log('⚖️ Fetching trial balance...');
    const params = new URLSearchParams();
    if (asAt) {
      params.append('asAt', asAt);
    }
    
    const response = await api.get(`/accounting/trial-balance?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trial balance:', error);
    throw error;
  }
},


getIncomeStatement: async (startDate, endDate) => {
  try {
    console.log('📊 Fetching income statement...');
    const params = new URLSearchParams({
      type: 'income',
      startDate,
      endDate
    });
    
    // Add /accounting to the path
    const response = await api.get(`/accounting/financial-statements?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching income statement:', error);
    throw error;
  }
},

getBalanceSheet: async (asAt) => {
  try {
    console.log('📊 Fetching balance sheet...');
    const params = new URLSearchParams({
      type: 'balance',
      endDate: asAt
    });
    
    // Add /accounting to the path
    const response = await api.get(`/accounting/financial-statements?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    throw error;
  }
},

getReceiptPaymentAccount: async (startDate, endDate) => {
  try {
    console.log('💰 Fetching receipt & payment account...');
    const params = new URLSearchParams({
      type: 'receipt-payment',
      startDate,
      endDate
    });
    
    // Add /accounting to the path
    const response = await api.get(`/accounting/financial-statements?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching receipt & payment account:', error);
    throw error;
  }
},

getCashFlowStatement: async (startDate, endDate) => {
  try {
    console.log('💵 Fetching cash flow statement...');
    const params = new URLSearchParams({
      type: 'cashflow',
      startDate,
      endDate
    });
    
    // Add /accounting to the path
    const response = await api.get(`/accounting/financial-statements?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cash flow statement:', error);
    throw error;
  }
},

// Add to accountantService
  getFinancialStatementsWithBudget: async (startDate, endDate) => {
    try {
      const response = await api.get('/accounting/financial-statements-with-budget', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching financial statements with budget:', error);
      throw error;
    }
  },

  getBudgetVariance: async (params = {}) => {
    const response = await api.get('/treasurer/budget-variance', { params });
    return response.data;
  },
  
  exportBudgetVariance: async (params = {}, format = 'csv') => {
    const response = await api.get('/treasurer/budget-variance/export', { 
      params: { ...params, format },
      responseType: 'blob'
    });
    return response.data;
  },

// ==================== RECONCILIATION METHODS ====================
getReconciliationData: async (params) => {
  try {
    console.log('🔄 Fetching reconciliation data...', params);
    const queryParams = new URLSearchParams();
    queryParams.append('accountId', params.accountId);
    if (params.asOf) queryParams.append('asOf', params.asOf);
    
    const response = await api.get(`/accounting/reconciliation?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reconciliation data:', error);
    throw error;
  }
},

reconcileTransaction: async (transactionId) => {
  try {
    console.log(`✅ Reconciling transaction ${transactionId}...`);
    const response = await api.post(`/accounting/reconciliation/${transactionId}/reconcile`);
    return response.data;
  } catch (error) {
    console.error('Error reconciling transaction:', error);
    throw error;
  }
},

unreconcileTransaction: async (transactionId) => {
  try {
    console.log(`↩️ Unreconciling transaction ${transactionId}...`);
    const response = await api.post(`/accounting/reconciliation/${transactionId}/unreconcile`);
    return response.data;
  } catch (error) {
    console.error('Error unreconciling transaction:', error);
    throw error;
  }
},

// ==================== BANK ACCOUNTS FOR RECONCILIATION ====================
getBankAccounts: async () => {
  try {
    console.log('🏦 Fetching bank accounts...');
    const response = await api.get('/accounting/bank-accounts');
    return response.data;
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return { accounts: [] };
  }
},

// ==================== PETTY CASH ACCOUNTS FOR RECONCILIATION ====================
getPettyCashAccounts: async () => {
  try {
    console.log('💰 Fetching petty cash accounts...');
    // You can reuse the bank accounts endpoint or create a new one
    // For now, we'll use the same endpoint and filter in the frontend if needed
    const response = await api.get('/accounting/bank-accounts');
    
    // You can also filter to show only cash accounts (code 1010)
    // or create a separate endpoint on the backend
    return response.data;
  } catch (error) {
    console.error('Error fetching petty cash accounts:', error);
    return { accounts: [] };
  }
},

  // ==================== UTILITY METHODS ====================
  getAccountTypes: () => {
    return [
      { id: 'ASSET', name: 'Asset' },
      { id: 'LIABILITY', name: 'Liability' },
      { id: 'EQUITY', name: 'Equity' },
      { id: 'REVENUE', name: 'Revenue' },
      { id: 'EXPENSE', name: 'Expense' },
    ];
  },

  getFiscalYears: (startYear = 2020, endYear = new Date().getFullYear() + 1) => {
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  },

  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  },

  formatDate: (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  validateJournalEntry: (entry) => {
    const errors = [];
    
    if (!entry.date) errors.push('Date is required');
    if (!entry.description) errors.push('Description is required');
    
    if (!entry.entries || entry.entries.length === 0) {
      errors.push('At least one journal line is required');
    } else {
      let totalDebit = 0;
      let totalCredit = 0;
      
      entry.entries.forEach((line, index) => {
        if (!line.accountId) errors.push(`Line ${index + 1}: Account is required`);
        
        const debit = parseFloat(line.debit) || 0;
        const credit = parseFloat(line.credit) || 0;
        
        if (debit > 0 && credit > 0) errors.push(`Line ${index + 1}: Cannot have both debit and credit`);
        if (debit === 0 && credit === 0) errors.push(`Line ${index + 1}: Must have either debit or credit amount`);
        
        totalDebit += debit;
        totalCredit += credit;
      });
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        errors.push('Journal entry does not balance: Debits must equal Credits');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};