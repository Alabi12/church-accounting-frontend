import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CalendarIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  TableCellsIcon,
  UserGroupIcon,
  ScaleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { reportService } from '../services/reports';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('financial');
  const [selectedReport, setSelectedReport] = useState('income-statement');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [period, setPeriod] = useState('month');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [customReportConfig, setCustomReportConfig] = useState({
    type: 'transactions',
    fields: ['date', 'transactionNumber', 'description', 'category', 'amount', 'status'],
    filters: {},
    groupBy: null,
    sortBy: [{ field: 'date', direction: 'desc' }],
    limit: 100
  });

  const reportTypes = {
    financial: [
      { id: 'income-statement', name: 'Income Statement', icon: ChartBarIcon, description: 'Revenue and expenses over a period' },
      { id: 'balance-sheet', name: 'Balance Sheet', icon: ScaleIcon, description: 'Assets, liabilities, and equity' },
      { id: 'cash-flow', name: 'Cash Flow Statement', icon: CurrencyDollarIcon, description: 'Cash inflows and outflows' },
      { id: 'trial-balance', name: 'Trial Balance', icon: TableCellsIcon, description: 'List of all accounts and their balances' },
      { id: 'general-ledger', name: 'General Ledger', icon: DocumentTextIcon, description: 'Detailed transaction history by account' }
    ],
    budget: [
      { id: 'budget-vs-actual', name: 'Budget vs Actual', icon: ChartBarIcon, description: 'Compare budgeted amounts to actual spending' }
    ],
    donor: [
      { id: 'donor-contributions', name: 'Donor Contributions', icon: UserGroupIcon, description: 'Detailed donor giving summary' },
      { id: 'donor-aging', name: 'Donor Aging', icon: ClockIcon, description: 'Accounts receivable aging' }
    ],
    custom: [
      { id: 'custom-transactions', name: 'Custom Transaction Report', icon: DocumentTextIcon, description: 'Build your own transaction report' },
      { id: 'custom-members', name: 'Custom Member Report', icon: UserGroupIcon, description: 'Build your own member report' }
    ]
  };

  const periods = [
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'This Quarter' },
    { id: 'year', name: 'This Year' },
    { id: 'ytd', name: 'Year to Date' },
    { id: 'custom', name: 'Custom Range' }
  ];

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    try {
      const data = await reportService.getSavedReports();
      setSavedReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching saved reports:', error);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    
    if (newPeriod !== 'custom') {
      const today = new Date();
      let start = new Date();
      let end = new Date();

      switch(newPeriod) {
        case 'today':
          start = today;
          end = today;
          break;
        case 'week':
          start = new Date(today.setDate(today.getDate() - today.getDay()));
          end = new Date();
          break;
        case 'month':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date();
          break;
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3);
          start = new Date(today.getFullYear(), quarter * 3, 1);
          end = new Date();
          break;
        case 'year':
          start = new Date(today.getFullYear(), 0, 1);
          end = new Date();
          break;
        case 'ytd':
          start = new Date(today.getFullYear(), 0, 1);
          end = new Date();
          break;
        default:
          break;
      }

      setDateRange({
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      });
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let data;
      
      if (activeTab === 'financial') {
        data = await reportService.getFinancialReport({
          type: selectedReport,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period
        });
      } else if (activeTab === 'budget') {
        data = await reportService.getBudgetReport({
          year: fiscalYear,
          period: period === 'year' ? 'year' : period,
          ...(period === 'quarter' && { quarter: 1 }), // You'd get this from UI
          ...(period === 'month' && { month: new Date().getMonth() + 1 })
        });
      } else if (activeTab === 'donor') {
        if (selectedReport === 'donor-contributions') {
          data = await reportService.getDonorReport({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            year: fiscalYear
          });
        } else if (selectedReport === 'donor-aging') {
          data = await reportService.getAgingReport({
            type: 'receivable',
            asOf: dateRange.endDate
          });
        }
      } else if (activeTab === 'custom') {
        data = await reportService.generateCustomReport(customReportConfig);
      }

      setReportData(data);
      setShowPreview(true);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      let reportType = selectedReport;
      if (activeTab === 'financial') {
        await reportService.exportReport(selectedReport, {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period
        }, format);
      } else if (activeTab === 'budget') {
        await reportService.exportReport('budget', {
          year: fiscalYear,
          period: 'year'
        }, format);
      } else if (activeTab === 'donor' && selectedReport === 'donor-contributions') {
        await reportService.exportReport('donor', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }, format);
      }
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderIncomeStatement = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Income</h3>
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-200">
            {reportData?.income?.map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-sm text-gray-900">{item.category}</td>
                <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="pt-4 text-sm text-gray-900">Total Income</td>
              <td className="pt-4 text-sm text-gray-900 text-right">{formatCurrency(reportData?.totalIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses</h3>
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-200">
            {reportData?.expenses?.map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-sm text-gray-900">{item.category}</td>
                <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="pt-4 text-sm text-gray-900">Total Expenses</td>
              <td className="pt-4 text-sm text-gray-900 text-right">{formatCurrency(reportData?.totalExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-primary-50 shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-primary-900">Net Income</h3>
            {reportData?.comparison && (
              <p className="text-sm text-primary-700 mt-1">
                vs previous period: {formatCurrency(reportData.comparison.variances.net)} 
                ({reportData.comparison.variances.netPercent > 0 ? '+' : ''}{reportData.comparison.variances.netPercent}%)
              </p>
            )}
          </div>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(reportData?.netIncome)}
          </p>
        </div>
      </div>

      {/* Chart */}
      {reportData?.income && reportData?.expenses && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Income', amount: reportData.totalIncome },
                  { name: 'Expenses', amount: reportData.totalExpenses }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  const renderBalanceSheet = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assets</h3>
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-200">
            {reportData?.assets?.map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-sm text-gray-900">{item.name}</td>
                <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="pt-4 text-sm text-gray-900">Total Assets</td>
              <td className="pt-4 text-sm text-gray-900 text-right">{formatCurrency(reportData?.totalAssets)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Liabilities</h3>
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-200">
              {reportData?.liabilities?.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 text-sm text-gray-900">{item.name}</td>
                  <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 font-medium">
                <td className="pt-4 text-sm text-gray-900">Total Liabilities</td>
                <td className="pt-4 text-sm text-gray-900 text-right">{formatCurrency(reportData?.totalLiabilities)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Equity</h3>
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-200">
              {reportData?.equity?.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 text-sm text-gray-900">{item.name}</td>
                  <td className="py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 font-medium">
                <td className="pt-4 text-sm text-gray-900">Total Equity</td>
                <td className="pt-4 text-sm text-gray-900 text-right">{formatCurrency(reportData?.totalEquity)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-primary-50 shadow rounded-lg p-6">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-primary-900">Total Liabilities & Equity</span>
          <span className="text-sm font-bold text-primary-600">
            {formatCurrency((reportData?.totalLiabilities || 0) + (reportData?.totalEquity || 0))}
          </span>
        </div>
      </div>
    </div>
  );

  const renderCashFlow = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Operating Activities</h3>
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-200">
            {reportData?.operating?.items?.map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-sm text-gray-900">{item.description}</td>
                <td className={`py-2 text-sm text-right ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="pt-4 text-sm text-gray-900">Net Cash from Operating Activities</td>
              <td className="pt-4 text-sm text-green-600 text-right">{formatCurrency(reportData?.operating?.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Investing Activities</h3>
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-200">
            {reportData?.investing?.items?.map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-sm text-gray-900">{item.description}</td>
                <td className={`py-2 text-sm text-right ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="pt-4 text-sm text-gray-900">Net Cash from Investing Activities</td>
              <td className="pt-4 text-sm text-red-600 text-right">{formatCurrency(reportData?.investing?.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financing Activities</h3>
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-200">
            {reportData?.financing?.items?.map((item, index) => (
              <tr key={index}>
                <td className="py-2 text-sm text-gray-900">{item.description}</td>
                <td className={`py-2 text-sm text-right ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="pt-4 text-sm text-gray-900">Net Cash from Financing Activities</td>
              <td className="pt-4 text-sm text-green-600 text-right">{formatCurrency(reportData?.financing?.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-primary-50 shadow rounded-lg p-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-primary-900">Net Increase in Cash</span>
            <span className="text-sm font-medium text-green-600">{formatCurrency(reportData?.netCashFlow)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-primary-900">Cash at Beginning</span>
            <span className="text-sm text-primary-900">{formatCurrency(reportData?.beginningCash)}</span>
          </div>
          <div className="border-t border-primary-200 pt-3 flex justify-between">
            <span className="text-base font-bold text-primary-900">Cash at End</span>
            <span className="text-base font-bold text-primary-600">{formatCurrency(reportData?.endingCash)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBudgetReport = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Budget</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actual</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Variance</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData?.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900">{item.category}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.budget)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.actual)}</td>
                  <td className={`px-4 py-2 text-sm text-right ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                  </td>
                  <td className={`px-4 py-2 text-sm text-right ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.variancePercent}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td className="px-4 py-2 text-sm text-gray-900">Total</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(reportData?.summary?.totalBudget)}</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(reportData?.summary?.totalActual)}</td>
                <td className={`px-4 py-2 text-sm text-right ${(reportData?.summary?.totalVariance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData?.summary?.totalVariance)}
                </td>
                <td className={`px-4 py-2 text-sm text-right ${(reportData?.summary?.totalVariancePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData?.summary?.totalVariancePercent}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Budget vs Actual</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData?.items || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="budget" fill="#8884d8" name="Budget" />
              <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderDonorReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Contributions</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData?.totalContributions)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Donors</p>
          <p className="text-2xl font-bold text-gray-900">{reportData?.totalDonors}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Average Gift</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData?.averageGift)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Top Donor</p>
          <p className="text-lg font-bold text-purple-600 truncate">
            {reportData?.donors?.[0]?.name || 'N/A'}
          </p>
        </div>
      </div>

      {/* Donor Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Donor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData?.donors?.map((donor) => (
                <tr key={donor.memberId}>
                  <td className="px-4 py-2 text-sm text-gray-900">{donor.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{donor.email || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(donor.total)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right">{donor.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contributions by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData?.byCategory || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="category"
                >
                  {(reportData?.byCategory || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Donors</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData?.donors?.slice(0, 5) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgingReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reportData?.buckets?.map((bucket, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500">{bucket.bucket}</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(bucket.total)}</p>
            <p className="text-xs text-gray-400">{bucket.items.length} items</p>
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Aging Details</h3>
        </div>
        {reportData?.buckets?.map((bucket, index) => (
          bucket.items.length > 0 && (
            <div key={index} className="p-4 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{bucket.bucket}</h4>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Member/Vendor</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bucket.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.date}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.member || item.vendor || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ))}
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (!reportData) return null;

    if (activeTab === 'financial') {
      switch(selectedReport) {
        case 'income-statement':
          return renderIncomeStatement();
        case 'balance-sheet':
          return renderBalanceSheet();
        case 'cash-flow':
          return renderCashFlow();
        case 'trial-balance':
          return renderTrialBalance();
        default:
          return renderIncomeStatement();
      }
    } else if (activeTab === 'budget') {
      return renderBudgetReport();
    } else if (activeTab === 'donor') {
      if (selectedReport === 'donor-contributions') {
        return renderDonorReport();
      } else if (selectedReport === 'donor-aging') {
        return renderAgingReport();
      }
    }

    return null;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Financial Reports
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate and export various financial reports
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {['financial', 'budget', 'donor', 'custom'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedReport(reportTypes[tab][0].id);
                  setReportData(null);
                  setShowPreview(false);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab} Reports
              </button>
            ))}
          </nav>
        </div>

        {/* Report Selection and Parameters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
              >
                {reportTypes[activeTab]?.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {reportTypes[activeTab]?.find(t => t.id === selectedReport)?.description}
              </p>
            </div>

            {activeTab !== 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                  <select
                    value={period}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {period === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                      />
                    </div>
                  </>
                )}

                {(activeTab === 'budget' || activeTab === 'donor') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fiscal Year</label>
                    <select
                      value={fiscalYear}
                      onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={generateReport}
                className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-md hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)]"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        {showPreview && reportData && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{reportData.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.period || `As of ${reportData.asOf}`}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('pdf')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <TableCellsIcon className="h-4 w-4 mr-2" />
                  CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print
                </button>
              </div>
            </div>

            {renderReportContent()}
          </div>
        )}

        {/* Saved Reports */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Saved Reports</h2>
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]"
            >
              {showSaved ? 'Hide' : 'Show'} Saved Reports
            </button>
          </div>

          {showSaved && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {savedReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-xs text-gray-500">{report.period}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{report.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Created {formatDate(report.createdAt)}</p>
                    <p className="text-xs text-gray-400 mt-1">by {report.createdBy}</p>
                    <button className="mt-3 text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)]">
                      Load Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}