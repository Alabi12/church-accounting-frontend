// src/pages/Payroll/PayrollDashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ReceiptPercentIcon,
  BuildingOfficeIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = {
  primary: '#1FB256',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  chart: ['#1FB256', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
};

function PayrollDashboard() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Fetch payroll dashboard data - FIX: Add queryFn
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['payrollDashboard'],
    queryFn: payrollService.getPayrollDashboard, // Add this line
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'posted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircleIcon className="h-3 w-3 mr-1" />;
      case 'processing':
        return <ClockIcon className="h-3 w-3 mr-1" />;
      case 'draft':
        return <DocumentTextIcon className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return <ErrorAlert message="Failed to load payroll dashboard" />;
  }

  // Use dashboardData directly (not data.data)
  const data = dashboardData || {};
  const monthlyTotals = data.monthly_totals || [];
  const ytdTotal = monthlyTotals.reduce((sum, m) => sum + (m.total || 0), 0);
  const currentMonthPayroll = data.current_month_payroll;
  
  // Prepare chart data for monthly trend
  const chartData = monthlyTotals.map((item, index) => ({
    month: item.month,
    amount: item.total || 0,
    formattedAmount: formatCurrency(item.total || 0)
  }));

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, isCurrency = true }) => (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-${color}-50`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">
          {isCurrency ? formatCurrency(value) : (value || 0).toLocaleString()}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
      </div>
    </motion.div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payroll Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Overview of payroll statistics, employee distribution, and recent activities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => navigate('/payroll/calculate')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-xl hover:bg-[rgb(25,142,69)] transition-colors shadow-sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Process Payroll
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={data.total_employees || 0}
            subtitle="Active employees"
            icon={UserGroupIcon}
            color="blue"
            isCurrency={false}
          />
          <StatCard
            title="Current Month Payroll"
            value={currentMonthPayroll?.total_net || 0}
            subtitle={`${currentMonthPayroll?.employee_count || 0} employees`}
            icon={CurrencyDollarIcon}
            color="green"
            isCurrency={true}
          />
          <StatCard
            title="Next Payment"
            value={data.next_payroll?.payment_date ? formatDate(data.next_payroll.payment_date) : 'Not scheduled'}
            subtitle={data.next_payroll?.status || 'No pending'}
            icon={CalendarIcon}
            color="yellow"
            isCurrency={false}
          />
          <StatCard
            title="YTD Payroll"
            value={ytdTotal}
            subtitle="Year to date total"
            icon={ArrowTrendingUpIcon}
            color="purple"
            isCurrency={true}
          />
        </div>

        {/* Current Month Payroll Details Card */}
        {currentMonthPayroll && currentMonthPayroll.total_net > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 mb-8 text-white"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ReceiptPercentIcon className="h-5 w-5 opacity-90" />
                  <span className="text-sm font-medium opacity-90">Current Month Payroll</span>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(currentMonthPayroll.total_net)}</p>
                <p className="text-xs opacity-75 mt-1">Net pay for {currentMonthPayroll.employee_count || 0} employees</p>
              </div>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-xs opacity-75">Gross Pay</p>
                  <p className="text-xl font-semibold">{formatCurrency(currentMonthPayroll.total_gross)}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">Deductions</p>
                  <p className="text-xl font-semibold">{formatCurrency(currentMonthPayroll.total_deductions)}</p>
                </div>
              </div>
              {currentMonthPayroll.id && (
                <button
                  onClick={() => navigate(`/payroll/runs/${currentMonthPayroll.id}`)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Details
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Employee Distribution Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Distribution</h2>
            <div className="h-80">
              {data.employees_by_type && data.employees_by_type.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.employees_by_type}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="type"
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.employees_by_type.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} employees`} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <UserGroupIcon className="h-12 w-12 mb-3 opacity-50" />
                  <p>No employee data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Payroll Trend Bar Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Monthly Payroll Trend</h2>
                <p className="text-xs text-gray-500 mt-1">Net payroll by month</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-[rgb(31,178,86)] rounded-full mr-2"></span>
                  <span className="text-xs text-gray-600">Net Pay</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              {chartData.length > 0 && chartData.some(d => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis tickFormatter={(v) => `₵${v/1000}k`} stroke="#9ca3af" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="amount" 
                      fill="url(#barGradient)" 
                      name="Net Pay" 
                      radius={[8, 8, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <ChartBarIcon className="h-12 w-12 mb-3 opacity-50" />
                  <p>No monthly data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Payroll Runs Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Payroll Runs</h2>
            </div>
            {data.recent_runs && data.recent_runs.length > 0 && (
              <button
                onClick={() => navigate('/payroll/runs')}
                className="text-sm text-[rgb(31,178,86)] hover:underline flex items-center"
              >
                View all <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recent_runs?.map((run, index) => (
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                      {run.run_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {run.period_start && run.period_end ? 
                        `${format(new Date(run.period_start), 'dd MMM')} - ${format(new Date(run.period_end), 'dd MMM yyyy')}` 
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {formatCurrency(run.total_gross)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(run.total_deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-[rgb(31,178,86)]">
                      {formatCurrency(run.total_net)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                        {getStatusIcon(run.status)}
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => navigate(`/payroll/runs/${run.id}`)}
                        className="text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)] transition-colors flex items-center justify-end gap-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {(!data.recent_runs || data.recent_runs.length === 0) && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm mb-2">No payroll runs found</p>
                      <button
                        onClick={() => navigate('/payroll/calculate')}
                        className="text-sm text-[rgb(31,178,86)] hover:underline"
                      >
                        Process your first payroll
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-400 text-right">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default PayrollDashboard;