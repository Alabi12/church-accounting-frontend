// src/services/leaveService.js
import api from './api';

export const leaveService = {
  // Leave balances
  getLeaveBalances: (params) => api.get('/leave/balances', { params }),
  initializeLeaveBalances: (data) => api.post('/leave/balances/initialize', data),

  // Leave requests
  getLeaveRequests: (params) => api.get('/leave/requests', { params }),
  createLeaveRequest: (data) => api.post('/leave/requests', data),
  getLeaveRequest: (id) => api.get(`/leave/requests/${id}`),
  approveLeaveRequest: (id) => api.post(`/leave/requests/${id}/approve`),
  rejectLeaveRequest: (id, data) => api.post(`/leave/requests/${id}/reject`, data),

  // Leave calendar
  getLeaveCalendar: (params) => api.get('/leave/calendar', { params }),
};