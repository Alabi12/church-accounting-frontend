import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const TaxReports = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('summary');
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { id: 'summary', name: 'Tax Summary', icon: ChartBarIcon },
    { id: 'donor', name: 'Donor Contributions', icon: UserGroupIcon },
    { id: '1099', name: '1099 Contractors', icon: BriefcaseIcon },
    { id: 'withholding', name: 'Withholding Tax', icon: CurrencyDollarIcon },
  ];

  useEffect(() => {
    fetchTaxReport();
  }, [selectedYear, reportType]);

  const fetchTaxReport = async () => {
    try {
      setLoading(true);
      const data = await accountantService.getTaxReport({
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
      const blob = await accountantService.exportTaxReport({
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
          <p className="text-sm text-gray-500 mb-1">Tax Due</p>
          <p className={`text-2xl font-bold ${(reportData?.summary?.taxDue || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(reportData?.summary?.taxDue || 0)}
          </p>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Chart */}
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
                <Bar dataKey="income" fill="#8884d8" name="Income" />
                <Bar dataKey="estimatedTax" fill="#ffc658" name="Estimated Tax" />
                <Bar dataKey="paid" fill="#82ca9d" name="Paid" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  const renderDonorReport = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Gifts</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Non-Cash</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statements</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData?.donors?.map((donor, index) => (
              <tr key={donor.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {donor.name}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const render1099Report = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">EIN</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reportable</th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-orange-600">
                  {formatCurrency(contractor.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    contractor.reportable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {contractor.reportable ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWithholdingReport = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={fetchTaxReport}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
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
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs">{type.name}</span>
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
                  {[2024, 2025, 2026, 2027].map((year) => (
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
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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