// pages/Reports/FinancialReports.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  ChartPieIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
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
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from 'recharts';
import { reportService } from '../../services/reports';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangePicker from '../../components/common/DateRangePicker';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#FF6B6B', '#4ECDC4'];

const FinancialReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      profitMargin: 0,
      avgMonthlyIncome: 0,
      avgMonthlyExpenses: 0
    },
    incomeBreakdown: [],
    expenseBreakdown: [],
    trends: [],
    topCategories: [],
    ratios: {
      operatingMargin: 0,
      expenseRatio: 0,
      savingsRate: 0,
      liquidityRatio: 0,
      currentRatio: 0,
      debtToEquity: 0
    }
  });
  const [comparisonData, setComparisonData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReport();
  }, [dateRange.startDate, dateRange.endDate]);

const fetchReport = async () => {
  try {
    setLoading(true);
    
    console.log('📊 Fetching financial report...');
    console.log('Date range:', dateRange);
    
    const response = await api.get('/treasurer/financial-overview', {
      params: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
    });
    
    const data = response.data;
    console.log('Data received:', data);
    
    // Extract data with proper fallbacks
    const summary = {
      totalIncome: data?.summary?.totalIncome || 0,
      totalExpenses: data?.summary?.totalExpenses || 0,
      netIncome: data?.summary?.netIncome || 0,
      profitMargin: data?.summary?.profitMargin || 0,
      avgMonthlyIncome: data?.summary?.avgMonthlyIncome || 0,
      avgMonthlyExpenses: data?.summary?.avgMonthlyExpenses || 0
    };
    
    // Income breakdown - ensure it's an array
    const incomeBreakdown = Array.isArray(data?.income) ? data.income : [];
    
    // Expense breakdown - ensure it's an array
    const expenseBreakdown = Array.isArray(data?.expenses) ? data.expenses : [];
    
    // Trends - ensure it's an array
    const trends = Array.isArray(data?.trends) ? data.trends : [];
    
    // Top categories - ensure it's an array
    const topCategories = Array.isArray(data?.topCategories) ? data.topCategories : [];
    
    // Ratios - ensure it's an object
    const ratios = data?.ratios || {
      operatingMargin: 0,
      expenseRatio: 0,
      savingsRate: 0,
      liquidityRatio: 0,
      currentRatio: 0,
      debtToEquity: 0
    };
    
    console.log('Processed data:', {
      summary,
      incomeCount: incomeBreakdown.length,
      expenseCount: expenseBreakdown.length,
      trendsCount: trends.length,
      topCategoriesCount: topCategories.length
    });
    
    setReportData({
      summary,
      incomeBreakdown,
      expenseBreakdown,
      trends,
      topCategories,
      ratios
    });
    
    setComparisonData(trends);
    
    // Show a message if no data
    if (incomeBreakdown.length === 0 && expenseBreakdown.length === 0) {
      toast.success('No transactions found for this period', { icon: 'ℹ️' });
    }

  } catch (error) {
    console.error('❌ Error fetching report:', error);
    toast.error('Failed to load financial report');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const handleExport = async (format) => {
    try {
      toast.loading(`Generating ${format.toUpperCase()} report...`, { id: 'export' });
      
      const blob = await reportService.exportReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: 'financial',
        format
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_report_${dateRange.startDate}_to_${dateRange.endDate}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${format.toUpperCase()}`, { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report', { id: 'export' });
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center mr-4">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  {/* Add this temporary debug section after the header */}
{process.env.NODE_ENV === 'development' && (
  <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-300 overflow-auto max-h-96">
    <h3 className="font-bold mb-2 text-lg">Debug Info</h3>
    <details>
      <summary className="cursor-pointer text-blue-600 font-medium">View Raw API Response</summary>
      <pre className="text-xs mt-2 p-2 bg-black text-white rounded overflow-x-auto">
        {JSON.stringify({ 
          summary: reportData.summary,
          incomeCount: reportData.incomeBreakdown.length,
          expenseCount: reportData.expenseBreakdown.length,
          firstIncome: reportData.incomeBreakdown[0],
          firstExpense: reportData.expenseBreakdown[0]
        }, null, 2)}
      </pre>
    </details>
  </div>
)}

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
            <p className="mt-2 text-sm text-gray-600">
              Comprehensive financial analysis and reporting
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              PDF
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              CSV
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onStartDateChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                onEndDateChange={(date) => setDateRange({ ...dateRange, endDate: date })}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                className="w-full px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-[rgb(31,178,86)] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Income Analysis
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'expenses'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Expense Analysis
          </button>
          <button
            onClick={() => setActiveTab('ratios')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ratios'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Financial Ratios
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.summary.totalIncome)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.summary.totalExpenses)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Net Income</p>
                <p className={`text-2xl font-bold ${reportData.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(reportData.summary.netIncome))}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reportData.summary.profitMargin?.toFixed(1) || 0}%
                </p>
              </div>
            </div>

            {/* Income vs Expenses Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses Trend</h2>
              {comparisonData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" name="Income" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                      <Line type="monotone" dataKey="net" stroke="#3b82f6" name="Net" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No trend data available
                </div>
              )}
            </div>

            {/* Top Categories */}
            {reportData.topCategories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportData.topCategories.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.type || 'Category'}</p>
                      </div>
                      <p className="font-bold text-gray-900">{formatCurrency(item.amount || 0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-6">
            {/* Income Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Income Breakdown</h2>
              {reportData.incomeBreakdown.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.incomeBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {reportData.incomeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {reportData.incomeBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b border-gray-100">
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-gray-700">{item.name || item.category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {calculatePercentage(item.amount, reportData.summary.totalIncome)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  {/* <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" /> */}
                  <p className="text-gray-500">No income data available for this period</p>
                  <p className="text-sm text-gray-400 mt-2">Try selecting a different date range</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            {/* Expense Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
              {reportData.expenseBreakdown.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData.expenseBreakdown.slice(0, 8)}
                        layout="vertical"
                        margin={{ left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="amount" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {reportData.expenseBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b border-gray-100">
                        <span className="text-gray-700">{item.name || item.category}</span>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {calculatePercentage(item.amount, reportData.summary.totalExpenses)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No expense data available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ratios' && (
          <div className="space-y-6">
            {/* Financial Ratios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Operating Margin</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.ratios.operatingMargin?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.ratios.operatingMargin > 15 ? 'Healthy' : 'Below optimal'}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Expense Ratio</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.ratios.expenseRatio?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">of total income</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Savings Rate</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.ratios.savingsRate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">of income saved</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Liquidity Ratio</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.ratios.liquidityRatio?.toFixed(2) || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.ratios.liquidityRatio > 1 ? 'Adequate' : 'Low liquidity'}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Current Ratio</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.ratios.currentRatio?.toFixed(2) || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.ratios.currentRatio > 1.5 ? 'Good' : 'Needs attention'}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Debt to Equity</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.ratios.debtToEquity?.toFixed(2) || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.ratios.debtToEquity < 1 ? 'Low risk' : 'High risk'}
                </p>
              </div>
            </div>

            {/* Monthly Averages */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Averages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">Average Monthly Income</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(reportData.summary.avgMonthlyIncome)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 mb-1">Average Monthly Expenses</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(reportData.summary.avgMonthlyExpenses)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;