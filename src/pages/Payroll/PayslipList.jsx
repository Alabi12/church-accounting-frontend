// pages/Payroll/PayslipList.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,  // Fixed: DownloadIcon -> ArrowDownTrayIcon
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

function PayslipList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRun, setSelectedRun] = useState('');

  // Fetch payroll runs for filter
  const { data: runsData } = useQuery({
    queryKey: ['payrollRuns'],
    queryFn: () => payrollService.getPayrollRuns(),
  });

  // Fetch payslips based on selected run
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payslips', selectedRun],
    queryFn: () => {
      if (selectedRun) {
        return payrollService.getPayslipsByRun?.(selectedRun) || Promise.resolve({ payslips: [] });
      }
      return payrollService.getAllPayslips?.() || Promise.resolve({ payslips: [] });
    },
    enabled: true,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payslips" />;

  const payslips = data?.payslips || [];

  // Filter payslips
  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = payslip.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payslip.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payslip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'generated':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Generated
          </span>
        );
      case 'viewed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <EyeIcon className="h-3 w-3 mr-1" />
            Viewed
          </span>
        );
      case 'signed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Signed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Pending'}
          </span>
        );
    }
  };

  const handleDownload = async (payslipId) => {
    try {
      if (payrollService.downloadPayslip) {
        const response = await payrollService.downloadPayslip(payslipId);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `payslip_${payslipId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading payslip:', error);
    }
  };

  const handleEmail = async (payslipId) => {
    try {
      if (payrollService.emailPayslip) {
        await payrollService.emailPayslip(payslipId);
      }
    } catch (error) {
      console.error('Error emailing payslip:', error);
    }
  };

  const runs = runsData?.runs || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payslips</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage employee payslips
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate('/payroll/process')}
            className="inline-flex items-center rounded-md bg-[rgb(31,178,86)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[rgb(25,142,69)]"
          >
            Generate New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div>
          <select
            value={selectedRun}
            onChange={(e) => setSelectedRun(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm sm:leading-6"
          >
            <option value="">All Payroll Runs</option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.run_number} - {formatDate(run.period_start)} to {formatDate(run.period_end)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm sm:leading-6"
          >
            <option value="all">All Status</option>
            <option value="generated">Generated</option>
            <option value="viewed">Viewed</option>
            <option value="signed">Signed</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Payslips</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPayslips.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Net Pay</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredPayslips.reduce((sum, p) => sum + (p.net_pay || 0), 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Employees</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(filteredPayslips.map(p => p.employee_id)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Signed</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredPayslips.filter(p => p.status === 'signed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Employee
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Period
                    </th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Gross Pay
                    </th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Deductions
                    </th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Net Pay
                    </th>
                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Payment Date
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredPayslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{payslip.employee_name}</div>
                        <div className="text-gray-500 text-xs">{payslip.employee_code}</div>
                        <div className="text-gray-400 text-xs">{payslip.department}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>{formatDate(payslip.period_start)}</div>
                        <div className="text-xs">to {formatDate(payslip.period_end)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-green-600">
                        {formatCurrency(payslip.gross_pay)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(payslip.total_deductions)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-blue-600">
                        {formatCurrency(payslip.net_pay)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        {getStatusBadge(payslip.status)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500">
                        {formatDate(payslip.payment_date)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => navigate(`/payroll/payslips/${payslip.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(payslip.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEmail(payslip.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Email"
                        >
                          <EnvelopeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPayslips.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500">
                        <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p>No payslips found.</p>
                        <p className="text-sm mt-1">Generate payslips from a payroll run to see them here.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayslipList;