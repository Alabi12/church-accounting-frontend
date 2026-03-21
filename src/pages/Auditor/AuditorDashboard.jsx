import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  FlagIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function AuditorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingReviews: 0,
    flaggedTransactions: 0,
    completedAudits: 0,
    criticalFindings: 0,
    highRiskItems: 0,
    complianceRate: 0
  });
  const [recentFindings, setRecentFindings] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [auditTimeline, setAuditTimeline] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAuditData();
    const interval = setInterval(fetchAuditData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      
      const [
        statsRes,
        findingsRes,
        riskRes,
        timelineRes,
        alertsRes
      ] = await Promise.all([
        api.get('/audit/dashboard-stats'),
        api.get('/audit/recent-findings'),
        api.get('/audit/risk-distribution'),
        api.get('/audit/audit-timeline'),
        api.get('/audit/alerts')
      ]);

      setStats(statsRes.data);
      setRecentFindings(findingsRes.data.findings || []);
      setRiskData(riskRes.data || []);
      setAuditTimeline(timelineRes.data || []);
      setAlerts(alertsRes.data.alerts || []);
      
    } catch (error) {
      console.error('Error fetching audit data:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setStats({
      pendingReviews: 23,
      flaggedTransactions: 15,
      completedAudits: 187,
      criticalFindings: 3,
      highRiskItems: 8,
      complianceRate: 94
    });

    setRecentFindings([
      {
        id: 1,
        title: 'Unusual cash withdrawal pattern',
        severity: 'high',
        date: '2024-03-15',
        auditor: 'System Auto-flag',
        description: 'Multiple cash withdrawals exceeding threshold detected',
        status: 'investigating'
      },
      {
        id: 2,
        title: 'Missing receipt for expense',
        severity: 'medium',
        date: '2024-03-14',
        auditor: 'John Auditor',
        description: 'Expense of $850 lacks supporting documentation',
        status: 'pending'
      },
      {
        id: 3,
        title: 'Vendor duplicate payment',
        severity: 'high',
        date: '2024-03-13',
        auditor: 'Sarah Auditor',
        description: 'Same invoice paid twice to vendor',
        status: 'resolved'
      },
      {
        id: 4,
        title: 'Budget variance exceeds limit',
        severity: 'low',
        date: '2024-03-12',
        auditor: 'System Alert',
        description: 'Ministry budget overspent by 15%',
        status: 'reviewed'
      },
    ]);

    setRiskData([
      { name: 'High Risk', value: 8 },
      { name: 'Medium Risk', value: 15 },
      { name: 'Low Risk', value: 42 },
      { name: 'No Risk', value: 35 },
    ]);

    setAuditTimeline([
      { month: 'Jan', audits: 12, findings: 3 },
      { month: 'Feb', audits: 15, findings: 5 },
      { month: 'Mar', audits: 18, findings: 4 },
      { month: 'Apr', audits: 14, findings: 6 },
      { month: 'May', audits: 20, findings: 7 },
      { month: 'Jun', audits: 16, findings: 4 },
    ]);

    setAlerts([
      { id: 1, type: 'critical', message: '3 high-risk transactions require immediate review', time: '2 hours ago' },
      { id: 2, type: 'warning', message: '5 transactions flagged for suspicious pattern', time: '5 hours ago' },
      { id: 3, type: 'info', message: 'Monthly audit report ready for review', time: '1 day ago' },
    ]);
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'investigating': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'critical': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {user?.fullName} | Last audit: {formatDate(new Date(), 'MMMM dd, yyyy')}
          </p>
        </div>
        <button
          onClick={fetchAuditData}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Refresh
        </button>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-center p-4 rounded-lg border ${
                alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              {getAlertIcon(alert.type)}
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${
                  alert.type === 'critical' ? 'text-red-800' :
                  alert.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {alert.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.pendingReviews}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-yellow-600">
            {stats.pendingReviews > 0 ? 'Requires attention' : 'All caught up'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Flagged Transactions</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.flaggedTransactions}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FlagIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-red-600">
            {stats.flaggedTransactions} need investigation
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed Audits</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.completedAudits}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-green-600">This year to date</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Compliance Rate</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.complianceRate}%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-blue-600">
            {stats.complianceRate >= 90 ? 'Excellent' : 'Needs improvement'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-sm font-medium text-red-600">High Risk: {stats.highRiskItems}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-600">Critical: {stats.criticalFindings}</p>
            </div>
          </div>
        </div>

        {/* Audit Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Audit Activity Timeline</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="audits" fill="#8884d8" name="Audits Performed" />
                <Bar dataKey="findings" fill="#82ca9d" name="Findings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Findings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Audit Findings</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {recentFindings.map((finding) => (
            <div key={finding.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-gray-900">{finding.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(finding.severity)}`}>
                      {finding.severity}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(finding.status)}`}>
                      {finding.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{finding.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Found by: {finding.auditor}</span>
                    <span>Date: {formatDate(finding.date)}</span>
                  </div>
                </div>
                <button className="ml-4 text-primary-600 hover:text-primary-700">
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
          <DocumentMagnifyingGlassIcon className="h-6 w-6 text-primary-600 mb-2" />
          <h3 className="font-medium">New Audit Review</h3>
          <p className="text-sm text-gray-500">Start reviewing transactions</p>
        </button>
        <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
          <FlagIcon className="h-6 w-6 text-primary-600 mb-2" />
          <h3 className="font-medium">Flagged Items</h3>
          <p className="text-sm text-gray-500">{stats.flaggedTransactions} need attention</p>
        </button>
        <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
          <ChartBarIcon className="h-6 w-6 text-primary-600 mb-2" />
          <h3 className="font-medium">Risk Assessment</h3>
          <p className="text-sm text-gray-500">View risk analysis</p>
        </button>
        <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
          <ShieldCheckIcon className="h-6 w-6 text-primary-600 mb-2" />
          <h3 className="font-medium">Compliance Check</h3>
          <p className="text-sm text-gray-500">Run compliance tests</p>
        </button>
      </div>
    </div>
  );
}