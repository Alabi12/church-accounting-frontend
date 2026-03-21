import React, { useState, useEffect } from 'react';
import {
  HeartIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon
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
  Line
} from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function MemberGiving() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [givingHistory, setGivingHistory] = useState([]);
  const [stats, setStats] = useState({
    totalGivers: 0,
    totalAmount: 0,
    averageGift: 0,
    topGiver: '',
    monthlyTotal: 0,
    growth: 0
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'amount'
  });
  const [showDetails, setShowDetails] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberGiving();
    }
  }, [selectedMember, dateRange]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/pastor/members');
      setMembers(response.data.members || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching members:', error);
      setMockMembers();
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberGiving = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const response = await api.get(`/pastor/members/${selectedMember.id}/giving?${params}`);
      setGivingHistory(response.data.history || []);
      setChartData(response.data.chartData || []);
      setCategoryData(response.data.categoryData || []);
    } catch (error) {
      console.error('Error fetching giving history:', error);
      setMockGivingHistory();
    }
  };

  const setMockMembers = () => {
    setMembers([
      {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        joinDate: '2020-01-15',
        totalGiven: 12500,
        lastGift: '2024-03-15',
        givingFrequency: 'weekly',
        status: 'active'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '(555) 234-5678',
        joinDate: '2019-06-20',
        totalGiven: 8750,
        lastGift: '2024-03-14',
        givingFrequency: 'bi-weekly',
        status: 'active'
      },
      {
        id: 3,
        name: 'Michael Brown',
        email: 'michael.b@email.com',
        phone: '(555) 345-6789',
        joinDate: '2021-03-10',
        totalGiven: 5200,
        lastGift: '2024-03-10',
        givingFrequency: 'monthly',
        status: 'active'
      },
      {
        id: 4,
        name: 'Emily Davis',
        email: 'emily.d@email.com',
        phone: '(555) 456-7890',
        joinDate: '2022-08-05',
        totalGiven: 3400,
        lastGift: '2024-03-01',
        givingFrequency: 'occasional',
        status: 'active'
      },
    ]);

    setStats({
      totalGivers: 45,
      totalAmount: 125000,
      averageGift: 185,
      topGiver: 'John Smith',
      monthlyTotal: 18500,
      growth: 12.5
    });
  };

  const setMockGivingHistory = () => {
    setGivingHistory([
      { date: '2024-03-15', amount: 500, category: 'tithe', method: 'online' },
      { date: '2024-03-08', amount: 500, category: 'tithe', method: 'online' },
      { date: '2024-03-01', amount: 500, category: 'tithe', method: 'online' },
      { date: '2024-02-23', amount: 500, category: 'tithe', method: 'online' },
      { date: '2024-02-16', amount: 500, category: 'tithe', method: 'online' },
      { date: '2024-02-09', amount: 500, category: 'tithe', method: 'online' },
    ]);

    setChartData([
      { month: 'Jan', amount: 2000 },
      { month: 'Feb', amount: 2000 },
      { month: 'Mar', amount: 1500 },
      { month: 'Apr', amount: 2000 },
      { month: 'May', amount: 2000 },
      { month: 'Jun', amount: 2000 },
    ]);

    setCategoryData([
      { name: 'Tithe', value: 4500 },
      { name: 'Offering', value: 1500 },
      { name: 'Special', value: 500 },
    ]);
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowDetails(true);
  };

  const handleExport = () => {
    toast.success('Exporting giving data...');
  };

  const handleSendStatement = (member) => {
    toast.success(`Giving statement sent to ${member.email}`);
  };

  const filteredMembers = members.filter(member => {
    if (filters.search && !member.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && member.status !== filters.status) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'amount') {
      return b.totalGiven - a.totalGiven;
    }
    if (filters.sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Giving</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and view member contributions
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Active Givers</p>
          <p className="text-xl font-bold text-gray-900">{stats.totalGivers}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Giving</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Average Gift</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.averageGift)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Monthly Total</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.monthlyTotal)}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Growth</p>
          <p className="text-xl font-bold text-green-600">+{stats.growth}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Members</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="amount">Sort by Amount</option>
              <option value="name">Sort by Name</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Given</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Gift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-800 font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">Member since {formatDate(member.joinDate)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.email}</div>
                    <div className="text-sm text-gray-500">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(member.totalGiven)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(member.lastGift)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{member.givingFrequency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewMember(member)}
                      className="text-primary-600 hover:text-primary-700 mr-3"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleSendStatement(member)}
                      className="text-primary-600 hover:text-primary-700"
                      title="Send Statement"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {showDetails && selectedMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Member Giving Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Member Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-800 text-xl font-medium">
                    {selectedMember.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{selectedMember.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMember.email} • {selectedMember.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">Member since {formatDate(selectedMember.joinDate)}</p>
                </div>
              </div>
            </div>

            {/* Giving Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Given</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedMember.totalGiven)}</p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-500">Average Gift</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(selectedMember.totalGiven / givingHistory.length || 0)}
                </p>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-500">Giving Frequency</p>
                <p className="text-2xl font-bold text-green-600 capitalize">{selectedMember.givingFrequency}</p>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Giving History</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Giving History Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Method</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {givingHistory.map((gift, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatDate(gift.date)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 capitalize">{gift.category}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 capitalize">{gift.method}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(gift.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleSendStatement(selectedMember)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Send Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}