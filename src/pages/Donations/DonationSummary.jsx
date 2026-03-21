import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
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
} from 'recharts';
import { donationService } from '../../services/donations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#FF6B6B', '#4ECDC4'];

const DonationSummary = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewType, setViewType] = useState('overview'); // 'overview', 'monthly', 'donors'

  useEffect(() => {
    fetchSummary();
  }, [selectedYear]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await donationService.getDonationSummary(selectedYear);
      setSummary(data);
    } catch (error) {
      console.error('Error fetching donation summary:', error);
      toast.error('Failed to load donation summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      await donationService.exportDonations({ year: selectedYear, format });
      toast.success(`Donations exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export donations');
    }
  };

  const years = [
    new Date().getFullYear() - 2,
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
  ];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/donations')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Donations
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Title and Year Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donation Summary</h1>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Type Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setViewType('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'overview'
                ? 'bg-[rgb(31,178,86)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewType('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'monthly'
                ? 'bg-[rgb(31,178,86)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly Breakdown
          </button>
          <button
            onClick={() => setViewType('donors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'donors'
                ? 'bg-[rgb(31,178,86)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Top Donors
          </button>
        </div>

        {viewType === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[rgb(31,178,86)] to-[rgb(25,142,69)] rounded-xl shadow-lg p-6 text-white">
                <p className="text-green-100 mb-2">Total Donations</p>
                <p className="text-3xl font-bold">{formatCurrency(summary?.totalDonations || 0)}</p>
                <p className="text-sm text-green-100 mt-2">{summary?.totalTransactions || 0} transactions</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-blue-100 mb-2">Average Gift</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(
                    summary?.totalTransactions
                      ? summary.totalDonations / summary.totalTransactions
                      : 0
                  )}
                </p>
                <p className="text-sm text-blue-100 mt-2">Per transaction</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-purple-100 mb-2">Unique Donors</p>
                <p className="text-3xl font-bold">{summary?.uniqueDonors || 0}</p>
                <p className="text-sm text-purple-100 mt-2">In {selectedYear}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <p className="text-orange-100 mb-2">Largest Gift</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(summary?.largestGift || 0)}
                </p>
                <p className="text-sm text-orange-100 mt-2">This year</p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Donations by Category</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary?.categories || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total"
                        nameKey="name"
                      >
                        {(summary?.categories || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {(summary?.categories || []).map((cat, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-600">{cat.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900">{formatCurrency(cat.total)}</span>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {((cat.total / summary?.totalDonations) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={summary?.monthlyBreakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#8884d8"
                        name="Donations"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quarterly Comparison */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Comparison</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary?.quarterlyBreakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="total" fill="#8884d8" name="Donations" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {viewType === 'monthly' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Monthly Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Monthly Breakdown - {selectedYear}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Donations</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Year</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary?.monthlyDetails?.map((month, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {month.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          {formatCurrency(month.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {month.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                          {formatCurrency(month.average)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {((month.total / summary?.totalDonations) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">
                        {formatCurrency(summary?.totalDonations || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {summary?.totalTransactions || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-purple-600">
                        {formatCurrency(
                          summary?.totalTransactions
                            ? summary.totalDonations / summary.totalTransactions
                            : 0
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {viewType === 'donors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Donors Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Top Donors - {selectedYear}</h2>
                <span className="text-sm text-gray-500">Showing top 20 donors</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Given</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Average Gift</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary?.topDonors?.map((donor, index) => (
                      <tr key={donor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                            {donor.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {donor.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          {formatCurrency(donor.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {donor.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">
                          {formatCurrency(donor.average)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                          {((donor.total / summary?.totalDonations) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Donor Distribution Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Donor Distribution</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary?.topDonors?.slice(0, 10) || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="name"
                    >
                      {(summary?.topDonors?.slice(0, 10) || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DonationSummary;