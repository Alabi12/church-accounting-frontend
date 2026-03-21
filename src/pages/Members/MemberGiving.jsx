import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
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
import { memberService } from '../../services/members';
import { incomeService } from '../../services/income';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangePicker from '../../components/common/DateRangePicker';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const MemberGiving = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [givingData, setGivingData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [viewType, setViewType] = useState('monthly'); // 'monthly', 'category', 'trend'

  useEffect(() => {
    fetchMemberGiving();
  }, [id, dateRange]);

  const fetchMemberGiving = async () => {
    try {
      setLoading(true);
      const [memberDetails, givingHistory] = await Promise.all([
        memberService.getMemberById(id),
        memberService.getMemberGiving(id, {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      ]);
      setMember(memberDetails);
      setGivingData(givingHistory);
    } catch (error) {
      console.error('Error fetching member giving:', error);
      toast.error('Failed to load giving data');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Create CSV
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Reference', 'Status'];
    const rows = givingData?.transactions?.map(t => [
      formatDate(t.date),
      t.description || '',
      t.category,
      t.amount,
      t.reference || '',
      t.status,
    ]) || [];

    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${member?.fullName}_giving_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Giving history exported successfully');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(`/members/${id}`)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Member Details
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Member Info Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-[rgb(31,178,86)] bg-opacity-10 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-[rgb(31,178,86)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{member?.fullName}</h1>
              <p className="text-sm text-gray-500 mt-1">{member?.email}</p>
            </div>
          </div>
        </div>

        {/* Date Range and View Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onStartDateChange={(date) => setDateRange({ ...dateRange, startDate: date })}
              onEndDateChange={(date) => setDateRange({ ...dateRange, endDate: date })}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setViewType('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewType === 'monthly'
                    ? 'bg-[rgb(31,178,86)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewType('category')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewType === 'category'
                    ? 'bg-[rgb(31,178,86)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setViewType('trend')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewType === 'trend'
                    ? 'bg-[rgb(31,178,86)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Trend
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Given</p>
            <p className="text-2xl font-bold text-[rgb(31,178,86)]">
              {formatCurrency(givingData?.totalGiven || 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{givingData?.transactionCount || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Average Gift</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                (givingData?.totalGiven || 0) / (givingData?.transactionCount || 1)
              )}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Largest Gift</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                Math.max(...(givingData?.transactions?.map(t => t.amount) || [0]))
              )}
            </p>
          </div>
        </div>

        {/* Charts */}
        {viewType === 'monthly' && givingData?.monthlyBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Giving</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={givingData.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {viewType === 'category' && givingData?.categoryBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Giving by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={givingData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="category"
                    >
                      {givingData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {givingData.categoryBreakdown.map((cat, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{cat.category}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${(cat.total / givingData.totalGiven) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {viewType === 'trend' && givingData?.transactions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Giving Trend</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={givingData.transactions.map(t => ({
                  date: formatDate(t.date),
                  amount: t.amount,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {givingData?.transactions?.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.description || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      +{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.status === 'posted' 
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberGiving;