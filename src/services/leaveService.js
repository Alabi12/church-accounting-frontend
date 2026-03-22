// src/services/leaveService.js
import api from './api';

export const leaveService = {
  // Get leave balances
  getLeaveBalances: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.employee_id) queryParams.append('employee_id', params.employee_id);
      if (params.year) queryParams.append('year', params.year);
      if (params.leave_type) queryParams.append('leave_type', params.leave_type);
      
      const response = await api.get(`/leave/balances?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      throw error;
    }
  },

  // Initialize leave balances for a year
  initializeLeaveBalances: async (data) => {
    try {
      const response = await api.post('/leave/balances/initialize', data);
      return response.data;
    } catch (error) {
      console.error('Error initializing leave balances:', error);
      throw error;
    }
  },

  // Get leave requests
  getLeaveRequests: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.employee_id) queryParams.append('employee_id', params.employee_id);
      if (params.from_date) queryParams.append('from_date', params.from_date);
      if (params.to_date) queryParams.append('to_date', params.to_date);
      
      const response = await api.get(`/leave/requests?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      throw error;
    }
  },

  // Get single leave request
  getLeaveRequest: async (id) => {
    try {
      const response = await api.get(`/leave/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leave request:', error);
      throw error;
    }
  },

  // Create leave request - FIXED: Ensure dates are in correct format
  createLeaveRequest: async (data) => {
    try {
      console.log('📝 Creating leave request with data:', data);
      
      // Format the dates properly
      const payload = {
        employee_id: parseInt(data.employee_id),
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason || ''
      };
      
      console.log('📤 Sending payload:', payload);
      
      const response = await api.post('/leave/requests', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating leave request:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      throw error;
    }
  },

  // Approve leave request
  approveLeaveRequest: async (id) => {
    try {
      const response = await api.post(`/leave/requests/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving leave request:', error);
      throw error;
    }
  },

  // Reject leave request
  rejectLeaveRequest: async (id, data) => {
    try {
      const response = await api.post(`/leave/requests/${id}/reject`, data);
      return response.data;
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      throw error;
    }
  },

  // Get leave calendar
  getLeaveCalendar: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.year) queryParams.append('year', params.year);
      if (params.month) queryParams.append('month', params.month);
      
      const response = await api.get(`/leave/calendar?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leave calendar:', error);
      throw error;
    }
  },
};

export default leaveService;