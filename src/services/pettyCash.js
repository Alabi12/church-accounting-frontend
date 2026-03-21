// services/pettyCash.js
import api from './api';

export const pettyCashService = {
  // ==================== FUND MANAGEMENT ====================
  
  /**
   * Get all petty cash funds
   * @param {Object} params - { church_id, status }
   * @returns {Promise}
   */
  getFunds: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/petty-cash/funds${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash funds:', error);
      throw error;
    }
  },

  /**
   * Get a single fund by ID
   * @param {number} fundId 
   * @returns {Promise}
   */
  getFund: async (fundId) => {
    try {
      const response = await api.get(`/petty-cash/funds/${fundId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash fund:', error);
      throw error;
    }
  },

  /**
   * Create a new petty cash fund
   * @param {Object} data 
   * @returns {Promise}
   */
  createFund: async (data) => {
    try {
      const response = await api.post('/petty-cash/funds', data);
      return response.data;
    } catch (error) {
      console.error('Error creating petty cash fund:', error);
      throw error;
    }
  },

  /**
   * Update a petty cash fund
   * @param {number} fundId 
   * @param {Object} data 
   * @returns {Promise}
   */
  updateFund: async (fundId, data) => {
    try {
      const response = await api.put(`/petty-cash/funds/${fundId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating petty cash fund:', error);
      throw error;
    }
  },

  /**
   * Delete a petty cash fund
   * @param {number} fundId 
   * @returns {Promise}
   */
  deleteFund: async (fundId) => {
    try {
      const response = await api.delete(`/petty-cash/funds/${fundId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting petty cash fund:', error);
      throw error;
    }
  },

  /**
   * Top up a petty cash fund
   * @param {number} fundId 
   * @param {Object} data - { amount, reference, notes }
   * @returns {Promise}
   */
  topupFund: async (fundId, data) => {
    try {
      const response = await api.post(`/petty-cash/funds/${fundId}/topup`, data);
      return response.data;
    } catch (error) {
      console.error('Error topping up petty cash fund:', error);
      throw error;
    }
  },

  // ==================== TRANSACTION MANAGEMENT ====================
  
  /**
   * Get transactions for a fund
   * @param {number} fundId 
   * @param {Object} params - { status, startDate, endDate, page, perPage }
   * @returns {Promise}
   */
  getTransactions: async (fundId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/petty-cash/funds/${fundId}/transactions${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash transactions:', error);
      throw error;
    }
  },

  /**
   * Create an expense request
   * @param {number} fundId 
   * @param {Object} data - { description, amount, category, receipt, notes }
   * @returns {Promise}
   */
  createExpense: async (fundId, data) => {
    try {
      const response = await api.post(`/petty-cash/funds/${fundId}/expenses`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating petty cash expense:', error);
      throw error;
    }
  },

  /**
   * Get a single transaction
   * @param {number} transactionId 
   * @returns {Promise}
   */
  getTransaction: async (transactionId) => {
    try {
      const response = await api.get(`/petty-cash/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash transaction:', error);
      throw error;
    }
  },

  /**
   * Approve an expense
   * @param {number} transactionId 
   * @param {Object} data - { notes }
   * @returns {Promise}
   */
  approveExpense: async (transactionId, data = {}) => {
    try {
      const response = await api.post(`/petty-cash/transactions/${transactionId}/approve`, data);
      return response.data;
    } catch (error) {
      console.error('Error approving petty cash expense:', error);
      throw error;
    }
  },

  /**
   * Reject an expense
   * @param {number} transactionId 
   * @param {Object} data - { reason, notes }
   * @returns {Promise}
   */
  rejectExpense: async (transactionId, data) => {
    try {
      const response = await api.post(`/petty-cash/transactions/${transactionId}/reject`, data);
      return response.data;
    } catch (error) {
      console.error('Error rejecting petty cash expense:', error);
      throw error;
    }
  },

  /**
   * Reimburse an expense
   * @param {number} transactionId 
   * @param {Object} data - { method, reference, notes }
   * @returns {Promise}
   */
  reimburseExpense: async (transactionId, data) => {
    try {
      const response = await api.post(`/petty-cash/transactions/${transactionId}/reimburse`, data);
      return response.data;
    } catch (error) {
      console.error('Error reimbursing petty cash expense:', error);
      throw error;
    }
  },

  // ==================== CATEGORIES ====================
  
  /**
   * Get expense categories
   * @param {number} churchId 
   * @returns {Promise}
   */
  getCategories: async (churchId) => {
    try {
      const response = await api.get(`/petty-cash/categories?church_id=${churchId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash categories:', error);
      throw error;
    }
  },

  /**
   * Create an expense category
   * @param {Object} data - { church_id, name, description, account_id }
   * @returns {Promise}
   */
  createCategory: async (data) => {
    try {
      const response = await api.post('/petty-cash/categories', data);
      return response.data;
    } catch (error) {
      console.error('Error creating petty cash category:', error);
      throw error;
    }
  },

  /**
   * Update an expense category
   * @param {number} categoryId 
   * @param {Object} data 
   * @returns {Promise}
   */
  updateCategory: async (categoryId, data) => {
    try {
      const response = await api.put(`/petty-cash/categories/${categoryId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating petty cash category:', error);
      throw error;
    }
  },

  /**
   * Delete an expense category
   * @param {number} categoryId 
   * @returns {Promise}
   */
  deleteCategory: async (categoryId) => {
    try {
      const response = await api.delete(`/petty-cash/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting petty cash category:', error);
      throw error;
    }
  },

  // ==================== DASHBOARD & REPORTS ====================
  
  /**
   * Get petty cash dashboard
   * @param {number} churchId 
   * @returns {Promise}
   */
  getDashboard: async (churchId) => {
    try {
      const response = await api.get(`/petty-cash/dashboard?church_id=${churchId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petty cash dashboard:', error);
      throw error;
    }
  },

  /**
   * Get fund utilization report
   * @param {number} fundId 
   * @param {Object} params - { period }
   * @returns {Promise}
   */
  getFundUtilization: async (fundId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/petty-cash/funds/${fundId}/utilization${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching fund utilization:', error);
      throw error;
    }
  },

  /**
   * Export transactions
   * @param {number} fundId 
   * @param {Object} params - { startDate, endDate, format }
   * @returns {Promise}
   */
  exportTransactions: async (fundId, params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `/petty-cash/funds/${fundId}/export${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw error;
    }
  }
};