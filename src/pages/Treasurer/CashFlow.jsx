import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { treasurerService } from '../../services/treasurer';
import { journalService } from '../../services/journal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangePicker from '../../components/common/DateRangePicker';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const CashFlow = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [cashAccounts, setCashAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [ifrsCashFlow, setIfrsCashFlow] = useState({
    operating: {
      inflows: 0,
      outflows: 0,
      net: 0,
      items: []
    },
    investing: {
      inflows: 0,
      outflows: 0,
      net: 0,
      items: []
    },
    financing: {
      inflows: 0,
      outflows: 0,
      net: 0,
      items: []
    },
    total: {
      inflows: 0,
      outflows: 0,
      net: 0
    }
  });
  const [summary, setSummary] = useState({
    openingBalance: 0,
    totalInflows: 0,
    totalOutflows: 0,
    netCashFlow: 0,
    closingBalance: 0
  });
  const [projection, setProjection] = useState([]);
  const [projectionAvailable, setProjectionAvailable] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    console.log('DateRange changed:', dateRange);
    fetchCashFlowData();
  }, [dateRange.startDate, dateRange.endDate]);

  // Map account categories to IFRS cash flow activities
  const getIfrsActivity = (accountName, transactionType, description = '') => {
    const name = (accountName || '').toLowerCase();
    const desc = (description || '').toLowerCase();
    
    // Operating Activities
    if (
      name.includes('revenue') ||
      name.includes('income') ||
      name.includes('sales') ||
      name.includes('receivable') ||
      name.includes('payable') ||
      name.includes('expense') ||
      name.includes('salary') ||
      name.includes('wage') ||
      name.includes('rent') ||
      name.includes('utility') ||
      name.includes('supplies') ||
      name.includes('inventory') ||
      name.includes('operating') ||
      desc.includes('tithe') ||
      desc.includes('offering') ||
      desc.includes('donation') ||
      desc.includes('salary') ||
      desc.includes('utility') ||
      desc.includes('rent')
    ) {
      return 'operating';
    }
    
    // Investing Activities
    if (
      name.includes('property') ||
      name.includes('plant') ||
      name.includes('equipment') ||
      name.includes('ppe') ||
      name.includes('asset') ||
      name.includes('building') ||
      name.includes('land') ||
      name.includes('vehicle') ||
      name.includes('furniture') ||
      name.includes('fixture') ||
      name.includes('computer') ||
      name.includes('machinery') ||
      name.includes('investment') ||
      name.includes('security') ||
      name.includes('bond') ||
      name.includes('stock') ||
      name.includes('share') ||
      name.includes('intangible') ||
      desc.includes('purchase') && desc.includes('equipment') ||
      desc.includes('buy') && desc.includes('asset') ||
      desc.includes('acquire') && desc.includes('property')
    ) {
      return 'investing';
    }
    
    // Financing Activities
    if (
      name.includes('loan') ||
      name.includes('debt') ||
      name.includes('borrow') ||
      name.includes('note payable') ||
      name.includes('bond payable') ||
      name.includes('mortgage') ||
      name.includes('equity') ||
      name.includes('capital') ||
      name.includes('dividend') ||
      name.includes('withdrawal') ||
      name.includes('distribution') ||
      name.includes('owner') ||
      name.includes('shareholder') ||
      desc.includes('loan') ||
      desc.includes('borrow') ||
      desc.includes('dividend') ||
      desc.includes('capital contribution')
    ) {
      return 'financing';
    }
    
    // Default to operating for most church transactions
    return 'operating';
  };

  const fetchCashFlowData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching cash flow data for period:', dateRange);
      
      // Fetch cash accounts and transactions
      const [accountsResult, transactionsResult] = await Promise.allSettled([
        treasurerService.getCashAccounts(),
        treasurerService.getCashTransactions(dateRange.startDate, dateRange.endDate)
      ]);

      console.log('📥 Accounts Result:', accountsResult);
      console.log('📥 Transactions Result:', transactionsResult);

      // Process cash accounts
      if (accountsResult.status === 'fulfilled') {
        const accounts = accountsResult.value.accounts || [];
        setCashAccounts(accounts);
      } else {
        console.warn('Failed to fetch cash accounts:', accountsResult.reason);
        setCashAccounts([]);
      }

      // Process cash transactions
      let transactionsList = [];
      if (transactionsResult.status === 'fulfilled') {
        transactionsList = transactionsResult.value.transactions || [];
        console.log('Transactions received:', transactionsList);
        setTransactions(transactionsList);
      } else {
        console.warn('Failed to fetch cash transactions:', transactionsResult.reason);
        setTransactions([]);
      }

      // Calculate IFRS cash flow classification
      const ifrs = {
        operating: { inflows: 0, outflows: 0, net: 0, items: [] },
        investing: { inflows: 0, outflows: 0, net: 0, items: [] },
        financing: { inflows: 0, outflows: 0, net: 0, items: [] },
        total: { inflows: 0, outflows: 0, net: 0 }
      };

      // Classify each transaction
      transactionsList.forEach(tx => {
        const activity = getIfrsActivity(tx.account, tx.type, tx.description);
        const amount = tx.amount || 0;
        const isInflow = tx.type === 'inflow';
        
        if (isInflow) {
          ifrs[activity].inflows += amount;
          ifrs.total.inflows += amount;
        } else {
          ifrs[activity].outflows += amount;
          ifrs.total.outflows += amount;
        }
        
        ifrs[activity].items.push({
          ...tx,
          ifrsActivity: activity
        });
      });

      // Calculate nets
      Object.keys(ifrs).forEach(key => {
        if (key !== 'total') {
          ifrs[key].net = ifrs[key].inflows - ifrs[key].outflows;
        }
      });
      ifrs.total.net = ifrs.total.inflows - ifrs.total.outflows;

      setIfrsCashFlow(ifrs);

      // Calculate running balance for summary
      let runningBalance = 0;
      const sortedTransactions = [...transactionsList].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      const transactionsWithBalance = sortedTransactions.map(tx => {
        if (tx.type === 'inflow') {
          runningBalance += tx.amount;
        } else {
          runningBalance -= tx.amount;
        }
        return { ...tx, runningBalance };
      });
      
      setTransactions(transactionsWithBalance.reverse());
      
      setSummary({
        openingBalance: 0,
        totalInflows: ifrs.total.inflows,
        totalOutflows: ifrs.total.outflows,
        netCashFlow: ifrs.total.net,
        closingBalance: runningBalance
      });

      // Group by date for chart
      const groupedByDate = {};
      transactionsList.forEach(tx => {
        const date = tx.date.split('T')[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = { 
            date, 
            operating: 0,
            investing: 0,
            financing: 0,
            total: 0 
          };
        }
        
        const activity = getIfrsActivity(tx.account, tx.type, tx.description);
        const amount = tx.type === 'inflow' ? tx.amount : -tx.amount;
        
        groupedByDate[date][activity] += amount;
        groupedByDate[date].total += amount;
      });
      
      setCashFlowData(Object.values(groupedByDate).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      ));
      
      // Projection not available
      setProjectionAvailable(false);
      
    } catch (error) {
      console.error('💥 Error in cash flow data fetch:', error);
      setError('Failed to load some cash flow data');
      toast.error('Some cash flow data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

 // In CashFlow.jsx, update the handleExport function:

const handleExport = async (format) => {
  try {
    toast.loading(`Generating ${format.toUpperCase()} report...`, { id: 'export' });
    
    const blob = await treasurerService.exportCashFlowReport({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      format
    });

    // Create filename with date range
    const filename = `cash_flow_${dateRange.startDate}_to_${dateRange.endDate}.${format.toLowerCase()}`;
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
    toast.success(`Cash flow report exported as ${format.toUpperCase()}`, { id: 'export' });
    
  } catch (error) {
    console.error('Export error:', error);
    toast.error(error.message || 'Failed to export report', { id: 'export' });
  }
};

  const getCashTypeIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'cash':
        return <BanknotesIcon className="h-5 w-5 text-green-600" />;
      case 'bank':
        return <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityIcon = (activity) => {
    switch(activity) {
      case 'operating':
        return <ChartBarIcon className="h-5 w-5 text-blue-600" />;
      case 'investing':
        return <BriefcaseIcon className="h-5 w-5 text-purple-600" />;
      case 'financing':
        return <BuildingLibraryIcon className="h-5 w-5 text-green-600" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />;
    }
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

  if (loading) {
    console.log('Loading state...');
    return <LoadingSpinner fullScreen />;
  }

  console.log('Rendering with data:', {
    cashAccounts: cashAccounts.length,
    transactions: transactions.length,
    ifrsCashFlow,
    summary
  });

  // Prepare pie chart data
  const pieData = [
    { name: 'Operating', value: Math.abs(ifrsCashFlow.operating.net), color: '#3b82f6' },
    { name: 'Investing', value: Math.abs(ifrsCashFlow.investing.net), color: '#8b5cf6' },
    { name: 'Financing', value: Math.abs(ifrsCashFlow.financing.net), color: '#10b981' }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cash Flow Analysis</h1>
              <p className="mt-2 text-sm text-gray-600">
                Track cash flows by operating, investing, and financing activities
              </p>
            </div>
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
              onClick={fetchCashFlowData}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Debug Info - Remove in production */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-xs">
          <p>Debug: {cashAccounts.length} accounts, {transactions.length} transactions</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                onClick={fetchCashFlowData}
                className="w-full px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* IFRS Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-800">Operating Activities</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Inflows:</span>
                <span className="font-medium text-green-600">{formatCurrency(ifrsCashFlow.operating.inflows)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Outflows:</span>
                <span className="font-medium text-red-600">{formatCurrency(ifrsCashFlow.operating.outflows)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-blue-200">
                <span className="text-blue-800">Net:</span>
                <span className={ifrsCashFlow.operating.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(ifrsCashFlow.operating.net)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl shadow-sm p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BriefcaseIcon className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-purple-800">Investing Activities</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-600">Inflows:</span>
                <span className="font-medium text-green-600">{formatCurrency(ifrsCashFlow.investing.inflows)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-600">Outflows:</span>
                <span className="font-medium text-red-600">{formatCurrency(ifrsCashFlow.investing.outflows)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-purple-200">
                <span className="text-purple-800">Net:</span>
                <span className={ifrsCashFlow.investing.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(ifrsCashFlow.investing.net)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BuildingLibraryIcon className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-800">Financing Activities</h3>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Inflows:</span>
                <span className="font-medium text-green-600">{formatCurrency(ifrsCashFlow.financing.inflows)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Outflows:</span>
                <span className="font-medium text-red-600">{formatCurrency(ifrsCashFlow.financing.outflows)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-green-200">
                <span className="text-green-800">Net:</span>
                <span className={ifrsCashFlow.financing.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(ifrsCashFlow.financing.net)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Opening Balance</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.openingBalance)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Inflows</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(summary.totalInflows)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Outflows</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalOutflows)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Net Cash Flow</p>
            <p className={`text-lg font-bold ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netCashFlow)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Closing Balance</p>
            <p className="text-lg font-bold text-purple-600">{formatCurrency(summary.closingBalance)}</p>
          </div>
        </div>

        {/* Cash Accounts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cashAccounts.length > 0 ? (
            cashAccounts.map((account) => (
              <div key={account.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getCashTypeIcon(account.type)}
                    <span className="ml-2 font-medium text-gray-900">{account.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    account.type === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {account.type}
                  </span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <div>
                    <p className="text-xs text-gray-500">Opening</p>
                    <p className="text-sm font-medium">{formatCurrency(account.openingBalance || 0)}</p>
                  </div>
                  <ArrowTrendingUpIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Closing</p>
                    <p className="text-sm font-bold text-purple-600">{formatCurrency(account.closingBalance || 0)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
              <BanknotesIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No cash accounts found</p>
            </div>
          )}
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
            onClick={() => setActiveTab('operating')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'operating'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Operating
          </button>
          <button
            onClick={() => setActiveTab('investing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'investing'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Investing
          </button>
          <button
            onClick={() => setActiveTab('financing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'financing'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Financing
          </button>
        </div>

        {/* Charts based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Cash Flow Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend by Activity</h2>
              {cashFlowData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="operating" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                        name="Operating"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="investing" 
                        stackId="2"
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.3}
                        name="Investing"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="financing" 
                        stackId="3"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                        name="Financing"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No cash flow data available for this period
                </div>
              )}
            </div>

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Composition</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* Activity-specific transaction lists */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className={`px-6 py-4 border-b border-gray-200 flex items-center ${
              activeTab === 'operating' ? 'bg-blue-50' :
              activeTab === 'investing' ? 'bg-purple-50' : 'bg-green-50'
            }`}>
              {getActivityIcon(activeTab)}
              <h2 className="text-lg font-semibold text-gray-900 ml-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Activities
              </h2>
              <span className="ml-auto font-medium">
                Net: {formatCurrency(ifrsCashFlow[activeTab].net)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Inflow</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outflow</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ifrsCashFlow[activeTab].items.length > 0 ? (
                    ifrsCashFlow[activeTab].items.slice(0, 20).map((tx, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tx.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tx.account || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                          {tx.type === 'inflow' ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                          {tx.type === 'outflow' ? formatCurrency(tx.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-purple-600">
                          {formatCurrency(tx.runningBalance || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        <CurrencyDollarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p>No {activeTab} transactions found for this period</p>
                      </td>
                    </tr>
                  )}
                </tbody>
                {ifrsCashFlow[activeTab].items.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-700">
                        Totals
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                        {formatCurrency(ifrsCashFlow[activeTab].inflows)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                        {formatCurrency(ifrsCashFlow[activeTab].outflows)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-purple-600 text-right">
                        {formatCurrency(ifrsCashFlow[activeTab].net)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* Recent Cash Transactions (for overview) */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Cash Transactions</h2>
              <span className="text-xs text-gray-500">
                Opening Balance: {formatCurrency(summary.openingBalance)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Inflow</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outflow</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length > 0 ? (
                    transactions.slice(0, 10).map((tx, index) => {
                      const activity = getIfrsActivity(tx.account, tx.type, tx.description);
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {formatDate(tx.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {tx.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {tx.account || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              activity === 'operating' ? 'bg-blue-100 text-blue-800' :
                              activity === 'investing' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {activity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                            {tx.type === 'inflow' ? formatCurrency(tx.amount) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                            {tx.type === 'outflow' ? formatCurrency(tx.amount) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-purple-600">
                            {formatCurrency(tx.runningBalance || 0)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        <CurrencyDollarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p>No transactions found for this period</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your date range
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="6" className="px-4 py-3 text-sm font-medium text-gray-700 text-right">
                        Closing Balance:
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-purple-600 text-right">
                        {formatCurrency(summary.closingBalance)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlow;