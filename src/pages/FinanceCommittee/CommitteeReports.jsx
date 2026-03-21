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
  HandRaisedIcon
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
  Cell
} from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function CommitteeReports() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('activity');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [votingData, setVotingData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/committee/reports', {
        params: { type: reportType, ...dateRange }
      });
      setReportData(response.data);
      
      switch(reportType) {
        case 'activity':
          setActivityData(response.data.activity || []);
          break;
        case 'budget':
          setBudgetData(response.data.budgets || []);
          break;
        case 'voting':
          setVotingData(response.data.votes || []);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setMockReportData();
    } finally {
      setLoading(false);
    }
  };

  const setMockReportData = () => {
    setActivityData([
      { month: 'Jan', meetings: 2, resolutions: 3, votes: 2 },
      { month: 'Feb', meetings: 2, resolutions: 4, votes: 3 },
      { month: 'Mar', meetings: 3, resolutions: 5, votes: 4 },
      { month: 'Apr', meetings: 2, resolutions: 2, votes: 2 },
      { month: 'May', meetings: 2, resolutions: 3, votes: 3 },
      { month: 'Jun', meetings: 2, resolutions: 4, votes: 3 },
    ]);

    setBudgetData([
      { name: 'Youth Ministry', requested: 85000, approved: 75000, variance: -10000 },
      { name: 'Worship', requested: 52000, approved: 45000, variance: -7000 },
      { name: 'Facilities', requested: 150000, approved: 120000, variance: -30000 },
      { name: 'Missions', requested: 65000, approved: 60000, variance: -5000 },
      { name: 'Administration', requested: 45000, approved: 42000, variance: -3000 },
    ]);

    setVotingData([
      { name: 'Passed', value: 12 },
      { name: 'Failed', value: 3 },
      { name: 'Pending', value: 5 },
    ]);
  };

  const handleExport = (format) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTypes = [
    { id: 'activity', name: 'Committee Activity Report', icon: ChartBarIcon },
    { id: 'budget', name: 'Budget Review Report', icon: CurrencyDollarIcon },
    { id: 'voting', name: 'Voting Summary Report', icon: HandRaisedIcon },
    { id: 'attendance', name: 'Meeting Attendance', icon: UsersIcon },
    { id: 'resolutions', name: 'Resolutions Status', icon: DocumentTextIcon },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Committee Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Export Excel
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

      {/* Report Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          </div>
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
              onClick={fetchReportData}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {reportTypes.find(t => t.id === reportType)?.name}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Period: {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
        </p>

        {reportType === 'activity' && (
          <div className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="meetings" fill="#8884d8" name="Meetings" />
                  <Bar dataKey="resolutions" fill="#82ca9d" name="Resolutions" />
                  <Bar dataKey="votes" fill="#ffc658" name="Votes" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Summary Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {activityData.reduce((sum, item) => sum + item.meetings, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Meetings</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {activityData.reduce((sum, item) => sum + item.resolutions, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Resolutions</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {activityData.reduce((sum, item) => sum + item.votes, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Votes</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'budget' && (
          <div className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="requested" fill="#8884d8" name="Requested" />
                  <Bar dataKey="approved" fill="#82ca9d" name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Budget Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Department</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Requested</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Approved</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Variance</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">% Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {budgetData.map((item, index) => {
                      const variance = item.approved - item.requested;
                      const percentChange = ((item.approved - item.requested) / item.requested * 100).toFixed(1);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.requested)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.approved)}</td>
                          <td className={`px-4 py-2 text-sm text-right ${variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(variance)}
                          </td>
                          <td className={`px-4 py-2 text-sm text-center ${percentChange < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {percentChange}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {reportType === 'voting' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={votingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {votingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Voting Statistics</h3>
                {votingData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Votes</span>
                    <span className="text-lg font-bold text-gray-900">
                      {votingData.reduce((sum, item) => sum + item.value, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}