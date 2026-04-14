// pages/Treasurer/CashFlow.jsx
import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
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
} from 'recharts';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const CashFlow = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cashFlowData, setCashFlowData] = useState({
    operatingCashFlow: 0,
    investingCashFlow: 0,
    financingCashFlow: 0,
    netCashFlow: 0,
    beginningCash: 0,
    endingCash: 0,
    monthlyData: [],
    cashAccounts: []
  });
  
  // Add missing state variables
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'month', 'quarter', 'year'
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedAccount, setSelectedAccount] = useState('all');

  useEffect(() => {
    fetchCashFlowData();
  }, [selectedPeriod, dateRange, selectedAccount]);

  const fetchCashFlowData = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Fetching cash flow data for period:', selectedPeriod);
      
      const params = {
        period: selectedPeriod,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      if (selectedAccount !== 'all') {
        params.accountId = selectedAccount;
      }
      
      const response = await treasurerService.getCashFlow(params);
      
      console.log('✅ Cash flow data received:', response);
      
      setCashFlowData({
        operatingCashFlow: response.operatingCashFlow || 0,
        investingCashFlow: response.investingCashFlow || 0,
        financingCashFlow: response.financingCashFlow || 0,
        netCashFlow: response.netCashFlow || 0,
        beginningCash: response.beginningCash || 0,
        endingCash: response.endingCash || 0,
        monthlyData: response.monthlyData || [],
        cashAccounts: response.cashAccounts || []
      });
      
    } catch (error) {
      console.error('Error fetching cash flow:', error);
      toast.error('Failed to load cash flow data');
      
      // Set fallback data
      setCashFlowData({
        operatingCashFlow: 0,
        investingCashFlow: 0,
        financingCashFlow: 0,
        netCashFlow: 0,
        beginningCash: 0,
        endingCash: 0,
        monthlyData: [],
        cashAccounts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCashFlowData();
    setRefreshing(false);
    toast.success('Cash flow data refreshed');
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    // Reset date range when period changes
    const endDate = new Date();
    let startDate;
    
    if (period === 'month') {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    } else if (period === 'quarter') {
      const quarter = Math.floor(endDate.getMonth() / 3);
      startDate = new Date(endDate.getFullYear(), quarter * 3, 1);
    } else if (period === 'year') {
      startDate = new Date(endDate.getFullYear(), 0, 1);
    } else {
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, isCurrency = true }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">
        {isCurrency ? formatCurrency(value) : value.toLocaleString()}
      </p>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-600">{entry.name}:</span>
              </div>
              <span className="font-semibold text-gray-900">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cash Flow Statement</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track cash inflows and outflows over time
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['month', 'quarter', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-[rgb(31,178,86)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === 'month' ? 'This Month' : period === 'quarter' ? 'This Quarter' : 'This Year'}
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Period: {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Beginning Cash"
            value={cashFlowData.beginningCash}
            icon={BanknotesIcon}
            color="blue"
          />
          <StatCard
            title="Ending Cash"
            value={cashFlowData.endingCash}
            icon={BanknotesIcon}
            color="green"
          />
          <StatCard
            title="Net Cash Flow"
            value={cashFlowData.netCashFlow}
            icon={ArrowTrendingUpIcon}
            color={cashFlowData.netCashFlow >= 0 ? "green" : "red"}
          />
          <StatCard
            title="Operating Cash Flow"
            value={cashFlowData.operatingCashFlow}
            icon={CurrencyDollarIcon}
            color={cashFlowData.operatingCashFlow >= 0 ? "green" : "orange"}
          />
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h2>
          <div className="h-80">
            {cashFlowData.monthlyData && cashFlowData.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData.monthlyData}>
                  <defs>
                    <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1FB256" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1FB256" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} stroke="#9ca3af" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="net" 
                    stroke="#1FB256" 
                    fill="url(#cashFlowGradient)" 
                    name="Net Cash Flow" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No cash flow data available
              </div>
            )}
          </div>
        </div>

        {/* Cash Flow Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Cash Flow Details</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Operating Cash Flow</p>
                <p className="text-sm text-gray-500">Cash from day-to-day operations</p>
              </div>
              <p className={`text-lg font-bold ${cashFlowData.operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowData.operatingCashFlow)}
              </p>
            </div>
            <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Investing Cash Flow</p>
                <p className="text-sm text-gray-500">Cash from buying/selling assets</p>
              </div>
              <p className={`text-lg font-bold ${cashFlowData.investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowData.investingCashFlow)}
              </p>
            </div>
            <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Financing Cash Flow</p>
                <p className="text-sm text-gray-500">Cash from loans and equity</p>
              </div>
              <p className={`text-lg font-bold ${cashFlowData.financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowData.financingCashFlow)}
              </p>
            </div>
            <div className="px-6 py-4 flex justify-between items-center bg-gray-50">
              <div>
                <p className="font-medium text-gray-900">Net Cash Flow</p>
                <p className="text-sm text-gray-500">Change in cash position</p>
              </div>
              <p className={`text-xl font-bold ${cashFlowData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowData.netCashFlow)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;