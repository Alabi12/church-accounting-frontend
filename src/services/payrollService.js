// src/services/payrollService.js
import api from './api';

export const payrollService = {
  // ==================== EMPLOYEE MANAGEMENT ====================
  
  getEmployees: async (params = {}) => {
    try {
      const response = await api.get('/payroll/employees', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  getEmployee: async (id) => {
    try {
      const response = await api.get(`/payroll/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  createEmployee: async (data) => {
    try {
      const response = await api.post('/payroll/employees', data);
      return response.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  updateEmployee: async (id, data) => {
    try {
      const response = await api.put(`/payroll/employees/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    try {
      const response = await api.delete(`/payroll/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  // ==================== PAYROLL CALCULATION ====================

  calculatePayroll: async (params) => {
    try {
      const response = await api.post('/payroll/calculate', params);
      return response.data;
    } catch (error) {
      console.error('Error calculating payroll:', error);
      throw error;
    }
  },

  getPayrollSummary: async (params) => {
    try {
      const response = await api.get('/payroll/summary', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      throw error;
    }
  },

  // ==================== PAYROLL RUNS ====================

  getPayrollRuns: async (params = {}) => {
    try {
      const response = await api.get('/payroll/runs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll runs:', error);
      throw error;
    }
  },

  getPayrollRun: async (id) => {
    try {
      const response = await api.get(`/payroll/runs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll run:', error);
      throw error;
    }
  },

  createPayrollRun: async (data) => {
    try {
      const response = await api.post('/payroll/runs', data);
      return response.data;
    } catch (error) {
      console.error('Error creating payroll run:', error);
      throw error;
    }
  },

  submitPayrollRun: async (id) => {
    try {
      const response = await api.post(`/payroll/runs/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error('Error submitting payroll run:', error);
      throw error;
    }
  },

  approvePayrollRun: async (id, comments = '') => {
    try {
      const response = await api.post(`/payroll/runs/${id}/approve`, { comments });
      return response.data;
    } catch (error) {
      console.error('Error approving payroll run:', error);
      throw error;
    }
  },

  rejectPayrollRun: async (id, data) => {
    try {
      const response = await api.post(`/payroll/runs/${id}/reject`, data);
      return response.data;
    } catch (error) {
      console.error('Error rejecting payroll run:', error);
      throw error;
    }
  },

  processPayrollRun: async (id) => {
    try {
      const response = await api.post(`/payroll/runs/${id}/process`);
      return response.data;
    } catch (error) {
      console.error('Error processing payroll run:', error);
      throw error;
    }
  },

  postPayrollJournal: async (id) => {
    try {
      const response = await api.post(`/payroll/runs/${id}/post-journal`);
      return response.data;
    } catch (error) {
      console.error('Error posting payroll journal:', error);
      throw error;
    }
  },

  // ==================== PAYSLIP METHODS ====================

  getPayslips: async (params = {}) => {
    try {
      const response = await api.get('/payroll/payslips', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payslips:', error);
      throw error;
    }
  },

  getPayrollRunPayslips: async (runId) => {
    try {
      const response = await api.get(`/payroll/runs/${runId}/payslips`);
      return response.data;
    } catch (error) {
      console.error('Error fetching run payslips:', error);
      throw error;
    }
  },

  getPayslip: async (payslipId) => {
    try {
      const response = await api.get(`/payroll/payslips/${payslipId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payslip:', error);
      throw error;
    }
  },

  generatePayslips: async (runId) => {
    try {
      const response = await api.post(`/payroll/runs/${runId}/generate-payslips`);
      return response.data;
    } catch (error) {
      console.error('Error generating payslips:', error);
      throw error;
    }
  },

  downloadPayslip: async (payslipId) => {
    try {
      const response = await api.get(`/payroll/payslips/${payslipId}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error downloading payslip:', error);
      throw error;
    }
  },

  emailPayslip: async (payslipId) => {
    try {
      const response = await api.post(`/payroll/payslips/${payslipId}/email`);
      return response.data;
    } catch (error) {
      console.error('Error emailing payslip:', error);
      throw error;
    }
  },

  bulkEmailPayslips: async (runId, employeeIds = []) => {
    try {
      const response = await api.post(`/payroll/runs/${runId}/email-payslips`, {
        employee_ids: employeeIds
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk emailing payslips:', error);
      throw error;
    }
  },

  markPayslipViewed: async (payslipId) => {
    try {
      const response = await api.post(`/payroll/payslips/${payslipId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error marking payslip as viewed:', error);
      throw error;
    }
  },

  signPayslip: async (payslipId, signatureData) => {
    try {
      const response = await api.post(`/payroll/payslips/${payslipId}/sign`, signatureData);
      return response.data;
    } catch (error) {
      console.error('Error signing payslip:', error);
      throw error;
    }
  },

  // ==================== REPORTS ====================

  exportPayrollReport: async (params, format = 'csv') => {
    try {
      const response = await api.get('/payroll/reports/export', {
        params: { ...params, format },
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting payroll report:', error);
      throw error;
    }
  },

  // ==================== DASHBOARD ====================

  getPayrollDashboard: async () => {
    try {
      const response = await api.get('/payroll/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll dashboard:', error);
      throw error;
    }
  },

  // ==================== TAX TABLES ====================

  getTaxTables: async (year) => {
    try {
      const response = await api.get('/payroll/tax-tables', { params: { year } });
      return response.data;
    } catch (error) {
      console.error('Error fetching tax tables:', error);
      throw error;
    }
  },

  // ==================== DEPARTMENTS ====================

  getDepartments: async () => {
    try {
      const response = await api.get('/payroll/departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // ==================== HELPER METHODS ====================

  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  },

  formatDate: (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  getStatusColor: (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      processed: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  },

  getStatusBadge: (status) => {
    const statusMap = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted: { color: 'bg-yellow-100 text-yellow-800', label: 'Submitted' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      processed: { color: 'bg-purple-100 text-purple-800', label: 'Processed' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    const s = statusMap[status?.toLowerCase()] || statusMap.draft;
    return {
      color: s.color,
      label: s.label
    };
  },

  getEmploymentTypeLabel: (type) => {
    const labels = {
      'FULL_TIME': 'Full Time',
      'PART_TIME': 'Part Time',
      'CONTRACTOR': 'Contractor',
      'CASUAL': 'Casual'
    };
    return labels[type] || type;
  },

  getPayFrequencyLabel: (frequency) => {
    const labels = {
      'monthly': 'Monthly',
      'bi-weekly': 'Bi-Weekly',
      'weekly': 'Weekly'
    };
    return labels[frequency] || frequency;
  },

  getPayTypeLabel: (type) => {
    const labels = {
      'salary': 'Salary',
      'hourly': 'Hourly'
    };
    return labels[type] || type;
  }
};

export default payrollService;