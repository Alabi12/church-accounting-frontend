// services/church.js
import api from './api';

const churchService = {
  // ==================== CHURCH MANAGEMENT ====================
  
  // Get all churches (admin only)
  getChurches: async () => {
    try {
      const response = await api.get('/churches');
      return response.data;
    } catch (error) {
      console.error('Error fetching churches:', error);
      throw error;
    }
  },

  // Get current user's church
  getMyChurch: async () => {
    try {
      const response = await api.get('/churches/my');
      return response.data;
    } catch (error) {
      console.error('Error fetching my church:', error);
      throw error;
    }
  },

  // Create new church (admin only)
  createChurch: async (data) => {
    try {
      const response = await api.post('/churches', data);
      return response.data;
    } catch (error) {
      console.error('Error creating church:', error);
      throw error;
    }
  },

  // Update church (admin only)
  updateChurch: async (churchId, data) => {
    try {
      const response = await api.put(`/churches/${churchId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating church:', error);
      throw error;
    }
  },

  // Delete church (admin only)
  deleteChurch: async (churchId) => {
    try {
      const response = await api.delete(`/churches/${churchId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting church:', error);
      throw error;
    }
  },

  // Get church users (admin only)
  getChurchUsers: async (churchId) => {
    try {
      const response = await api.get(`/churches/${churchId}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching church users:', error);
      throw error;
    }
  },

  // Get church statistics
  getChurchStats: async (churchId) => {
    try {
      const response = await api.get(`/churches/${churchId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching church stats:', error);
      throw error;
    }
  },

  // ==================== PETTY CASH MANAGEMENT ====================
  
  /**
   * Get all petty cash funds for a church
   * @param {number} churchId - Church ID
   * @returns {Promise} - { funds: [] }
   */
  getPettyCashFunds: async (churchId) => {
    try {
      const response = await api.get(`/churches/${churchId}/petty-cash`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash funds:', error);
      throw error;
    }
  },

  /**
   * Create a new petty cash fund
   * @param {Object} data - { church_id, name, custodian_id, float_amount, max_transaction_amount, requires_approval, approval_threshold }
   * @returns {Promise}
   */
  createPettyCashFund: async (data) => {
    try {
      const response = await api.post(`/churches/${data.church_id}/petty-cash`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating petty cash fund:', error);
      throw error;
    }
  },

  /**
   * Update a petty cash fund
   * @param {number} fundId - Fund ID
   * @param {Object} data - Updated fund data
   * @returns {Promise}
   */
  updatePettyCashFund: async (fundId, data) => {
    try {
      const response = await api.put(`/petty-cash/${fundId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating petty cash fund:', error);
      throw error;
    }
  },

  /**
   * Delete a petty cash fund
   * @param {number} fundId - Fund ID
   * @returns {Promise}
   */
  deletePettyCashFund: async (fundId) => {
    try {
      const response = await api.delete(`/petty-cash/${fundId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting petty cash fund:', error);
      throw error;
    }
  },

  /**
   * Top up a petty cash fund
   * @param {number} fundId - Fund ID
   * @param {Object} data - { amount, reference, notes }
   * @returns {Promise}
   */
  topupPettyCashFund: async (fundId, data) => {
    try {
      const response = await api.post(`/petty-cash/${fundId}/topup`, data);
      return response.data;
    } catch (error) {
      console.error('Error topping up petty cash fund:', error);
      throw error;
    }
  },

  /**
   * Get petty cash transactions for a fund
   * @param {number} fundId - Fund ID
   * @param {Object} params - { status, startDate, endDate, page, perPage }
   * @returns {Promise}
   */
  getPettyCashTransactions: async (fundId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/petty-cash/${fundId}/transactions${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash transactions:', error);
      throw error;
    }
  },

  /**
   * Create a petty cash expense request
   * @param {number} fundId - Fund ID
   * @param {Object} data - { description, amount, category, receipt, notes }
   * @returns {Promise}
   */
  createPettyCashExpense: async (fundId, data) => {
    try {
      const response = await api.post(`/petty-cash/${fundId}/expenses`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating petty cash expense:', error);
      throw error;
    }
  },

  /**
   * Approve a petty cash expense
   * @param {number} transactionId - Transaction ID
   * @param {Object} data - { notes }
   * @returns {Promise}
   */
  approvePettyCashExpense: async (transactionId, data = {}) => {
    try {
      const response = await api.post(`/petty-cash/transactions/${transactionId}/approve`, data);
      return response.data;
    } catch (error) {
      console.error('Error approving petty cash expense:', error);
      throw error;
    }
  },

  /**
   * Reject a petty cash expense
   * @param {number} transactionId - Transaction ID
   * @param {Object} data - { reason, notes }
   * @returns {Promise}
   */
  rejectPettyCashExpense: async (transactionId, data) => {
    try {
      const response = await api.post(`/petty-cash/transactions/${transactionId}/reject`, data);
      return response.data;
    } catch (error) {
      console.error('Error rejecting petty cash expense:', error);
      throw error;
    }
  },

  /**
   * Get petty cash fund summary/dashboard
   * @param {number} churchId - Church ID
   * @returns {Promise}
   */
  getPettyCashDashboard: async (churchId) => {
    try {
      const response = await api.get(`/churches/${churchId}/petty-cash/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash dashboard:', error);
      throw error;
    }
  },

  // ==================== BANK ACCOUNT MANAGEMENT ====================
  
  /**
   * Get all bank accounts for a church
   * @param {number} churchId - Church ID
   * @returns {Promise} - { accounts: [] }
   */
  getBankAccounts: async (churchId) => {
    try {
      const response = await api.get(`/churches/${churchId}/bank-accounts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      throw error;
    }
  },

  /**
   * Create a new bank account
   * @param {Object} data - { church_id, name, account_number, bank_name, branch, opening_balance, is_active }
   * @returns {Promise}
   */
  createBankAccount: async (data) => {
    try {
      const response = await api.post(`/churches/${data.church_id}/bank-accounts`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating bank account:', error);
      throw error;
    }
  },

  /**
   * Update a bank account
   * @param {number} accountId - Account ID
   * @param {Object} data - Updated account data
   * @returns {Promise}
   */
  updateBankAccount: async (accountId, data) => {
    try {
      const response = await api.put(`/bank-accounts/${accountId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  },

  /**
   * Delete a bank account
   * @param {number} accountId - Account ID
   * @returns {Promise}
   */
  deleteBankAccount: async (accountId) => {
    try {
      const response = await api.delete(`/bank-accounts/${accountId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  },

  /**
   * Get bank account transactions
   * @param {number} accountId - Account ID
   * @param {Object} params - { startDate, endDate, page, perPage }
   * @returns {Promise}
   */
  getBankAccountTransactions: async (accountId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/bank-accounts/${accountId}/transactions${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
      throw error;
    }
  },

  /**
   * Reconcile a bank account
   * @param {number} accountId - Account ID
   * @param {Object} data - { statement_balance, reconciliation_date, notes }
   * @returns {Promise}
   */
  reconcileBankAccount: async (accountId, data) => {
    try {
      const response = await api.post(`/bank-accounts/${accountId}/reconcile`, data);
      return response.data;
    } catch (error) {
      console.error('Error reconciling bank account:', error);
      throw error;
    }
  },

  // ==================== CASH FLOW & REPORTS ====================
  
  /**
   * Get cash flow analysis
   * @param {number} churchId - Church ID
   * @param {Object} params - { period, startDate, endDate }
   * @returns {Promise}
   */
  getCashFlowAnalysis: async (churchId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/churches/${churchId}/cash-flow${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching cash flow analysis:', error);
      throw error;
    }
  },

  /**
   * Get fund utilization report
   * @param {number} churchId - Church ID
   * @param {Object} params - { period }
   * @returns {Promise}
   */
  getFundUtilization: async (churchId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/churches/${churchId}/fund-utilization${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching fund utilization:', error);
      throw error;
    }
  },

  // ==================== EXPENSE CATEGORIES ====================
  
  /**
   * Get petty cash expense categories
   * @param {number} churchId - Church ID
   * @returns {Promise}
   */
  getExpenseCategories: async (churchId) => {
    try {
      const response = await api.get(`/churches/${churchId}/expense-categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  },

  /**
   * Create an expense category
   * @param {number} churchId - Church ID
   * @param {Object} data - { name, description, account_id }
   * @returns {Promise}
   */
  createExpenseCategory: async (churchId, data) => {
    try {
      const response = await api.post(`/churches/${churchId}/expense-categories`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating expense category:', error);
      throw error;
    }
  },

  /**
   * Update an expense category
   * @param {number} categoryId - Category ID
   * @param {Object} data - Updated category data
   * @returns {Promise}
   */
  updateExpenseCategory: async (categoryId, data) => {
    try {
      const response = await api.put(`/expense-categories/${categoryId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating expense category:', error);
      throw error;
    }
  },

  /**
   * Delete an expense category
   * @param {number} categoryId - Category ID
   * @returns {Promise}
   */
  deleteExpenseCategory: async (categoryId) => {
    try {
      const response = await api.delete(`/expense-categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting expense category:', error);
      throw error;
    }
  }
};

// Export the service as default and named export
export default churchService;
export { churchService };