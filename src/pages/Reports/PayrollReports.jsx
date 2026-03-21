// src/pages/Reports/PayrollReports.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function PayrollReports() {
  const [dateRange, setDateRange] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState('summary');

  // Fetch payroll summary
  const { data: summaryData, isLoading: summaryLoading, error: summaryError, refetch } = useQuery({
    queryKey: ['payrollSummary', dateRange.year, dateRange.month],
    queryFn: () => payrollService.getPayrollSummary({ 
      year: dateRange.year,
      month: dateRange.month 
    }),
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = `Payroll Summary Report - ${dateRange.month}/${dateRange.year}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 32);

    const summary = summaryData?.data?.summary || {};
    const runs = summaryData?.data?.runs || [];

    // Summary section
    doc.setFontSize(14);
    doc.text('Summary', 14, 45);
    
    const summaryData = [
      ['Total Runs', summary.total_runs || 0],
      ['Total Gross Pay', formatCurrency(summary.total_gross)],
      ['Total Deductions', formatCurrency(summary.total_deductions)],
      ['Total Tax', formatCurrency(summary.total_tax)],
      ['Total Net Pay', formatCurrency(summary.total_net)],
    ];

    doc.autoTable({
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [31, 178, 86] },
    });

    // Runs section
    if (runs.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Payroll Runs', 14, 22);

      const runsTableData = runs.map(run => [
        run.run_number,
        formatDate(run.period_start),
        formatDate(run.period_end),
        formatCurrency(run.total_gross),
        formatCurrency(run.total_deductions),
        formatCurrency(run.total_net),
        run.status,
      ]);

      doc.autoTable({
        startY: 30,
        head: [['Run #', 'Start', 'End', 'Gross', 'Deductions', 'Net', 'Status']],
        body: runsTableData,
        theme: 'striped',
        headStyles: { fillColor: [31, 178, 86] },
      });
    }

    doc.save(`payroll-summary-${dateRange.year}-${dateRange.month}.pdf`);
  };

  const handleExportCSV = () => {
    const summary = summaryData?.data?.summary || {};
    const runs = summaryData?.data?.runs || [];

    let csv = 'Payroll Summary Report\n';
    csv += `Period,${dateRange.month}/${dateRange.year}\n`;
    csv += `Generated,${format(new Date(), 'dd MMM yyyy HH:mm')}\n\n`;
    
    csv += 'Summary\n';
    csv += `Total Runs,${summary.total_runs || 0}\n`;
    csv += `Total Gross Pay,${summary.total_gross || 0}\n`;
    csv += `Total Deductions,${summary.total_deductions || 0}\n`;
    csv += `Total Tax,${summary.total_tax || 0}\n`;
    csv += `Total Net Pay,${summary.total_net || 0}\n\n`;
    
    if (runs.length > 0) {
      csv += 'Payroll Runs\n';
      csv += 'Run Number,Period Start,Period End,Gross Pay,Deductions,Tax,Net Pay,Status\n';
      
      runs.forEach(run => {
        csv += `${run.run_number},${run.period_start},${run.period_end},${run.total_gross},${run.total_deductions},${run.total_tax},${run.total_net},${run.status}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-summary-${dateRange.year}-${dateRange.month}.csv`;
    a.click();
  };

  const yearOptions = [];
  for (let i = new Date().getFullYear() - 2; i <= new Date().getFullYear() + 1; i++) {
    yearOptions.push(i);
  }

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  if (summaryLoading) return <LoadingSpinner fullScreen />;
  if (summaryError) return <ErrorAlert message="Failed to load payroll summary" />;

  const summary = summaryData?.data?.summary || {};
  const runs = summaryData?.data?.runs || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Generate and export payroll summary reports.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={dateRange.year}
                onChange={(e) => setDateRange({ ...dateRange, year: parseInt(e.target.value) })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={dateRange.month}
                onChange={(e) => setDateRange({ ...dateRange, month: parseInt(e.target.value) })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Report Type Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedReport('summary')}
            className={`${
              selectedReport === 'summary'
                ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Summary Report
          </button>
          <button
            onClick={() => setSelectedReport('details')}
            className={`${
              selectedReport === 'details'
                ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Detailed Report
          </button>
        </nav>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Runs
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {summary.total_runs || 0}
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
                    {formatCurrency(summary.total_gross)}
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
                    Total Deductions
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(summary.total_deductions)}
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
                    Total Tax
                  </dt>
                  <dd className="text-lg font-medium text-orange-600">
                    {formatCurrency(summary.total_tax)}
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
                    Total Net
                  </dt>
                  <dd className="text-lg font-medium text-[rgb(31,178,86)]">
                    {formatCurrency(summary.total_net)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'summary' ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Payroll Summary - {monthOptions.find(m => m.value === dateRange.month)?.label} {dateRange.year}
            </h3>
            
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Payroll Runs</dt>
                <dd className="mt-1 text-sm text-gray-900">{summary.total_runs || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Average Net per Run</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(summary.average_net_per_run)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Gross Pay</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(summary.total_gross)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Deductions</dt>
                <dd className="mt-1 text-sm text-red-600">{formatCurrency(summary.total_deductions)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Tax</dt>
                <dd className="mt-1 text-sm text-orange-600">{formatCurrency(summary.total_tax)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Net Pay</dt>
                <dd className="mt-1 text-sm text-[rgb(31,178,86)]">{formatCurrency(summary.total_net)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Detailed Payroll Runs - {monthOptions.find(m => m.value === dateRange.month)?.label} {dateRange.year}
            </h3>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Run Number
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Period
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Gross
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Deductions
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Tax
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Net
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Employees
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {run.run_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>{formatDate(run.period_start)}</div>
                        <div className="text-xs">to {formatDate(run.period_end)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                        {formatCurrency(run.total_gross)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(run.total_deductions)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-orange-600">
                        {formatCurrency(run.total_tax)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-[rgb(31,178,86)]">
                        {formatCurrency(run.total_net)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          run.status === 'paid' ? 'bg-green-100 text-green-800' :
                          run.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          run.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        {run.employee_count || 0}
                      </td>
                    </tr>
                  ))}
                  {runs.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500">
                        No payroll runs found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollReports;