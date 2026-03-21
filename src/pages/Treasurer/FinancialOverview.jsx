import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
  InformationCircleIcon,
  ScaleIcon,
  ChartPieIcon,
  BuildingOfficeIcon,
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
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangePicker from '../../components/common/DateRangePicker';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const FinancialOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [financialData, setFinancialData] = useState({
    income: [],
    expenses: [],
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      profitMargin: 0,
      avgMonthlyIncome: 0,
      avgMonthlyExpenses: 0
    },
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
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [incomeExpenseData, setIncomeExpenseData] = useState([]);

  const periods = [
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'yearly', name: 'Yearly' },
    { id: 'custom', name: 'Custom Range' },
  ];

  useEffect(() => {
    fetchFinancialData();
  }, [period, dateRange.startDate, dateRange.endDate]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      const params = {
        period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      console.log('📊 Fetching financial data with params:', params);
      
      // Fetch all financial data in parallel with error handling
      const [overviewData, comparison, balanceSheetData, incomeExpenseTrends] = await Promise.all([
        treasurerService.getFinancialOverview(params).catch(err => {
          console.error('Error fetching overview:', err);
          return null;
        }),
        treasurerService.getIncomeVsExpenses(6).catch(err => {
          console.error('Error fetching comparison:', err);
          return [];
        }),
        treasurerService.getBalanceSheet({ asAt: dateRange.endDate }).catch(err => {
          console.error('Error fetching balance sheet:', err);
          return null;
        }),
        treasurerService.getIncomeExpenseTrends(12).catch(err => {
          console.error('Error fetching trends:', err);
          return [];
        })
      ]);

      console.log('Overview data received:', overviewData);

      // Process and set financial data
      if (overviewData) {
        // Ensure income and expenses are arrays
        const income = Array.isArray(overviewData.income) ? overviewData.income : [];
        const expenses = Array.isArray(overviewData.expenses) ? overviewData.expenses : [];
        
        // Format income items for pie chart
        const formattedIncome = income.map(item => ({
          name: item.name || item.category || 'Other',
          category: item.category || item.name || 'Other',
          amount: parseFloat(item.amount || item.value || 0),
          value: parseFloat(item.amount || item.value || 0)
        }));

        // Format expense items for bar chart
        const formattedExpenses = expenses.map(item => ({
          name: item.name || item.category || 'Other',
          category: item.category || item.name || 'Other',
          amount: parseFloat(item.amount || item.value || 0),
          value: parseFloat(item.amount || item.value || 0)
        }));

        console.log('Formatted income:', formattedIncome);
        console.log('Formatted expenses:', formattedExpenses);

        setFinancialData({
          income: formattedIncome,
          expenses: formattedExpenses,
          summary: overviewData.summary || {
            totalIncome: 0,
            totalExpenses: 0,
            netIncome: 0,
            profitMargin: 0,
            avgMonthlyIncome: 0,
            avgMonthlyExpenses: 0
          },
          trends: overviewData.trends || [],
          topCategories: overviewData.topCategories || [],
          ratios: overviewData.ratios || {
            operatingMargin: 0,
            expenseRatio: 0,
            savingsRate: 0,
            liquidityRatio: 0,
            currentRatio: 0,
            debtToEquity: 0
          }
        });
      }
      
      if (comparison && comparison.length > 0) {
        setComparisonData(comparison);
      }
      
      if (balanceSheetData) {
        setBalanceSheet(balanceSheetData);
      }
      
      if (incomeExpenseTrends && incomeExpenseTrends.length > 0) {
        setIncomeExpenseData(incomeExpenseTrends);
      }
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error(error.response?.data?.error || 'Failed to load financial data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFinancialData();
  };

  const handleExport = async (format) => {
    try {
      toast.loading(`Generating ${format.toUpperCase()} report...`, { id: 'export' });
      
      const blob = await treasurerService.exportFinancialOverview({
        period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_overview_${dateRange.startDate}_to_${dateRange.endDate}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Financial overview exported as ${format.toUpperCase()}`, { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report', { id: 'export' });
    }
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  const getNetIncomeStatus = () => {
    const netIncome = financialData.summary.netIncome || 0;
    if (netIncome > 0) return { text: 'Surplus', color: 'text-green-600' };
    if (netIncome < 0) return { text: 'Deficit', color: 'text-red-600' };
    return { text: 'Balanced', color: 'text-gray-600' };
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

  const renderOverview = () => (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(financialData.summary.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            For period {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(financialData.summary.totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {calculatePercentage(financialData.summary.totalExpenses, financialData.summary.totalIncome)}% of income
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Net Income</p>
              <p className={`text-2xl font-bold ${financialData.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(financialData.summary.netIncome))}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {getNetIncomeStatus().text}: {financialData.summary.profitMargin?.toFixed(1) || 0}% margin
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Average</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(financialData.summary.avgMonthlyIncome || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Avg Expenses: {formatCurrency(financialData.summary.avgMonthlyExpenses || 0)}
          </p>
        </motion.div>
      </div>

      {/* Income vs Expenses Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6"
      >
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
                <Line type="monotone" dataKey="income" stroke="#059669" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="#b91c1c" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            No trend data available for the selected period
          </div>
        )}
      </motion.div>

      {/* Income and Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income by Category */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Income by Category</h2>
          {financialData.income && financialData.income.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialData.income}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="name"
                    >
                      {financialData.income.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {financialData.income.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-gray-600">{item.category || item.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-900">{formatCurrency(item.amount || 0)}</span>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {calculatePercentage(item.amount || 0, financialData.summary.totalIncome)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No income data available for this period
            </div>
          )}
        </motion.div>

        {/* Expenses by Category */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
          {financialData.expenses && financialData.expenses.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={financialData.expenses.slice(0, 10)} 
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Bar dataKey="amount" fill="#ef4444">
                      {financialData.expenses.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {financialData.expenses.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-gray-600">{item.category || item.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium text-gray-900">{formatCurrency(item.amount || 0)}</span>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {calculatePercentage(item.amount || 0, financialData.summary.totalExpenses)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No expense data available for this period
            </div>
          )}
        </motion.div>
      </div>
    </>
  );

  const renderBalanceSheet = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Balance Sheet Summary */}
      {balanceSheet && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance Sheet</h2>
          <p className="text-sm text-gray-500 mb-4">As at {formatDate(dateRange.endDate)}</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assets */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                Assets
              </h3>
              
              {balanceSheet.assets?.current?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Current Assets</h4>
                  <div className="space-y-2">
                    {balanceSheet.assets.current.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 pl-4">{item.name}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {balanceSheet.assets?.fixed?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Fixed Assets</h4>
                  <div className="space-y-2">
                    {balanceSheet.assets.fixed.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 pl-4">{item.name}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total Assets</span>
                  <span className="text-blue-600">{formatCurrency(balanceSheet.assets?.total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <ScaleIcon className="h-5 w-5 mr-2 text-orange-600" />
                Liabilities & Equity
              </h3>
              
              {balanceSheet.liabilities?.current?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Current Liabilities</h4>
                  <div className="space-y-2">
                    {balanceSheet.liabilities.current.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 pl-4">{item.name}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {balanceSheet.liabilities?.longTerm?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Long-term Liabilities</h4>
                  <div className="space-y-2">
                    {balanceSheet.liabilities.longTerm.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 pl-4">{item.name}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {balanceSheet.equity?.items?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Equity</h4>
                  <div className="space-y-2">
                    {balanceSheet.equity.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 pl-4">{item.name}</span>
                        <span className="font-medium text-purple-600">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total Liabilities & Equity</span>
                  <span className="text-purple-600">
                    {formatCurrency((balanceSheet.liabilities?.total || 0) + (balanceSheet.equity?.total || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Accounting Equation */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Accounting Equation</h4>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span className="font-bold text-blue-700">Assets</span>
              <span className="text-blue-400">{formatCurrency(balanceSheet.assets?.total || 0)}</span>
              <span className="text-blue-400">=</span>
              <span className="font-bold text-orange-700">Liabilities</span>
              <span className="text-orange-400">{formatCurrency(balanceSheet.liabilities?.total || 0)}</span>
              <span className="text-blue-400">+</span>
              <span className="font-bold text-purple-700">Equity</span>
              <span className="text-purple-400">{formatCurrency(balanceSheet.equity?.total || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderRatios = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Key Financial Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Operating Margin</h3>
            <InformationCircleIcon className="h-3 w-3 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {financialData.ratios.operatingMargin?.toFixed(1) || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {financialData.ratios.operatingMargin > 15 ? 'Healthy' : 'Below optimal'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Expense Ratio</h3>
            <InformationCircleIcon className="h-3 w-3 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {financialData.ratios.expenseRatio?.toFixed(1) || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            of total income
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Savings Rate</h3>
            <InformationCircleIcon className="h-3 w-3 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {financialData.ratios.savingsRate?.toFixed(1) || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            of total income saved
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Liquidity Ratio</h3>
            <InformationCircleIcon className="h-3 w-3 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {financialData.ratios.liquidityRatio?.toFixed(2) || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {financialData.ratios.liquidityRatio > 1 ? 'Adequate' : 'Low liquidity'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Current Ratio</h3>
            <InformationCircleIcon className="h-3 w-3 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {financialData.ratios.currentRatio?.toFixed(2) || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {financialData.ratios.currentRatio > 1.5 ? 'Good' : 'Needs attention'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Debt to Equity</h3>
            <InformationCircleIcon className="h-3 w-3 text-gray-400" />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {financialData.ratios.debtToEquity?.toFixed(2) || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {financialData.ratios.debtToEquity < 1 ? 'Low risk' : 'High risk'}
          </p>
        </div>
      </div>

      {/* Top Categories */}
      {financialData.topCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Performing Categories</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {financialData.topCategories.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-6 h-6 flex items-center justify-center bg-[rgb(31,178,86)] bg-opacity-10 text-[rgb(31,178,86)] rounded-full text-xs font-bold mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.type || (item.amount > 0 ? 'Income' : 'Expense')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(Math.abs(item.amount || 0))}</p>
                    {item.change !== undefined && (
                      <p className={`text-xs ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change}% vs previous
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
            <p className="mt-2 text-sm text-gray-600">
              Comprehensive view of your church's financial performance
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
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
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onStartDateChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                onEndDateChange={(date) => setDateRange({ ...dateRange, endDate: date })}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchFinancialData}
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
            onClick={() => setActiveTab('balance-sheet')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'balance-sheet'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Balance Sheet
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'balance-sheet' && renderBalanceSheet()}
        {activeTab === 'ratios' && renderRatios()}
      </div>
    </div>
  );
};

export default FinancialOverview;