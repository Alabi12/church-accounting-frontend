import api from './api';

export const memberService = {
  /**
   * Get members list with filters
   * @param {Object} params - Query parameters
   */
  getMembers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('perPage', params.perPage);
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
      
      const response = await api.get(`/members?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  },

  /**
   * Get single member by ID
   * @param {number} id - Member ID
   */
  getMemberById: async (id) => {
    try {
      const response = await api.get(`/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member:', error);
      throw error;
    }
  },

  /**
   * Create new member
   * @param {Object} data - Member data
   */
  createMember: async (data) => {
    try {
      const response = await api.post('/members', data);
      return response.data;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  },

  /**
   * Update member
   * @param {number} id - Member ID
   * @param {Object} data - Updated data
   */
  updateMember: async (id, data) => {
    try {
      const response = await api.put(`/members/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  /**
   * Delete/deactivate member
   * @param {number} id - Member ID
   */
  deleteMember: async (id) => {
    try {
      const response = await api.delete(`/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  },

  /**
   * Get member giving history
   * @param {number} id - Member ID
   * @param {Object} params - Query parameters (year, startDate, endDate)
   */
  getMemberGiving: async (id, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.year) queryParams.append('year', params.year);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await api.get(`/members/${id}/giving?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member giving:', error);
      throw error;
    }
  },

  /**
   * Get giving summary for all members
   * @param {Object} params - Query parameters
   */
  getGivingSummary: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.year) queryParams.append('year', params.year);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await api.get(`/members/giving/summary?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching giving summary:', error);
      throw error;
    }
  },

  /**
   * Search members
   * @param {string} query - Search query
   */
  searchMembers: async (query) => {
    try {
      const response = await api.get(`/members/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching members:', error);
      throw error;
    }
  },

  /**
   * Get member statistics
   */
  getMemberStats: async () => {
    try {
      const response = await api.get('/members/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching member stats:', error);
      throw error;
    }
  },

  /**
   * Export members data
   * @param {Object} filters - Filter parameters
   */
  exportMembers: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await api.get(`/members/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting members:', error);
      throw error;
    }
  },

  /**
   * Get member birthdays for a month
   * @param {number} month - Month (1-12)
   */
  getBirthdays: async (month) => {
    try {
      const response = await api.get(`/members/birthdays?month=${month}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching birthdays:', error);
      throw error;
    }
  },

  /**
   * Get member anniversaries for a month
   * @param {number} month - Month (1-12)
   */
  getAnniversaries: async (month) => {
    try {
      const response = await api.get(`/members/anniversaries?month=${month}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching anniversaries:', error);
      throw error;
    }
  },

  /**
   * Get top givers
   * @param {number} limit - Number of top givers to return
   * @param {number} year - Year to filter by
   */
  getTopGivers: async (limit = 10, year) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (year) params.append('year', year);
      
      const response = await api.get(`/members/top-givers?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top givers:', error);
      throw error;
    }
  }
};