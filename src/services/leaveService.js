// src/services/leaveService.js
import api from './api';

export const leaveService = {
  getWorkflowSummary: async () => {
    const response = await api.get('/accounting/leave/workflow-summary');
    // Return only the data part, not the entire axios response
    return response.data;
  },
  
  getLeaveRequests: async (params) => {
    const response = await api.get('/accounting/leave/requests', { params });
    // Return only the data part
    return response.data;
  },
  
  getLeaveBalances: async (params) => {
    const response = await api.get('/accounting/leave/balances', { params });
    return response.data;
  },
  
  getLeaveCalendar: async (params) => {
    const response = await api.get('/accounting/leave/calendar', { params });
    return response.data;
  },
  
  getLeaveTypes: async () => {
    const response = await api.get('/accounting/leave/types');
    return response.data;
  },
  
  createLeaveRequest: async (data) => {
    const response = await api.post('/accounting/leave/requests', data);
    return response.data;
  },
  
  pastorApproveLeave: async (id, data) => {
    const response = await api.post(`/accounting/leave/requests/${id}/pastor-approve`, data);
    return response.data;
  },
  
  processLeaveAllowance: async (id, data) => {
    const response = await api.post(`/accounting/leave/requests/${id}/process-allowance`, data);
    return response.data;
  },
  
  treasurerApproveAllowance: async (id, data) => {
    const response = await api.post(`/accounting/leave/requests/${id}/treasurer-approve`, data);
    return response.data;
  },
  
  postLeavePaymentToLedger: async (id, data) => {
    const response = await api.post(`/accounting/leave/requests/${id}/post-to-ledger`, data);
    return response.data;
  },
  
  rejectLeaveRequest: async (id, data) => {
    const response = await api.post(`/accounting/leave/requests/${id}/reject`, data);
    return response.data;
  },
  
  getLeaveRequest: async (id) => {
    const response = await api.get(`/accounting/leave/requests/${id}`);
    return response.data;
  },
};