import api from './api';

export const donationService = {
  /**
   * Get donations list with filters
   * @param {Object} params - Query parameters
   */
  getDonations: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('perPage', params.perPage);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.category) queryParams.append('category', params.category);
      if (params.memberId) queryParams.append('memberId', params.memberId);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await api.get(`/donations?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching donations:', error);
      throw error;
    }
  },

  /**
   * Create new donation
   * @param {Object} data - Donation data
   */
  createDonation: async (data) => {
    try {
      const response = await api.post('/donations', data);
      return response.data;
    } catch (error) {
      console.error('Error creating donation:', error);
      throw error;
    }
  },

  /**
   * Get donation summary
   * @param {number} year - Year to summarize
   */
  getDonationSummary: async (year) => {
    try {
      const response = await api.get(`/donations/summary?year=${year}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching donation summary:', error);
      throw error;
    }
  },

  /**
   * Export donations
   * @param {Object} params - Export parameters
   */
  exportDonations: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.year) queryParams.append('year', params.year);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.category) queryParams.append('category', params.category);
      if (params.memberId) queryParams.append('memberId', params.memberId);
      if (params.format) queryParams.append('format', params.format);
      
      const response = await api.get(`/donations/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `donations_${new Date().toISOString().split('T')[0]}.${params.format || 'csv'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting donations:', error);
      throw error;
    }
  },

  /**
   * Get donation categories
   */
  getDonationCategories: async () => {
    try {
      const response = await api.get('/donations/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching donation categories:', error);
      // Return default categories if API fails
      return [
        { id: 'TITHE', name: 'Tithe' },
        { id: 'OFFERING', name: 'Offering' },
        { id: 'SPECIAL_OFFERING', name: 'Special Offering' },
        { id: 'DONATION', name: 'Donation' },
        { id: 'PLEDGE', name: 'Pledge' },
        { id: 'MISSION', name: 'Mission' },
      ];
    }
  },

  /**
   * Get donations by member
   * @param {number} memberId - Member ID
   * @param {Object} params - Query parameters
   */
  getDonationsByMember: async (memberId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.year) queryParams.append('year', params.year);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await api.get(`/donations/member/${memberId}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member donations:', error);
      throw error;
    }
  },

  /**
   * Get donation statistics
   * @param {Object} params - Query parameters
   */
  getDonationStats: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.year) queryParams.append('year', params.year);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await api.get(`/donations/stats?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching donation stats:', error);
      throw error;
    }
  },

  /**
   * Get top donors
   * @param {number} limit - Number of top donors to return
   * @param {number} year - Year to filter by
   */
  getTopDonors: async (limit = 20, year) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (year) params.append('year', year);
      
      const response = await api.get(`/donations/top-donors?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top donors:', error);
      throw error;
    }
  },

  /**
   * Get monthly breakdown
   * @param {number} year - Year to filter by
   */
  getMonthlyBreakdown: async (year) => {
    try {
      const response = await api.get(`/donations/monthly?year=${year}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly breakdown:', error);
      throw error;
    }
  },

  /**
   * Get quarterly breakdown
   * @param {number} year - Year to filter by
   */
  getQuarterlyBreakdown: async (year) => {
    try {
      const response = await api.get(`/donations/quarterly?year=${year}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quarterly breakdown:', error);
      throw error;
    }
  }
};