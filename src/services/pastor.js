// services/pastor.js
import api from './api';

export const pastorService = {
  // Get pending budgets for approval
  getPendingBudgets: async () => {
    try {
      const response = await api.get('/pastor/pending-budgets');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending budgets:', error);
      throw error;
    }
  },
  
  // Approve a budget
  approveBudget: async (budgetId, comments = '') => {
    try {
      const response = await api.post(`/pastor/budgets/${budgetId}/approve`, { comments });
      return response.data;
    } catch (error) {
      console.error('Error approving budget:', error);
      throw error;
    }
  },
  
  // Reject a budget with reason
  rejectBudget: async (budgetId, reason, comments = '') => {
    try {
      const response = await api.post(`/pastor/budgets/${budgetId}/reject`, { reason, comments });
      return response.data;
    } catch (error) {
      console.error('Error rejecting budget:', error);
      throw error;
    }
  },
  
  // Get budget details
  getBudgetDetails: async (budgetId) => {
    try {
      const response = await api.get(`/pastor/budgets/${budgetId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching budget details:', error);
      throw error;
    }
  },
  
  // Get pastor dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/pastor/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching pastor stats:', error);
      throw error;
    }
  }
};