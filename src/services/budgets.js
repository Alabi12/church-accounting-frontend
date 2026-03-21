// services/budgets.js
import api from './api';

export const budgetService = {
  getBudgets: async (params = {}) => {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.perPage) queryParams.append('perPage', params.perPage);
      if (params.page) queryParams.append('page', params.page);
      if (params.search) queryParams.append('search', params.search);
      if (params.department) queryParams.append('department', params.department);
      
      const url = `/treasurer/budgets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('📡 Fetching budgets from:', url);
      
      const response = await api.get(url);
      console.log('📦 Budgets response:', response.data);
      
      // Transform backend response to match frontend expectations
      return {
        budgets: response.data.budgets || response.data.items || [],
        stats: response.data.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalAmount: 0
        },
        pagination: {
          page: response.data.currentPage || response.data.page || 1,
          per_page: response.data.per_page || params.perPage || 20,
          pages: response.data.pages || 1,
          total: response.data.total || 0
        }
      };
    } catch (error) {
      console.error('❌ Error fetching budgets:', error);
      throw error;
    }
  },
  
  // ✅ ADD THIS METHOD - Create a new budget
  createBudget: async (budgetData) => {
    try {
      console.log('📝 Creating new budget:', budgetData);
      
      // Format the data for the backend
      const formattedData = {
        name: budgetData.name,
        description: budgetData.description || '',
        department: budgetData.department,
        fiscal_year: budgetData.fiscalYear,
        amount: parseFloat(budgetData.amount),
        start_date: budgetData.startDate,
        end_date: budgetData.endDate,
        priority: budgetData.priority || 'MEDIUM',
        justification: budgetData.justification || '',
        categories: budgetData.categories || []
      };
      
      const response = await api.post('/treasurer/budgets', formattedData);
      console.log('✅ Budget created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating budget:', error);
      throw error;
    }
  },
  
  // Get a single budget by ID
  // getBudget: async (budgetId) => {
  //   try {
  //     const response = await api.get(`/treasurer/budgets/${budgetId}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error('❌ Error fetching budget:', error);
  //     throw error;
  //   }
  // },

  getBudgetById: async (budgetId) => {
    try {
      console.log(`📡 Fetching budget with ID: ${budgetId}`);
      const response = await api.get(`/treasurer/budgets/${budgetId}`);
      console.log('📦 Budget data:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching budget ${budgetId}:`, error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },

  getBudget: async (budgetId) => {
    return budgetService.getBudgetById(budgetId);
  },
  

  // Add to budgetService
submitBudgetForApproval: async (budgetId) => {
  try {
    const response = await api.post(`/treasurer/budgets/${budgetId}/submit`);
    return response.data;
  } catch (error) {
    console.error('Error submitting budget:', error);
    throw error;
  }
},

  // Update an existing budget
  updateBudget: async (budgetId, budgetData) => {
    try {
      console.log('📝 Updating budget:', budgetId, budgetData);
      
      const formattedData = {
        name: budgetData.name,
        description: budgetData.description,
        department: budgetData.department,
        fiscal_year: budgetData.fiscalYear,
        amount: parseFloat(budgetData.amount),
        start_date: budgetData.startDate,
        end_date: budgetData.endDate,
        priority: budgetData.priority,
        justification: budgetData.justification
      };
      
      const response = await api.put(`/treasurer/budgets/${budgetId}`, formattedData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating budget:', error);
      throw error;
    }
  },
  
  // Approve a budget
  approveBudget: async (budgetId, comments = '', amount = null) => {
    try {
      const data = {};
      if (comments) data.comments = comments;
      if (amount) data.amount = amount;
      
      const response = await api.post(`/treasurer/budgets/${budgetId}/approve`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Error approving budget:', error);
      throw error;
    }
  },
  
  // Reject a budget
  rejectBudget: async (budgetId, reason) => {
    try {
      const response = await api.post(`/treasurer/budgets/${budgetId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error('❌ Error rejecting budget:', error);
      throw error;
    }
  },
  
  // Get budget comments
  getBudgetComments: async (budgetId) => {
    try {
      const response = await api.get(`/treasurer/budgets/${budgetId}/comments`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching budget comments:', error);
      throw error;
    }
  },
  
  // Add a comment to a budget
  addBudgetComment: async (budgetId, comment) => {
    try {
      const response = await api.post(`/treasurer/budgets/${budgetId}/comments`, { comment });
      return response.data;
    } catch (error) {
      console.error('❌ Error adding budget comment:', error);
      throw error;
    }
  },
  
  // Get budget statistics
  getBudgetStats: async () => {
    try {
      const response = await api.get('/treasurer/budget-stats');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching budget stats:', error);
      throw error;
    }
  },
  
  // Delete a budget (if allowed)
  deleteBudget: async (budgetId) => {
    try {
      const response = await api.delete(`/treasurer/budgets/${budgetId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting budget:', error);
      throw error;
    }
  }
};