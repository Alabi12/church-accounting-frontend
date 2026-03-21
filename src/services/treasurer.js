// services/treasurer.js
import api from './api';

export const treasurerService = {
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
      
      const url = `/treasurer/budgets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('📡 Fetching budgets:', url);
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching budgets:', error);
      throw error;
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
    try {
      console.log('📝 Creating budget:', budgetData);
      const response = await api.post('/treasurer/budgets', budgetData);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating budget:', error);
      throw error;
    }
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

  // ==================== EXPENSE MANAGEMENT ====================
  
  /**
   * Get expenses with filters
   * @param {Object} params 
   * @returns {Promise}
   */
  getExpenses: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('per_page', params.perPage);
      
      const url = `/treasurer/expenses${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching expenses:', error);
      throw error;
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

  // ==================== REPORTS ====================
  
  /**
   * Get cash flow analysis
   * @param {Object} params 
   * @returns {Promise}
   */
  getCashFlow: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const url = `/treasurer/cash-flow${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching cash flow:', error);
      throw error;
    }
  },

  /**
   * Get financial overview
   * @param {Object} params 
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
      throw error;
    }
  },

  /**
   * Get category breakdown
   * @param {string} period 
   * @returns {Promise}
   */
  getCategoryBreakdown: async (period = 'month') => {
    try {
      const response = await api.get(`/treasurer/category-breakdown?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching category breakdown:', error);
      throw error;
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

  approveExpense: async (expenseId) => {
    try {
      console.log(`✅ Approving expense ${expenseId}...`);
      const response = await api.post(`/treasurer/expenses/${expenseId}/approve`, {});
      console.log('✅ Approve response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error approving expense:', error);
      throw error;
    }
  },
};