// pages/Payroll/PayrollCalculate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalculatorIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const PayrollCalculate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [calculationResult, setCalculationResult] = useState(null);
  const [creatingRun, setCreatingRun] = useState(false);

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
    if (!period.startDate || !period.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const result = await payrollService.calculatePayroll({
        period_start: period.startDate,
        period_end: period.endDate
      });
      setCalculationResult(result);
      toast.success('Payroll calculated successfully');
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast.error(error.response?.data?.error || 'Failed to calculate payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayrollRun = async () => {
    if (!calculationResult) {
      toast.error('Please calculate payroll first');
      return;
    }

    setCreatingRun(true);
    try {
      const result = await payrollService.createPayrollRun({
        period_start: period.startDate,
        period_end: period.endDate,
        payment_date: period.endDate
      });
      
      toast.success('Payroll run created successfully');
      navigate('/payroll/runs');
    } catch (error) {
      console.error('Error creating payroll run:', error);
      toast.error(error.response?.data?.error || 'Failed to create payroll run');
    } finally {
      setCreatingRun(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  if (loading && employees.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/payroll/runs')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Payroll Runs
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center">
              <CalculatorIcon className="h-6 w-6 text-white mr-2" />
              <h2 className="text-xl font-semibold text-white">Calculate Payroll</h2>
            </div>
            <p className="text-sm text-blue-100 mt-1">
              Calculate payroll for a period before creating a payroll run
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Period Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={period.startDate}
                    onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={period.endDate}
                    onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <CalculatorIcon className="h-4 w-4 mr-2" />
                    Calculate Payroll
                  </>
                )}
              </button>
            </div>

            {/* Employee Info */}
            {employees.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserGroupIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Active Employees: {employees.length}
                  </span>
                </div>
              </div>
            )}

            {/* Calculation Results */}
            {calculationResult && (
              <div className="mt-6 space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Payroll Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Employees</p>
                      <p className="text-2xl font-bold text-gray-900">{calculationResult.total_employees}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Gross Pay</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(calculationResult.summary.total_gross)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Deductions</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(calculationResult.summary.total_deductions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Net Pay</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculationResult.summary.total_net)}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SSNIT</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PAYE</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {calculationResult.payroll_items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.employee_name}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.gross_salary)}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(item.deductions.ssnit_employee)}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(item.deductions.paye_tax)}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-green-600">{formatCurrency(item.net_salary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreatePayrollRun}
                    disabled={creatingRun}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    {creatingRun ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                        Creating Run...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Create Payroll Run
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PayrollCalculate;