import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalculatorIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PayrollCalculate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [calculationResult, setCalculationResult] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getEmployees({ status: 'active' });
      setEmployees(response.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!periodStart || !periodEnd) {
      toast.error('Please select both start and end dates');
      return;
    }

    setCalculating(true);
    try {
      const response = await payrollService.calculatePayroll({
        period_start: periodStart,
        period_end: periodEnd
      });
      setCalculationResult(response);
      toast.success('Payroll calculated successfully');
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast.error(error.response?.data?.error || 'Failed to calculate payroll');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!calculationResult) {
      toast.error('Please calculate payroll first');
      return;
    }

    try {
      const paymentDate = new Date(new Date(periodEnd).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await payrollService.initiatePayrollRun({
        period_start: periodStart,
        period_end: periodEnd,
        payment_date: paymentDate
      });
      toast.success('Payroll submitted for treasurer approval');
      navigate('/payroll/runs');
    } catch (error) {
      console.error('Error submitting payroll:', error);
      toast.error(error.response?.data?.error || 'Failed to submit payroll');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTotalGross = () => {
    if (!calculationResult?.data) return 0;
    if (Array.isArray(calculationResult.data)) {
      return calculationResult.data.reduce((sum, emp) => sum + (emp.gross_salary || 0), 0);
    }
    return calculationResult.data.gross_salary || 0;
  };

  const getTotalNet = () => {
    if (!calculationResult?.data) return 0;
    if (Array.isArray(calculationResult.data)) {
      return calculationResult.data.reduce((sum, emp) => sum + (emp.net_salary || 0), 0);
    }
    return calculationResult.data.net_salary || 0;
  };

  const getTotalTax = () => {
    if (!calculationResult?.data) return 0;
    if (Array.isArray(calculationResult.data)) {
      return calculationResult.data.reduce((sum, emp) => sum + (emp.deductions?.paye_tax || 0), 0);
    }
    return calculationResult.data.deductions?.paye_tax || 0;
  };

  const getTotalSSNIT = () => {
    if (!calculationResult?.data) return 0;
    if (Array.isArray(calculationResult.data)) {
      return calculationResult.data.reduce((sum, emp) => sum + (emp.deductions?.ssnit_employee || 0), 0);
    }
    return calculationResult.data.deductions?.ssnit_employee || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/payroll/dashboard')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Calculation Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-6">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center">
                  <CalculatorIcon className="h-6 w-6 text-[rgb(31,178,86)] mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Payroll Calculation</h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">Step 1: Accountant calculates monthly payroll</p>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Period Start *
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Period End *
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="w-full py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {calculating ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <CalculatorIcon className="h-5 w-5 mr-2" />
                      Calculate Payroll
                    </>
                  )}
                </button>

                {calculationResult && (
                  <button
                    onClick={handleSubmitForApproval}
                    className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Submit for Approval
                  </button>
                )}
              </div>

              {/* Summary Stats */}
              {calculationResult && (
                <div className="border-t border-gray-200 p-5 space-y-3">
                  <h3 className="font-medium text-gray-900">Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Employees</span>
                      <span className="font-medium">{Array.isArray(calculationResult.data) ? calculationResult.data.length : 1}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Gross Pay</span>
                      <span className="font-medium text-green-600">{formatCurrency(getTotalGross())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total SSNIT</span>
                      <span className="font-medium text-red-600">{formatCurrency(getTotalSSNIT())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total PAYE Tax</span>
                      <span className="font-medium text-red-600">{formatCurrency(getTotalTax())}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Total Net Pay</span>
                      <span className="font-semibold text-[rgb(31,178,86)]">{formatCurrency(getTotalNet())}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {calculationResult ? 'Calculation Results' : 'Employee List'}
                </h2>
                {calculationResult && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]"
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                )}
              </div>

              {!calculationResult ? (
                <div className="p-8 text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select a period and click "Calculate Payroll" to see results</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {employees.length} active employees will be included
                  </p>
                </div>
              ) : showDetails && Array.isArray(calculationResult.data) ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SSNIT</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PAYE Tax</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {calculationResult.data.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{emp.employee_name}</div>
                            <div className="text-xs text-gray-500">{emp.position || emp.department || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-green-600">{formatCurrency(emp.gross_salary)}</td>
                          <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(emp.deductions?.ssnit_employee || 0)}</td>
                          <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(emp.deductions?.paye_tax || 0)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-[rgb(31,178,86)]">{formatCurrency(emp.net_salary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : calculationResult && !Array.isArray(calculationResult.data) ? (
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Employee: {calculationResult.data.employee_name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Basic Salary</p>
                        <p className="text-lg font-semibold">{formatCurrency(calculationResult.data.basic_salary)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Allowances</p>
                        <p className="text-lg font-semibold">{formatCurrency(calculationResult.data.allowances)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gross Pay</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(calculationResult.data.gross_salary)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Net Pay</p>
                        <p className="text-lg font-semibold text-[rgb(31,178,86)]">{formatCurrency(calculationResult.data.net_salary)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">SSNIT</p>
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(calculationResult.data.deductions?.ssnit_employee || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">PAYE Tax</p>
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(calculationResult.data.deductions?.paye_tax || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Workflow Steps */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-medium text-gray-900 mb-3">Payroll Workflow</h3>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-[rgb(31,178,86)] text-white flex items-center justify-center mx-auto mb-2">1</div>
                  <p className="text-xs text-gray-600">Accountant<br />Calculates</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center mx-auto mb-2">2</div>
                  <p className="text-xs text-gray-600">Treasurer<br />Approves</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center mx-auto mb-2">3</div>
                  <p className="text-xs text-gray-600">Accountant<br />Posts to Ledger</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center mx-auto mb-2">4</div>
                  <p className="text-xs text-gray-600">Generate<br />Payslips</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollCalculate;