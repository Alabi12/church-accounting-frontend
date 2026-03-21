// src/pages/Reports/TaxSummary.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function TaxSummary() {
  const [dateRange, setDateRange] = useState({
    year: new Date().getFullYear(),
    quarter: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tax summary
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['taxSummary', dateRange.year, dateRange.quarter],
    queryFn: () => payrollService.getTaxSummary({ 
      year: dateRange.year,
      quarter: dateRange.quarter || undefined 
    }),
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = `Tax Summary Report - ${dateRange.year}${dateRange.quarter ? ` Q${dateRange.quarter}` : ''}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 32);

    const summary = data?.data || {};

    const taxData = [
      ['Total PAYE', formatCurrency(summary.total_paye)],
      ['Total SSNIT (Employee)', formatCurrency(summary.total_ssnit)],
      ['Total Provident Fund', formatCurrency(summary.total_provident_fund)],
      ['Total Employees', summary.employee_count || 0],
      ['Runs Processed', summary.runs_processed || 0],
    ];

    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: taxData,
      theme: 'striped',
      headStyles: { fillColor: [31, 178, 86] },
    });

    doc.save(`tax-summary-${dateRange.year}${dateRange.quarter ? `-q${dateRange.quarter}` : ''}.pdf`);
  };

  const handleExportCSV = () => {
    const summary = data?.data || {};

    let csv = 'Tax Summary Report\n';
    csv += `Period,${dateRange.year}${dateRange.quarter ? ` Q${dateRange.quarter}` : ''}\n`;
    csv += `Generated,${format(new Date(), 'dd MMM yyyy HH:mm')}\n\n`;
    
    csv += 'Summary\n';
    csv += `Total PAYE,${summary.total_paye || 0}\n`;
    csv += `Total SSNIT,${summary.total_ssnit || 0}\n`;
    csv += `Total Provident Fund,${summary.total_provident_fund || 0}\n`;
    csv += `Total Employees,${summary.employee_count || 0}\n`;
    csv += `Runs Processed,${summary.runs_processed || 0}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-summary-${dateRange.year}${dateRange.quarter ? `-q${dateRange.quarter}` : ''}.csv`;
    a.click();
  };

  const yearOptions = [];
  for (let i = new Date().getFullYear() - 2; i <= new Date().getFullYear() + 1; i++) {
    yearOptions.push(i);
  }

  const quarterOptions = [
    { value: 1, label: 'Q1 (Jan - Mar)' },
    { value: 2, label: 'Q2 (Apr - Jun)' },
    { value: 3, label: 'Q3 (Jul - Sep)' },
    { value: 4, label: 'Q4 (Oct - Dec)' },
  ];

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorAlert message="Failed to load tax summary" />;

  const summary = data?.data || {};

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tax Summary Report</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and export tax-related payroll summaries.
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
                Quarter
              </label>
              <select
                value={dateRange.quarter}
                onChange={(e) => setDateRange({ ...dateRange, quarter: e.target.value ? parseInt(e.target.value) : '' })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
              >
                <option value="">Full Year</option>
                {quarterOptions.map(quarter => (
                  <option key={quarter.value} value={quarter.value}>{quarter.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ReceiptPercentIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total PAYE
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(summary.total_paye)}
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
                <ReceiptPercentIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total SSNIT
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(summary.total_ssnit)}
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
                <ReceiptPercentIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Provident Fund
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(summary.total_provident_fund)}
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
                <ReceiptPercentIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tax & Levies
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency((summary.total_paye || 0) + (summary.total_ssnit || 0) + (summary.total_provident_fund || 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Tax Summary Details
          </h3>
          
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total PAYE (Income Tax)</dt>
              <dd className="mt-1 text-lg text-gray-900">{formatCurrency(summary.total_paye)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total SSNIT (Employee Contribution)</dt>
              <dd className="mt-1 text-lg text-gray-900">{formatCurrency(summary.total_ssnit)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Provident Fund</dt>
              <dd className="mt-1 text-lg text-gray-900">{formatCurrency(summary.total_provident_fund)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Number of Employees</dt>
              <dd className="mt-1 text-lg text-gray-900">{summary.employee_count || 0}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Payroll Runs Processed</dt>
              <dd className="mt-1 text-lg text-gray-900">{summary.runs_processed || 0}</dd>
            </div>
          </dl>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">Tax Payment Summary</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-green-600">PAYE Due</p>
                <p className="text-lg font-semibold text-green-900">{formatCurrency(summary.total_paye)}</p>
              </div>
              <div>
                <p className="text-xs text-green-600">SSNIT Due</p>
                <p className="text-lg font-semibold text-green-900">{formatCurrency(summary.total_ssnit)}</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Total Tax Due</p>
                <p className="text-lg font-semibold text-green-900">
                  {formatCurrency((summary.total_paye || 0) + (summary.total_ssnit || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxSummary;