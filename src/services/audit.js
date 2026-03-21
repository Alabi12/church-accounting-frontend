import api from './api';

export const auditService = {
  async getAuditLogs(params = {}) {
    const response = await api.get('/audit/logs', { params });
    return response.data;
  },

  async getPendingReviews() {
    const response = await api.get('/audit/pending-reviews');
    return response.data;
  },

  async getFlaggedTransactions() {
    const response = await api.get('/audit/flagged-transactions');
    return response.data;
  },

  async reviewTransaction(id, data) {
    const response = await api.post(`/audit/transactions/${id}/review`, data);
    return response.data;
  },

  async flagTransaction(id, data) {
    const response = await api.post(`/audit/transactions/${id}/flag`, data);
    return response.data;
  },

  async getComplianceReport(params = {}) {
    const response = await api.get('/audit/compliance-report', { params });
    return response.data;
  }
};