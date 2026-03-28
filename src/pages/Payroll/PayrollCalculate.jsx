// pages/Payroll/PayrollCalculate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CalculatorIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import toast from 'react-hot-toast';

function PayrollCalculate() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch employees for selection
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees', 'active'],
    queryFn: () => payrollService.getEmployees({ status: 'active' }),
  });

  const employees = employeesData?.employees || [];

  // Calculate payroll mutation
  const calculateMutation = useMutation({
    mutationFn: (params) => payrollService.calculatePayroll(params),
    onSuccess: (data) => {
      console.log('Calculation result:', data);
      setCalculationResult(data);
      toast.success('Payroll calculated successfully');
    },
    onError: (error) => {
      console.error('Error calculating payroll:', error);
      toast.error(error.response?.data?.error || 'Failed to calculate payroll');
    },
    onSettled: () => {
      setIsCalculating(false);
    }
  });

  const handleCalculate = () => {
    if (!period.startDate || !period.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsCalculating(true);
    calculateMutation.mutate({
      period_start: period.startDate,
      period_end: period.endDate
    });
  };

  const handleExport = () => {
    if (!calculationResult) return;

    const csvData = [];
    // Headers
    csvData.push(['Employee Name', 'Position', 'Department', 'Gross Salary', 'SSNIT', 'Provident Fund', 'PAYE Tax', 'Total Deductions', 'Net Salary']);
    
    // Data rows - Safe access to payroll_items
    const payrollItems = calculationResult.payroll_items || [];
    payrollItems.forEach(item => {
      csvData.push([
        item.employee_name || 'Unknown',
        item.position || 'N/A',
        item.department || 'N/A',
        item.gross_salary?.toFixed(2) || '0.00',
        item.deductions?.ssnit_employee?.toFixed(2) || '0.00',
        item.deductions?.provident_fund?.toFixed(2) || '0.00',
        item.deductions?.paye_tax?.toFixed(2) || '0.00',
        item.deductions?.total?.toFixed(2) || '0.00',
        item.net_salary?.toFixed(2) || '0.00'
      ]);
    });
    
    // Summary row
    const summary = calculationResult.summary || {};
    csvData.push([]);
    csvData.push(['TOTAL', '', '', summary.total_gross?.toFixed(2) || '0.00', 
      summary.total_ssnit?.toFixed(2) || '0.00', 
      summary.total_provident_fund?.toFixed(2) || '0.00', 
      summary.total_paye?.toFixed(2) || '0.00', 
      summary.total_deductions?.toFixed(2) || '0.00', 
      summary.total_net?.toFixed(2) || '0.00']);
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${period.startDate}_to_${period.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Payroll exported successfully');
  };

  if (isLoadingEmployees) {
    return <LoadingSpinner fullScreen />;
  }

  const summary = calculationResult?.summary || {};
  const payrollItems = calculationResult?.payroll_items || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/payroll')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Calculate Payroll</h1>
        </div>
        <div className="flex gap-3">
          {calculationResult && (
            <button
              onClick={handleExport}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          )}
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] disabled:opacity-50"
          >
            {isCalculating ? (
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
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Payroll Period</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={period.startDate}
                  onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={period.endDate}
                  onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <UserGroupIcon className="inline h-4 w-4 mr-1" />
            {employees.length} active employees will be included in the calculation
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {calculationResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Gross Pay</p>
                <p className="text-2xl font-bold text-gray-900">
                  GHS {summary.total_gross?.toLocaleString() || '0.00'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <CalculatorIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Deductions</p>
                <p className="text-2xl font-bold text-gray-900">
                  GHS {summary.total_deductions?.toLocaleString() || '0.00'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Net Pay</p>
                <p className="text-2xl font-bold text-gray-900">
                  GHS {summary.total_net?.toLocaleString() || '0.00'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculationResult.total_employees || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {calculationResult && payrollItems.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Payroll Details</h3>
            <p className="mt-1 text-sm text-gray-500">
              Detailed breakdown for each employee
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SSNIT</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Provident Fund</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">PAYE Tax</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollItems.map((item, index) => {
                  // Safe access to nested properties
                  const deductions = item.deductions || {};
                  return (
                    <tr key={item.employee_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.employee_name || 'Unknown Employee'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.position || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        GHS {item.gross_salary?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        GHS {deductions.ssnit_employee?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                        GHS {deductions.provident_fund?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                        GHS {deductions.paye_tax?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                        GHS {item.net_salary?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="2" className="px-6 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                    GHS {summary.total_gross?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                    GHS {summary.total_ssnit?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-orange-600">
                    GHS {summary.total_provident_fund?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-purple-600">
                    GHS {summary.total_paye?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
                    GHS {summary.total_net?.toFixed(2) || '0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!calculationResult && (
        <div className="bg-white shadow sm:rounded-lg p-12 text-center">
          <CalculatorIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Calculation Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Select a payroll period and click "Calculate Payroll" to see the results.
          </p>
          {employees.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                No active employees found. Please add employees first in the Employee Management section.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PayrollCalculate;