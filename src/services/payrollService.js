// src/services/payrollService.js
import api from './api';

export const payrollService = {
  // Employee endpoints
  getEmployees: (params) => api.get('/payroll/employees', { params }),
  getEmployee: (id) => api.get(`/payroll/employees/${id}`),
  createEmployee: (data) => api.post('/payroll/employees', data),
  updateEmployee: (id, data) => api.put(`/payroll/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/payroll/employees/${id}`),
  getPayrollRuns: (params) => api.get('/payroll/runs', { params }),
  getPayrollRun: (id) => api.get(`/payroll/runs/${id}`),
  initiatePayrollRun: (data) => api.post('/payroll/runs/initiate', data),
  calculatePayroll: (data) => api.post('/payroll/calculate', data),
  approvePayroll: (id) => api.post(`/payroll/${id}/approve`),
  rejectPayroll: (id, data) => api.post(`/payroll/${id}/reject`, data),
  postPayrollJournal: (id) => api.post(`/payroll/${id}/post`),
  generatePayslips: (runId) => api.post(`/payslip/generate/${runId}`),
  bulkEmailPayslips: (runId) => api.post(`/payslip/bulk-email/${runId}`),
  getPayrollRunPayslips: (runId) => api.get(`/payslip/run/${runId}`),

  // Payroll processing
calculatePayroll: (data) => api.post('/payroll/calculate', data),
processPayroll: (data) => api.post('/payroll/process', data),
getPayrollRuns: (params) => api.get('/payroll/runs', { params }),
getPayrollRun: (id) => api.get(`/payroll/runs/${id}`),  // Changed: added 'runs/'
approvePayroll: (id) => api.post(`/payroll/${id}/approve`),  // Changed
rejectPayroll: (id, data) => api.post(`/payroll/${id}/reject`, data),  // Changed
postPayrollJournal: (id) => api.post(`/payroll/${id}/post`),  // Changed

  // Payslip endpoints
  generatePayslips: (runId) => api.post(`/payslip/generate/${runId}`),

  getPayslips: (employeeId) => {
  if (!employeeId) {
    // Return empty array or fetch all payslips
    return Promise.resolve({ data: { payslips: [] } });
    // OR if you have an endpoint for all payslips:
    // return api.get('/payslip/all');
  }
  return api.get(`/payslip/employee/${employeeId}`);
},

// In payrollService.js
getAllPayslips: () => api.get('/payslip/all'),
getPayslips: (employeeId) => {
  if (!employeeId) {
    return api.get('/payslip/all');
  }
  return api.get(`/payslip/employee/${employeeId}`);
},
  getPayslip: (id) => api.get(`/payslip/${id}`),
  downloadPayslip: (id) => api.get(`/payslip/${id}/download`, { responseType: 'blob' }),
  signPayslip: (id, signature) => api.post(`/payslip/${id}/sign`, { signature }),
  markPayslipViewed: (id) => api.post(`/payslip/${id}/view`),
  bulkEmailPayslips: (runId) => api.post(`/payslip/bulk-email/${runId}`),

  // Deduction types
  getDeductionTypes: () => api.get('/payroll/deduction-types'),
  createDeductionType: (data) => api.post('/payroll/deduction-types', data),
  updateDeductionType: (id, data) => api.put(`/payroll/deduction-types/${id}`, data),
  deleteDeductionType: (id) => api.delete(`/payroll/deduction-types/${id}`),

  // Employee deductions
  getEmployeeDeductions: (employeeId) => api.get(`/payroll/employees/${employeeId}/deductions`),
  addEmployeeDeduction: (employeeId, data) => api.post(`/payroll/employees/${employeeId}/deductions`, data),
  removeEmployeeDeduction: (employeeId, deductionId) => 
    api.delete(`/payroll/employees/${employeeId}/deductions/${deductionId}`),

  // Tax tables
  getTaxTables: (params) => api.get('/tax/tables', { params }),
  createTaxTable: (data) => api.post('/tax/tables', data),
  updateTaxTable: (id, data) => api.put(`/tax/tables/${id}`, data),
  deleteTaxTable: (id) => api.delete(`/tax/tables/${id}`),
  calculateTax: (data) => api.post('/tax/calculate', data),

  // Reports
  getPayrollSummary: (params) => api.get('/payroll/reports/summary', { params }),
  getEmployeeEarnings: (params) => api.get('/payroll/reports/employee-earnings', { params }),
  getTaxSummary: (params) => api.get('/payroll/reports/tax-summary', { params }),

  // Dashboard
  getPayrollDashboard: () => api.get('/payroll/dashboard'),
};

// Leave service
export const leaveService = {
  getLeaveBalances: (params) => api.get('/leave/balances', { params }),
  initializeLeaveBalances: (data) => api.post('/leave/balances/initialize', data),
  getLeaveRequests: (params) => api.get('/leave/requests', { params }),
  createLeaveRequest: (data) => api.post('/leave/requests', data),
  approveLeaveRequest: (id) => api.post(`/leave/requests/${id}/approve`),
  rejectLeaveRequest: (id, data) => api.post(`/leave/requests/${id}/reject`, data),
  getLeaveCalendar: (params) => api.get('/leave/calendar', { params }),
};