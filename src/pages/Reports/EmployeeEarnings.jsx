// src/pages/Reports/EmployeeEarnings.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function EmployeeEarnings() {
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    employee_id: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch employees for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => payrollService.getEmployees({ status: 'active' }),
  });

  // Fetch employee earnings
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employeeEarnings', filters.year, filters.employee_id],
    queryFn: () => payrollService.getEmployeeEarnings({ 
      year: filters.year,
      employee_id: filters.employee_id || undefined 
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
    const title = `Employee Earnings Report - ${filters.year}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 32);

    const earnings = data?.data?.earnings || [];
    let yOffset = 40;

    earnings.forEach((employee, index) => {
      if (index > 0) {
        doc.addPage();
        yOffset = 22;
      }

      doc.setFontSize(14);
      doc.text(employee.employee_name || `Employee ${employee.employee_id}`, 14, yOffset);
      yOffset += 10;

      doc.setFontSize(10);
      doc.text(`Code: ${employee.employee_code || 'N/A'} | Department: ${employee.department || 'N/A'}`, 14, yOffset);
      yOffset += 10;

      // Summary
      const summaryData = [
        ['Total Gross', formatCurrency(employee.total_gross)],
        ['Total Deductions', formatCurrency(employee.total_deductions)],
        ['Total Tax', formatCurrency(employee.total_tax)],
        ['Total Net', formatCurrency(employee.total_net)],
      ];

      doc.autoTable({
        startY: yOffset,
        head: [['Summary', 'Amount']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [31, 178, 86] },
      });

      yOffset = doc.lastAutoTable.finalY + 10;

      // Monthly breakdown
      if (Object.keys(employee.months || {}).length > 0) {
        const monthlyData = Object.entries(employee.months).map(([month, data]) => [
          month,
          formatCurrency(data.gross),
          formatCurrency(data.tax),
          formatCurrency(data.net),
        ]);

        doc.autoTable({
          startY: yOffset,
          head: [['Month', 'Gross', 'Tax', 'Net']],
          body: monthlyData,
          theme: 'striped',
          headStyles: { fillColor: [31, 178, 86] },
        });
      }
    });

    doc.save(`employee-earnings-${filters.year}.pdf`);
  };

  const handleExportCSV = () => {
    const earnings = data?.data?.earnings || [];

    let csv = 'Employee Earnings Report\n';
    csv += `Year,${filters.year}\n`;
    csv += `Generated,${format(new Date(), 'dd MMM yyyy HH:mm')}\n\n`;

    earnings.forEach(employee => {
      csv += `\nEmployee,${employee.employee_name || `ID: ${employee.employee_id}`}\n`;
      csv += `Code,${employee.employee_code || 'N/A'}\n`;
      csv += `Department,${employee.department || 'N/A'}\n`;
      csv += `Total Gross,${employee.total_gross || 0}\n`;
      csv += `Total Deductions,${employee.total_deductions || 0}\n`;
      csv += `Total Tax,${employee.total_tax || 0}\n`;
      csv += `Total Net,${employee.total_net || 0}\n`;
      
      if (Object.keys(employee.months || {}).length > 0) {
        csv += '\nMonthly Breakdown\n';
        csv += 'Month,Gross,Tax,Net\n';
        Object.entries(employee.months).forEach(([month, data]) => {
          csv += `${month},${data.gross},${data.tax},${data.net}\n`;
        });
      }
      csv += '\n' + '-'.repeat(50) + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-earnings-${filters.year}.csv`;
    a.click();
  };

  const yearOptions = [];
  for (let i = new Date().getFullYear() - 2; i <= new Date().getFullYear() + 1; i++) {
    yearOptions.push(i);
  }

  const employees = employeesData?.data?.employees || [];

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorAlert message="Failed to load employee earnings" />;

  const earnings = data?.data?.earnings || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employee Earnings Report</h1>
          <p className="mt-2 text-sm text-gray-700">
            View earnings breakdown by employee.
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
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <select
                value={filters.employee_id}
                onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.employee_code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Employees
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {earnings.length}
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
                    Total Gross Pay
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(earnings.reduce((sum, e) => sum + (e.total_gross || 0), 0))}
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
                    {formatCurrency(earnings.reduce((sum, e) => sum + (e.total_deductions || 0), 0))}
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
                  <dd className="text-lg font-medium text-[rgb(31,178,86)]">
                    {formatCurrency(earnings.reduce((sum, e) => sum + (e.total_net || 0), 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="space-y-6">
        {earnings.map((employee) => (
          <div
            key={employee.employee_id}
            className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedEmployee(selectedEmployee === employee.employee_id ? null : employee.employee_id)}
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {employee.employee_name || `Employee ${employee.employee_id}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {employee.employee_code} • {employee.department || 'No Department'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Year to Date</p>
                  <p className="text-lg font-semibold text-[rgb(31,178,86)]">
                    {formatCurrency(employee.total_net)}
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Gross Pay</p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(employee.total_gross)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deductions</p>
                  <p className="text-sm font-medium text-red-600">{formatCurrency(employee.total_deductions)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tax</p>
                  <p className="text-sm font-medium text-orange-600">{formatCurrency(employee.total_tax)}</p>
                </div>
              </div>

              {/* Monthly Breakdown - Expandable */}
              {selectedEmployee === employee.employee_id && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Breakdown</h4>
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-2 pl-4 pr-3 text-left text-xs font-medium text-gray-500">
                            Month
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                            Gross
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                            Tax
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                            Net
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {Object.entries(employee.months || {}).map(([month, data]) => (
                          <tr key={month}>
                            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-900">
                              {month}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-right text-gray-900">
                              {formatCurrency(data.gross)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-right text-orange-600">
                              {formatCurrency(data.tax)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-right text-[rgb(31,178,86)]">
                              {formatCurrency(data.net)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {earnings.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No earnings data found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeEarnings;