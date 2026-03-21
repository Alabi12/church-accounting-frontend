// src/pages/Payroll/PayrollProcess.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function PayrollProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Configure, 2: Review, 3: Process
  const [period, setPeriod] = useState({
    startDate: format(new Date().setDate(1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [calculationResult, setCalculationResult] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Calculate payroll mutation
  const calculateMutation = useMutation({
    mutationFn: payrollService.calculatePayroll,
    onSuccess: (data) => {
      setCalculationResult(data.data);
      setStep(2);
      // Initialize all employees as selected
      setSelectedEmployees(data.data.items.map(item => item.employee_id));
      toast.success('Payroll calculation completed');
    },
    onError: (error) => {
      toast.error('Failed to calculate payroll');
    },
  });

  // Process payroll mutation
  const processMutation = useMutation({
    mutationFn: payrollService.processPayroll,
    onSuccess: (data) => {
      toast.success('Payroll processed successfully');
      navigate(`/payroll/runs/${data.data.payroll_run.id}`);
    },
    onError: (error) => {
      toast.error('Failed to process payroll');
    },
  });

  const handleCalculate = () => {
    if (!period.startDate || !period.endDate) {
      toast.error('Please select period start and end dates');
      return;
    }

    calculateMutation.mutate({
      period_start: period.startDate,
      period_end: period.endDate,
      payment_date: period.paymentDate,
    });
  };

  const handleProcess = () => {
    if (!calculationResult) return;
    
    // Filter items to only include selected employees
    const filteredItems = calculationResult.items.filter(
      item => selectedEmployees.includes(item.employee_id)
    );

    // Recalculate summary based on selected employees
    const summary = filteredItems.reduce((acc, item) => ({
      total_gross: acc.total_gross + item.period_gross,
      total_ssnit: acc.total_ssnit + item.ssnit,
      total_provident_fund: acc.total_provident_fund + item.provident_fund,
      total_paye: acc.total_paye + item.paye,
      total_withholding_tax: acc.total_withholding_tax + item.withholding_tax,
      total_deductions: acc.total_deductions + item.total_deductions,
      total_net: acc.total_net + item.net_pay,
    }), {
      total_gross: 0,
      total_ssnit: 0,
      total_provident_fund: 0,
      total_paye: 0,
      total_withholding_tax: 0,
      total_deductions: 0,
      total_net: 0,
    });

    processMutation.mutate({
      period_start: period.startDate,
      period_end: period.endDate,
      payment_date: period.paymentDate,
      items: filteredItems,
      summary,
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(calculationResult.items.map(item => item.employee_id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectEmployee = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  useEffect(() => {
    if (calculationResult) {
      setSelectAll(selectedEmployees.length === calculationResult.items.length);
    }
  }, [selectedEmployees, calculationResult]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/payroll')}
          className="mr-4 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Process Payroll</h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${step >= 1 ? 'text-[rgb(31,178,86)]' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
              step >= 1 ? 'border-[rgb(31,178,86)] bg-[rgb(31,178,86)] text-white' : 'border-gray-300'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Configure</span>
          </div>
          <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-[rgb(31,178,86)]' : 'bg-gray-300'}`} />
          <div className={`flex items-center ${step >= 2 ? 'text-[rgb(31,178,86)]' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
              step >= 2 ? 'border-[rgb(31,178,86)] bg-[rgb(31,178,86)] text-white' : 'border-gray-300'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Review</span>
          </div>
          <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-[rgb(31,178,86)]' : 'bg-gray-300'}`} />
          <div className={`flex items-center ${step >= 3 ? 'text-[rgb(31,178,86)]' : 'text-gray-400'}`}>
            <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
              step >= 3 ? 'border-[rgb(31,178,86)] bg-[rgb(31,178,86)] text-white' : 'border-gray-300'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Process</span>
          </div>
        </div>
      </div>

      {/* Step 1: Configure Period */}
      {step === 1 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Payroll Period Configuration
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Start Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={period.startDate}
                    onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
                    className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period End Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={period.endDate}
                    onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
                    className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={period.paymentDate}
                    onChange={(e) => setPeriod({ ...period, paymentDate: e.target.value })}
                    className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCalculate}
                disabled={calculateMutation.isPending}
                className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2 disabled:opacity-50"
              >
                {calculateMutation.isPending ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Calculating...
                  </>
                ) : (
                  'Calculate Payroll'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Review Calculation */}
      {step === 2 && calculationResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Employees
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {selectedEmployees.length} / {calculationResult.employee_count}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Gross
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(calculationResult.summary.total_gross)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Deductions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(calculationResult.summary.total_deductions)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Net Pay
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(calculationResult.summary.total_net)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Select Employees for Payroll
                  </h3>
                  <p className="mt-2 text-sm text-gray-700">
                    Choose which employees to include in this payroll run.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)]"
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Employee
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Department
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Gross Pay
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        PAYE
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        SSNIT
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Net Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {calculationResult.items.map((item) => (
                      <tr key={item.employee_id} className="hover:bg-gray-50">
                        <td className="relative px-7 sm:w-12 sm:px-6">
                          <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)]"
                            checked={selectedEmployees.includes(item.employee_id)}
                            onChange={() => handleSelectEmployee(item.employee_id)}
                          />
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <div className="font-medium text-gray-900">{item.employee_name}</div>
                          <div className="text-gray-500">{item.employment_type}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.department || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {formatCurrency(item.period_gross)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {formatCurrency(item.paye)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {formatCurrency(item.ssnit)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-[rgb(31,178,86)]">
                          {formatCurrency(item.net_pay)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={selectedEmployees.length === 0 || processMutation.isPending}
              className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2 disabled:opacity-50"
            >
              {processMutation.isPending ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Processing...
                </>
              ) : (
                'Process Payroll'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleProcess}
        title="Process Payroll"
        message={`Are you sure you want to process payroll for ${selectedEmployees.length} employee(s)? This will create a payroll run that can be reviewed before final approval.`}
        confirmText="Process"
        cancelText="Cancel"
        type="success"
      />
    </div>
  );
}

export default PayrollProcess;