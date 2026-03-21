// services/account.js
import api from './api';

// Export the service object directly
const accountService = {
  // ==================== ACCOUNT MANAGEMENT ====================
  
  /**
   * Get all accounts with filters
   * @param {Object} params - { church_id, type, is_active, search, page, perPage }
   * @returns {Promise} - { accounts, total, pages }
   */
  getAccounts: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.church_id) queryParams.append('church_id', params.church_id);
      if (params.type) queryParams.append('type', params.type);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('per_page', params.perPage);
      
      const url = `/accounts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  /**
   * Get a single account by ID
   * @param {number} accountId 
   * @returns {Promise}
   */
  getAccount: async (accountId) => {
    try {
      const response = await api.get(`/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  },

  /**
   * Create a new account
   * @param {Object} data - Account data
   * @returns {Promise}
   */
  createAccount: async (data) => {
    try {
      const response = await api.post('/accounts', data);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  /**
   * Update an account
   * @param {number} accountId 
   * @param {Object} data 
   * @returns {Promise}
   */
  updateAccount: async (accountId, data) => {
    try {
      const response = await api.put(`/accounts/${accountId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  /**
   * Delete an account
   * @param {number} accountId 
   * @returns {Promise}
   */
  deleteAccount: async (accountId) => {
    try {
      const response = await api.delete(`/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  /**
   * Get account types
   * @returns {Array} - List of account types
   */
  getAccountTypes: () => {
    return [
      { id: 'asset', name: 'Asset' },
      { id: 'liability', name: 'Liability' },
      { id: 'equity', name: 'Equity' },
      { id: 'income', name: 'Income' },
      { id: 'expense', name: 'Expense' },
      { id: 'bank', name: 'Bank' },
      { id: 'cash', name: 'Cash' }
    ];
  },

  /**
   * Get account by type (bank, cash, etc.)
   * @param {number} churchId 
   * @param {string} type 
   * @returns {Promise}
   */
  getAccountsByType: async (churchId, type) => {
    try {
      const response = await api.get(`/accounts`, {
        params: { church_id: churchId, type }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} accounts:`, error);
      throw error;
    }
  },

  /**
   * Get account balance
   * @param {number} accountId 
   * @returns {Promise}
   */
  getAccountBalance: async (accountId) => {
    try {
      const response = await api.get(`/accounts/${accountId}/balance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account balance:', error);
      throw error;
    }
  },

  /**
   * Get account transactions
   * @param {number} accountId 
   * @param {Object} params 
   * @returns {Promise}
   */
  getAccountTransactions: async (accountId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/accounts/${accountId}/transactions${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      throw error;
    }
  }
};

// Export the service as default and named export
export default accountService;
export { accountService };