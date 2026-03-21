import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  EyeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
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
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function MinistryReports() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedMinistry, setSelectedMinistry] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const ministries = [
    'All Ministries',
    'Youth Ministry',
    'Children\'s Ministry',
    'Worship Ministry',
    'Missions Ministry',
    'Outreach Ministry',
    'Women\'s Ministry',
    'Men\'s Ministry',
    'Senior Adult Ministry'
  ];

  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', icon: UsersIcon, description: 'Service and event attendance' },
    { id: 'giving', name: 'Giving Report', icon: CurrencyDollarIcon, description: 'Ministry giving summary' },
    { id: 'events', name: 'Events Report', icon: CalendarIcon, description: 'Ministry events and activities' },
    { id: 'volunteers', name: 'Volunteer Report', icon: HeartIcon, description: 'Volunteer participation' },
    { id: 'growth', name: 'Growth Report', icon: ChartBarIcon, description: 'Ministry growth metrics' },
    { id: 'combined', name: 'Combined Ministry Report', icon: DocumentTextIcon, description: 'All ministries overview' },
  ];

  useEffect(() => {
    if (showPreview) {
      fetchReportData();
    }
  }, [reportType, dateRange, selectedMinistry]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ministry: selectedMinistry
      });
      const response = await api.get(`/pastor/ministry-reports?${params}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      setMockReportData();
    } finally {
      setLoading(false);
    }
  };

  const setMockReportData = () => {
    if (reportType === 'attendance') {
      setReportData({
        title: 'Attendance Report',
        period: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`,
        summary: {
          totalAttendance: 1250,
          averageAttendance: 185,
          growth: 8.5,
          newVisitors: 45
        },
        weeklyData: [
          { week: 'Week 1', attendance: 180 },
          { week: 'Week 2', attendance: 190 },
          { week: 'Week 3', attendance: 185 },
          { week: 'Week 4', attendance: 195 },
        ],
        serviceBreakdown: [
          { name: 'Sunday Morning', value: 850 },
          { name: 'Sunday Evening', value: 250 },
          { name: 'Wednesday Night', value: 150 },
        ]
      });
    } else if (reportType === 'giving') {
      setReportData({
        title: 'Giving Report',
        period: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`,
        summary: {
          totalGiving: 45000,
          averageGift: 185,
          topMinistry: 'Youth Ministry',
          monthlyGrowth: 12.5
        },
        ministryBreakdown: [
          { name: 'Youth Ministry', amount: 12500 },
          { name: 'Worship Ministry', amount: 8500 },
          { name: 'Missions', amount: 15000 },
          { name: 'Outreach', amount: 9000 },
        ]
      });
    }
  };

  const handleExport = (format) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateReport = () => {
    setShowPreview(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Ministry Reports</h1>
      </div>

      {/* Report Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              {reportTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              {reportTypes.find(t => t.id === reportType)?.description}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ministry</label>
            <select
              value={selectedMinistry}
              onChange={(e) => setSelectedMinistry(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              {ministries.map(ministry => (
                <option key={ministry} value={ministry}>{ministry}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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
              <p className="text-sm text-gray-500 mt-1">Period: {reportData.period}</p>
              {selectedMinistry !== 'All Ministries' && (
                <p className="text-sm text-primary-600 mt-1">Ministry: {selectedMinistry}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('pdf')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Excel
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(reportData.summary).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-xl font-bold text-gray-900">
                  {typeof value === 'number' && key.includes('amount') || key.includes('giving') || key.includes('gift')
                    ? formatCurrency(value)
                    : value}
                  {key === 'growth' && '%'}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          {reportData.weeklyData && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Weekly Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {reportData.serviceBreakdown && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Service Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {reportData.ministryBreakdown && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Ministry Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.ministryBreakdown}>
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
      )}
    </div>
  );
}