import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  BookmarkIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { reportService } from '../../services/reports';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const TaxReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('summary');
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { id: 'summary', name: 'Tax Summary', icon: ChartBarIcon, description: 'Overview of taxable income and taxes paid' },
    { id: 'donor', name: 'Donor Contributions', icon: UserGroupIcon, description: 'Itemized contributions by donor for tax purposes' },
    { id: '1099', name: '1099 Contractors', icon: BriefcaseIcon, description: 'Payments to contractors for 1099 reporting' },
    { id: 'withholding', name: 'Withholding Tax', icon: CurrencyDollarIcon, description: 'Employee withholding tax summary' },
  ];

  useEffect(() => {
    fetchTaxReport();
  }, [selectedYear, reportType]);

  const fetchTaxReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getTaxReport({
        year: selectedYear,
        type: reportType
      });
      setReportData(data);
    } catch (error) {
      console.error('Error fetching tax report:', error);
      toast.error(error.response?.data?.error || 'Failed to load tax report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const blob = await reportService.exportTaxReport({
        year: selectedYear,
        type: reportType,
        format
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax_report_${reportType}_${selectedYear}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveReport = async () => {
    try {
      await reportService.saveReport({
        name: `${reportType.replace('_', ' ')} Tax Report - ${selectedYear}`,
        type: 'tax',
        subtype: reportType,
        parameters: { year: selectedYear },
        data: reportData,
      });
      toast.success('Report saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save report');
    }
  };

  const renderSummary = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(reportData?.summary?.totalIncome || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Taxable Income</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(reportData?.summary?.taxableIncome || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Tax Exempt</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(reportData?.summary?.taxExemptIncome || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Effective Tax Rate</p>
          <p className="text-2xl font-bold text-purple-600">
            {reportData?.summary?.effectiveTaxRate?.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-primary-100 mb-1">Estimated Tax (5%)</p>
          <p className="text-3xl font-bold">{formatCurrency(reportData?.summary?.estimatedTax || 0)}</p>
          <p className="text-sm text-primary-100 mt-2">Based on taxable income</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <p className="text-green-100 mb-1">Paid Taxes</p>
          <p className="text-3xl font-bold">{formatCurrency(reportData?.summary?.paidTaxes || 0)}</p>
          <p className="text-sm text-green-100 mt-2">Year to date</p>
        </div>
        <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 text-white ${
          (reportData?.summary?.taxDue || 0) > 0 
            ? 'from-red-500 to-red-600' 
            : 'from-green-500 to-green-600'
        }`}>
          <p className="text-white/80 mb-1">Tax Due / (Refund)</p>
          <p className="text-3xl font-bold">{formatCurrency(Math.abs(reportData?.summary?.taxDue || 0))}</p>
          <p className="text-sm text-white/80 mt-2">
            {(reportData?.summary?.taxDue || 0) > 0 ? 'Payment required' : 'Refund due'}
          </p>
        </div>
      </div>

      {/* Quarterly Breakdown */}
      {reportData?.summary?.quarters && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quarterly Breakdown</h3>
          <div className="space-y-4">
            {reportData.summary.quarters.map((quarter, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{quarter.quarter}</span>
                  <span className="text-sm text-gray-500">
                    Income: {formatCurrency(quarter.income)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Estimated Tax</p>
                    <p className="font-medium text-orange-600">{formatCurrency(quarter.estimatedTax)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="font-medium text-green-600">{formatCurrency(quarter.paid)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportData?.summary?.quarters && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quarterly Tax Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.summary.quarters}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="income" fill="#8884d8" name="Income" />
                  <Bar dataKey="estimatedTax" fill="#ffc658" name="Estimated Tax" />
                  <Bar dataKey="paid" fill="#82ca9d" name="Paid" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportData?.summary?.monthlyData && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Tax Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.summary.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="taxable" stroke="#8884d8" name="Taxable Income" />
                  <Line type="monotone" dataKey="paid" stroke="#82ca9d" name="Tax Paid" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDonorReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Donors</p>
          <p className="text-2xl font-bold text-gray-900">{reportData?.donors?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Contributions</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(reportData?.totalContributions || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Average Gift</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(reportData?.averageGift || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Largest Gift</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(reportData?.largestGift || 0)}
          </p>
        </div>
      </div>

      {/* Donor Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Donor Contributions - {selectedYear}</h3>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-3 py-1 text-sm bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax ID</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Gifts</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Non-Cash</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statements</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Receipt Sent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.donors?.map((donor, index) => (
                <tr key={donor.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {donor.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donor.taxId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                    {formatCurrency(donor.totalGifts)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {formatCurrency(donor.cash)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(donor.nonCash)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {donor.statements}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {donor.receiptSent ? (
                      <span className="text-green-600 text-sm">✓</span>
                    ) : (
                      <span className="text-gray-300 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donor Distribution Chart */}
      {reportData?.donors && reportData.donors.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top 10 Donors</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.donors.slice(0, 10)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalGifts"
                  nameKey="name"
                >
                  {reportData.donors.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  const render1099Report = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Contractors</p>
          <p className="text-2xl font-bold text-gray-900">{reportData?.contractors?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(reportData?.totalPayments || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Reportable</p>
          <p className="text-2xl font-bold text-red-600">{reportData?.reportableCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Non-Reportable</p>
          <p className="text-2xl font-bold text-gray-600">{reportData?.nonReportableCount || 0}</p>
        </div>
      </div>

      {/* 1099 Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">1099 Contractors - {selectedYear}</h3>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-3 py-1 text-sm bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contractor Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EIN/SSN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reportable</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">1099 Sent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.contractors?.map((contractor, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contractor.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contractor.ein}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contractor.address || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-orange-600">
                    {formatCurrency(contractor.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contractor.reportable
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {contractor.reportable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {contractor.formSent ? (
                      <span className="text-green-600 text-sm">✓</span>
                    ) : (
                      <span className="text-gray-300 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reportable vs Non-Reportable Chart */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reportable vs Non-Reportable</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Reportable', value: reportData.reportableCount || 0 },
                      { name: 'Non-Reportable', value: reportData.nonReportableCount || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#9ca3af" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.contractors?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderWithholdingReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900">{reportData?.employees?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Wages</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(reportData?.totalWages || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Withheld</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(reportData?.totalWithheld || 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Effective Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {reportData?.effectiveRate?.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Withholding Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Withholding Tax - {selectedYear}</h3>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-3 py-1 text-sm bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Wages</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Federal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">State</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">FICA</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.withholdings?.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.employee}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(item.wages)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {formatCurrency(item.federalWithheld)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                    {formatCurrency(item.stateWithheld)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                    {formatCurrency(item.ficaWithheld)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                    {formatCurrency(item.totalWithheld)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withholding Chart */}
      {reportData?.monthlyWithholding && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Withholding Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.monthlyWithholding}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="federal" stackId="a" fill="#ef4444" name="Federal" />
                <Bar dataKey="state" stackId="a" fill="#f97316" name="State" />
                <Bar dataKey="fica" stackId="a" fill="#3b82f6" name="FICA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  if (loading && !reportData) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tax Reports</h1>
            <p className="mt-2 text-sm text-gray-600">
              Generate tax reports for filing and compliance
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting || !reportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {exporting ? 'Exporting...' : 'PDF'}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting || !reportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {exporting ? 'Exporting...' : 'CSV'}
            </button>
            <button
              onClick={handleSaveReport}
              disabled={!reportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <BookmarkIcon className="h-5 w-5 mr-2" />
              Save
            </button>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {reportTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                        reportType === type.id
                          ? 'bg-[rgb(31,178,86)] text-white border-[rgb(31,178,86)]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                      title={type.description}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs text-center">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Year
              </label>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                >
                  {[2023, 2024, 2025, 2026, 2027].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {reportData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {reportType === 'summary' && renderSummary()}
            {reportType === 'donor' && renderDonorReport()}
            {reportType === '1099' && render1099Report()}
            {reportType === 'withholding' && renderWithholdingReport()}
          </motion.div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              Select a report type and year to generate tax reports.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxReports;