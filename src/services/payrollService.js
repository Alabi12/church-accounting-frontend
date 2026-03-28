// src/services/payrollService.js
import api from './api';

export const payrollService = {
  // ==================== EMPLOYEE MANAGEMENT ====================
  getEmployees: (params = {}) => api.get('/payroll/employees', { params }),
  getEmployee: (id) => api.get(`/payroll/employees/${id}`),
  createEmployee: (data) => api.post('/payroll/employees', data),
  updateEmployee: (id, data) => api.put(`/payroll/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/payroll/employees/${id}`),
  getDepartments: () => api.get('/payroll/departments'),
  
  // ==================== PAYROLL CALCULATION ====================
  calculatePayroll: (data) => api.post('/payroll/calculate', data),
  
  // ==================== PAYROLL RUNS ====================
  getPayrollRuns: (params = {}) => api.get('/payroll/runs', { params }),
  getPayrollRun: (id) => api.get(`/payroll/runs/${id}`),
  initiatePayrollRun: (data) => api.post('/payroll/runs/initiate', data),
  approvePayrollRun: (id) => api.post(`/payroll/runs/${id}/approve`),
  rejectPayrollRun: (id, data) => api.post(`/payroll/runs/${id}/reject`, data),
  postPayrollJournal: (id) => api.post(`/payroll/runs/${id}/post`),
  
  // ==================== PAYSLIPS ====================
  getPayslips: (params = {}) => api.get('/payslip/all', { params }),
  getPayslipsByRun: (runId) => api.get(`/payslip/run/${runId}`),
  getEmployeePayslips: (employeeId) => api.get(`/payslip/employee/${employeeId}`),
  generatePayslips: (runId) => api.post(`/payslip/generate/${runId}`),
  downloadPayslip: (payslipId) => api.get(`/payslip/${payslipId}/download`, { responseType: 'blob' }),
  bulkEmailPayslips: (runId) => api.post(`/payslip/bulk-email/${runId}`),
  
  // ==================== PAYROLL SETTINGS ====================
  getDeductionTypes: () => api.get('/payroll/deduction-types'),
  getTaxTables: () => api.get('/payroll/tax-tables'),


    getPayrollDashboard: async () => {
    try {
      const response = await api.get('/payroll/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll dashboard:', error);
      throw error;
    }
  },

  // src/services/payrollService.js

getTaxTables: async (year = null) => {
  try {
    const params = year ? { year } : {};
    const response = await api.get('/payroll/tax-tables', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching tax tables:', error);
    throw error;
  }
},

getDeductionTypes: async () => {
  try {
    const response = await api.get('/payroll/deduction-types');
    return response.data;
  } catch (error) {
    console.error('Error fetching deduction types:', error);
    throw error;
  }
},
};