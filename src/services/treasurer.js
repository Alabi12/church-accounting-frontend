// services/treasurer.js
import api from './api';


export const treasurerService = {
  // ==================== DASHBOARD STATS ====================
  
  /**
   * Get treasurer dashboard statistics
   * @returns {Promise}
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/treasurer/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // ==================== FINANCIAL OVERVIEW ====================

  /**
   * Get income vs expenses comparison
   * @param {Object} params - { period, startDate, endDate }
   * @returns {Promise}
   */
  getIncomeVsExpenses: async (params = {}) => {
    try {
      console.log('📡 Fetching income vs expenses data:', params);
      const response = await api.get('/treasurer/income-vs-expenses', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching income vs expenses:', error);
      return {
        income: 0,
        expenses: 0,
        net: 0,
        incomeChange: 0,
        expenseChange: 0,
        data: []
      };
    }
  },

  /**
   * Get category breakdown
   * @param {string} period - 'month', 'quarter', 'year'
   * @returns {Promise}
   */
  getCategoryBreakdown: async (period = 'month') => {
    try {
      const response = await api.get(`/treasurer/category-breakdown?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching category breakdown:', error);
      return { income: [], expenses: [] };
    }
  },

  /**
   * Get financial overview (summary)
   * @param {Object} params - { period, startDate, endDate }
   * @returns {Promise}
   */
  getFinancialOverview: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const url = `/treasurer/financial-overview${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching financial overview:', error);
      throw error;
    }
  },

  /**
   * Get balance sheet data
   * @param {Object} params - { asAt, period }
   * @returns {Promise}
   */
  getBalanceSheet: async (params = {}) => {
    try {
      console.log('📡 Fetching balance sheet data:', params);
      const response = await api.get('/accounting/balance-sheet', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching balance sheet:', error);
      return {
        assets: { total: 0, items: [] },
        liabilities: { total: 0, items: [] },
        equity: { total: 0, items: [] }
      };
    }
  },

  /**
   * Get cash flow analysis
   * @param {Object} params - { period, startDate, endDate, accountId }
   * @returns {Promise}
   */
  getCashFlow: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.accountId) queryParams.append('accountId', params.accountId);
      
      const url = `/treasurer/cash-flow${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching cash flow:', error);
      throw error;
    }
  },

  // ==================== BUDGET MANAGEMENT ====================
  
  /**
   * Get all budgets with filters
   * @param {Object} params - { status, department, search, page, perPage }
   * @returns {Promise} - { budgets, stats, total, pages }
   */
  getBudgets: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.department) queryParams.append('department', params.department);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('per_page', params.perPage);
      if (params.minAmount) queryParams.append('minAmount', params.minAmount);
      if (params.maxAmount) queryParams.append('maxAmount', params.maxAmount);
      
      const url = `/treasurer/budgets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('📡 Fetching budgets:', url);
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching budgets:', error);
      return { budgets: [], stats: {}, total: 0, pages: 0 };
    }
  },

  /**
   * Get a single budget by ID
   * @param {number} budgetId 
   * @returns {Promise} - Budget details
   */
  getBudget: async (budgetId) => {
    try {
      console.log(`📡 Fetching budget ${budgetId}`);
      const response = await api.get(`/treasurer/budgets/${budgetId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching budget:', error);
      throw error;
    }
  },

  /**
   * Create a new budget
   * @param {Object} budgetData 
   * @returns {Promise}
   */
  createBudget: async (budgetData) => {
    const response = await api.post('/treasurer/budgets', budgetData);
    return response.data;
  },
  
  /**
   * Update a budget
   * @param {number} budgetId 
   * @param {Object} budgetData 
   * @returns {Promise}
   */
  updateBudget: async (budgetId, budgetData) => {
    try {
      console.log(`📝 Updating budget ${budgetId}:`, budgetData);
      const response = await api.put(`/treasurer/budgets/${budgetId}`, budgetData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating budget:', error);
      throw error;
    }
  },

  /**
   * Submit budget for approval
   * @param {number} budgetId 
   * @returns {Promise}
   */
  submitBudgetForApproval: async (budgetId) => {
    try {
      console.log(`📤 Submitting budget ${budgetId} for approval`);
      const response = await api.post(`/treasurer/budgets/${budgetId}/submit`);
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting budget:', error);
      throw error;
    }
  },

  /**
   * Delete a budget (only if in DRAFT)
   * @param {number} budgetId 
   * @returns {Promise}
   */
  deleteBudget: async (budgetId) => {
    try {
      console.log(`🗑️ Deleting budget ${budgetId}`);
      const response = await api.delete(`/treasurer/budgets/${budgetId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting budget:', error);
      throw error;
    }
  },

  /**
   * Get budget variance analysis
   * @param {Object} params - { year, type, department }
   * @returns {Promise}
   */
  getBudgetVariance: async (params = {}) => {
    const response = await api.get('/treasurer/budget-variance', { params });
    return response.data;
  },

  /**
   * Get Chart of Accounts for budget categories
   * @param {Object} params - { type, category }
   * @returns {Promise}
   */
  getChartOfAccounts: async (params = {}) => {
    const response = await api.get('/accounting/chart-of-accounts', { params });
    return response.data;
  },

  /**
   * Get budget comments
   * @param {number} budgetId 
   * @returns {Promise}
   */
  getBudgetComments: async (budgetId) => {
    try {
      console.log(`📡 Fetching comments for budget ${budgetId}`);
      const response = await api.get(`/treasurer/budgets/${budgetId}/comments`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching budget comments:', error);
      return { comments: [] };
    }
  },

  /**
   * Add budget comment
   * @param {number} budgetId 
   * @param {string} comment 
   * @returns {Promise}
   */
  addBudgetComment: async (budgetId, comment) => {
    try {
      console.log(`💬 Adding comment to budget ${budgetId}`);
      const response = await api.post(`/treasurer/budgets/${budgetId}/comments`, { comment });
      return response.data;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  },

  // ==================== EXPENSE MANAGEMENT ====================
  
  /**
   * Get expenses with filters
   * @param {Object} params - { status, category, startDate, endDate, search, page, perPage }
   * @returns {Promise}
   */
  getExpenses: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('per_page', params.perPage);
      
      const url = `/treasurer/expenses${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching expenses:', error);
      return { expenses: [], stats: {}, total: 0 };
    }
  },

  /**
   * Create a new expense
   * @param {Object} expenseData 
   * @returns {Promise}
   */
  createExpense: async (expenseData) => {
    try {
      const response = await api.post('/treasurer/expenses', expenseData);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating expense:', error);
      throw error;
    }
  },

  /**
   * Update an expense
   * @param {number} expenseId 
   * @param {Object} expenseData 
   * @returns {Promise}
   */
  updateExpense: async (expenseId, expenseData) => {
    try {
      const response = await api.put(`/treasurer/expenses/${expenseId}`, expenseData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating expense:', error);
      throw error;
    }
  },

  /**
   * Delete an expense
   * @param {number} expenseId 
   * @returns {Promise}
   */
  deleteExpense: async (expenseId) => {
    try {
      const response = await api.delete(`/treasurer/expenses/${expenseId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      throw error;
    }
  },

  /**
   * Approve an expense
   * @param {number} expenseId 
   * @returns {Promise}
   */
  approveExpense: async (expenseId) => {
    try {
      console.log(`✅ Approving expense ${expenseId}...`);
      const response = await api.post(`/treasurer/expenses/${expenseId}/approve`);
      return response.data;
    } catch (error) {
      console.error('❌ Error approving expense:', error);
      throw error;
    }
  },

  /**
   * Reject an expense
   * @param {number} expenseId 
   * @param {string} reason 
   * @returns {Promise}
   */
  rejectExpense: async (expenseId, reason) => {
    try {
      console.log(`❌ Rejecting expense ${expenseId}...`);
      const response = await api.post(`/treasurer/expenses/${expenseId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error('❌ Error rejecting expense:', error);
      throw error;
    }
  },

  // ==================== REPORTS & ANALYTICS ====================
  
  /**
   * Get income/expense trends
   * @param {number} months 
   * @returns {Promise}
   */
  getTrends: async (months = 6) => {
    try {
      const response = await api.get(`/treasurer/income-expense-trends?months=${months}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching trends:', error);
      return [];
    }
  },

  /**
   * Get alerts
   * @returns {Promise}
   */
  getAlerts: async () => {
    try {
      const response = await api.get('/treasurer/alerts');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      return { alerts: [] };
    }
  },

  /**
   * Get pending items (budgets and expenses awaiting approval)
   * @returns {Promise}
   */
  getPendingItems: async () => {
    try {
      console.log('📡 Fetching pending items...');
      const response = await api.get('/treasurer/pending-items');
      console.log('✅ Pending items response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching pending items:', error);
      return { items: [] };
    }
  },

  /**
   * Get recent transactions
   * @param {number} limit 
   * @returns {Promise}
   */
  getRecentTransactions: async (limit = 10) => {
    try {
      const response = await api.get(`/treasurer/recent-transactions?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching recent transactions:', error);
      return { transactions: [] };
    }
  },

  /**
   * Get budget status report
   * @returns {Promise}
   */
  getBudgetStatus: async () => {
    try {
      const response = await api.get('/treasurer/budget-status');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching budget status:', error);
      return [];
    }
  },

  /**
   * Get cash accounts
   * @returns {Promise}
   */
  getCashAccounts: async () => {
    try {
      console.log('📡 Fetching cash accounts...');
      const response = await api.get('/accounting/accounts', { 
        params: { 
          account_type: 'ASSET',
          category: 'Cash'
        } 
      });
      const accounts = response.data.accounts || response.data || [];
      return { accounts };
    } catch (error) {
      console.error('❌ Error fetching cash accounts:', error);
      return { accounts: [] };
    }
  },

  /**
   * Get bank accounts
   * @returns {Promise}
   */
  getBankAccounts: async () => {
    try {
      console.log('📡 Fetching bank accounts...');
      const response = await api.get('/accounting/accounts', { 
        params: { 
          account_type: 'ASSET',
          category: 'Bank'
        } 
      });
      const accounts = response.data.accounts || response.data || [];
      return { accounts };
    } catch (error) {
      console.error('❌ Error fetching bank accounts:', error);
      return { accounts: [] };
    }
  },

  /**
   * Get transaction approvals
   * @param {Object} params 
   * @returns {Promise}
   */
  getTransactionApprovals: async (params = {}) => {
    try {
      const response = await api.get('/treasurer/transaction-approvals', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching transaction approvals:', error);
      return { transactions: [] };
    }
  },

  /**
   * Approve a transaction
   * @param {number} transactionId 
   * @param {Object} data 
   * @returns {Promise}
   */
  approveTransaction: async (transactionId, data = {}) => {
    try {
      const response = await api.post(`/treasurer/transactions/${transactionId}/approve`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Error approving transaction:', error);
      throw error;
    }
  },

  /**
   * Reject a transaction
   * @param {number} transactionId 
   * @param {Object} data 
   * @returns {Promise}
   */
  rejectTransaction: async (transactionId, data = {}) => {
    try {
      const response = await api.post(`/treasurer/transactions/${transactionId}/reject`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Error rejecting transaction:', error);
      throw error;
    }
  },

  // ==================== DEBUG ====================
  
  /**
   * Debug endpoint to check model accessibility
   * @returns {Promise}
   */
  debug: async () => {
    try {
      const response = await api.get('/treasurer/debug');
      return response.data;
    } catch (error) {
      console.error('❌ Debug endpoint error:', error);
      throw error;
    }
  }
};

export default treasurerService;