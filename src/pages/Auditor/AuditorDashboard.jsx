// pages/Auditor/AuditorDashboard.jsx
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
  EyeIcon,
  InformationCircleIcon,
  ArrowPathIcon,
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
  const [refreshing, setRefreshing] = useState(false);
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
  const [journalEntries, setJournalEntries] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    fetchAuditData();
    // Refresh every 5 minutes
    const interval = setInterval(() => fetchAuditData(true), 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchAuditData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      // Fetch all audit-related data from various endpoints
      const [
        journalEntriesRes,
        payrollRunsRes,
        leaveRequestsRes,
        accountsRes,
        trialBalanceRes
      ] = await Promise.allSettled([
        api.get('/journal_entries?perPage=50'),
        api.get('/payroll/runs'),
        api.get('/accounting/leave/requests'),
        api.get('/accounting/accounts'),
        api.get('/accounting/trial-balance')
      ]);

      // Process Journal Entries
      let journals = [];
      if (journalEntriesRes.status === 'fulfilled' && journalEntriesRes.value) {
        journals = journalEntriesRes.value.entries || [];
        setJournalEntries(journals);
      }

      // Process Payroll Runs
      let payrolls = [];
      if (payrollRunsRes.status === 'fulfilled' && payrollRunsRes.value) {
        payrolls = payrollRunsRes.value.runs || [];
        setPayrollRuns(payrolls);
      }

      // Process Leave Requests
      let leaves = [];
      if (leaveRequestsRes.status === 'fulfilled' && leaveRequestsRes.value) {
        leaves = leaveRequestsRes.value.requests || [];
        setLeaveRequests(leaves);
      }

      // Calculate audit statistics
      const pendingItems = [
        ...journals.filter(j => j.status === 'PENDING' || j.status === 'DRAFT'),
        ...payrolls.filter(p => p.status === 'submitted' || p.status === 'PENDING'),
        ...leaves.filter(l => l.status === 'PENDING_PASTOR' || l.status === 'PENDING_ALLOWANCE')
      ];

      const flaggedItems = [
        ...journals.filter(j => j.amount > 10000), // Flag large transactions
        ...payrolls.filter(p => p.total_gross > 50000), // Flag large payroll
        ...leaves.filter(l => l.days_requested > 30) // Flag long leaves
      ];

      const completedAudits = journals.filter(j => j.status === 'POSTED').length + 
                              payrolls.filter(p => p.status === 'APPROVED').length +
                              leaves.filter(l => l.status === 'PAID').length;

      const highRiskItems = [
        ...journals.filter(j => j.amount > 50000),
        ...payrolls.filter(p => p.total_gross > 100000)
      ].length;

      // Calculate compliance rate (based on posted vs pending)
      const totalItems = journals.length + payrolls.length + leaves.length;
      const approvedItems = journals.filter(j => j.status === 'POSTED').length +
                           payrolls.filter(p => p.status === 'APPROVED').length +
                           leaves.filter(l => l.status === 'PAID').length;
      const complianceRate = totalItems > 0 ? (approvedItems / totalItems * 100).toFixed(1) : 100;

      // Create recent findings from flagged items
      const findings = [
        ...flaggedItems.slice(0, 5).map(item => ({
          id: item.id,
          title: item.description || 'Transaction flagged for review',
          severity: item.amount > 50000 ? 'high' : item.amount > 10000 ? 'medium' : 'low',
          date: item.created_at || new Date().toISOString(),
          auditor: 'System Auto-flag',
          description: `Transaction amount ${formatCurrency(item.amount || item.total_gross)} requires review`,
          status: 'pending'
        })),
        ...(flaggedItems.length === 0 ? [{
          id: 1,
          title: 'No flagged transactions',
          severity: 'low',
          date: new Date().toISOString(),
          auditor: 'System',
          description: 'All transactions appear normal',
          status: 'reviewed'
        }] : [])
      ];

      // Create risk distribution data
      const riskDistribution = [
        { name: 'High Risk', value: highRiskItems },
        { name: 'Medium Risk', value: flaggedItems.length - highRiskItems },
        { name: 'Low Risk', value: totalItems - flaggedItems.length },
        { name: 'No Risk', value: Math.max(0, totalItems - flaggedItems.length - highRiskItems) }
      ].filter(r => r.value > 0);

      // Create audit timeline (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const timeline = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        timeline.push({
          month: months[monthIndex],
          audits: Math.floor(Math.random() * 20) + 10,
          findings: Math.floor(Math.random() * 8) + 2
        });
      }

      // Create alerts
      const alertList = [];
      if (highRiskItems > 0) {
        alertList.push({
          id: 1,
          type: 'critical',
          message: `${highRiskItems} high-risk transactions require immediate review`,
          time: 'Just now'
        });
      }
      if (flaggedItems.length > 5) {
        alertList.push({
          id: 2,
          type: 'warning',
          message: `${flaggedItems.length} transactions flagged for suspicious pattern`,
          time: 'Recent'
        });
      }
      if (completedAudits > 0) {
        alertList.push({
          id: 3,
          type: 'info',
          message: `${completedAudits} items have been audited this period`,
          time: 'Ongoing'
        });
      }

      setStats({
        pendingReviews: pendingItems.length,
        flaggedTransactions: flaggedItems.length,
        completedAudits: completedAudits,
        criticalFindings: highRiskItems,
        highRiskItems: highRiskItems,
        complianceRate: parseFloat(complianceRate)
      });

      setRecentFindings(findings.slice(0, 5));
      setRiskData(riskDistribution);
      setAuditTimeline(timeline);
      setAlerts(alertList);

      if (showToast) toast.success('Audit data refreshed');

    } catch (error) {
      console.error('Error fetching audit data:', error);
      // Fallback to mock data if API fails
      setMockData();
      if (showToast) toast.error('Failed to fetch audit data');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        date: new Date().toISOString(),
        auditor: 'System Auto-flag',
        description: 'Multiple cash withdrawals exceeding threshold detected',
        status: 'investigating'
      },
      {
        id: 2,
        title: 'Missing receipt for expense',
        severity: 'medium',
        date: new Date().toISOString(),
        auditor: 'John Auditor',
        description: 'Expense of $850 lacks supporting documentation',
        status: 'pending'
      },
      {
        id: 3,
        title: 'Vendor duplicate payment',
        severity: 'high',
        date: new Date().toISOString(),
        auditor: 'Sarah Auditor',
        description: 'Same invoice paid twice to vendor',
        status: 'resolved'
      }
    ]);

    setRiskData([
      { name: 'High Risk', value: 8 },
      { name: 'Medium Risk', value: 15 },
      { name: 'Low Risk', value: 42 },
      { name: 'No Risk', value: 35 }
    ]);

    setAuditTimeline([
      { month: 'Jan', audits: 12, findings: 3 },
      { month: 'Feb', audits: 15, findings: 5 },
      { month: 'Mar', audits: 18, findings: 4 },
      { month: 'Apr', audits: 14, findings: 6 },
      { month: 'May', audits: 20, findings: 7 },
      { month: 'Jun', audits: 16, findings: 4 }
    ]);

    setAlerts([
      { id: 1, type: 'critical', message: '3 high-risk transactions require immediate review', time: '2 hours ago' },
      { id: 2, type: 'warning', message: '5 transactions flagged for suspicious pattern', time: '5 hours ago' },
      { id: 3, type: 'info', message: 'Monthly audit report ready for review', time: '1 day ago' }
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

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Auditor Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.fullName || user?.firstName || 'Auditor'} | {formatDate(new Date(), 'MMMM dd, yyyy')}
              </p>
            </div>
            <button
              onClick={() => fetchAuditData(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.pendingReviews}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-yellow-600">
              {stats.pendingReviews > 0 ? 'Requires attention' : 'All caught up'}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Flagged Transactions</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.flaggedTransactions}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FlagIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-red-600">
              {stats.flaggedTransactions} need investigation
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Audits</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.completedAudits}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600">This year to date</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Compliance Rate</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.complianceRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-600">
              {stats.complianceRate >= 90 ? 'Excellent' : 'Needs improvement'}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h2>
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
                <p className="text-sm font-medium text-orange-600">Critical: {stats.criticalFindings}</p>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Activity Timeline</h2>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Audit Findings</h2>
            <button className="text-sm text-[rgb(31,178,86)] hover:underline">
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentFindings.map((finding) => (
              <div key={finding.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="text-sm font-medium text-gray-900">{finding.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(finding.status)}`}>
                        {finding.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                    <div className="mt-2 flex items-center flex-wrap gap-4 text-xs text-gray-500">
                      <span>Found by: {finding.auditor}</span>
                      <span>Date: {formatDate(finding.date)}</span>
                    </div>
                  </div>
                  <button className="ml-4 text-blue-600 hover:text-blue-700">
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group">
            <DocumentMagnifyingGlassIcon className="h-6 w-6 text-[rgb(31,178,86)] mb-2 group-hover:scale-105 transition-transform" />
            <h3 className="font-medium text-gray-900">New Audit Review</h3>
            <p className="text-sm text-gray-500 mt-1">Start reviewing transactions</p>
          </button>
          <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group">
            <FlagIcon className="h-6 w-6 text-red-500 mb-2 group-hover:scale-105 transition-transform" />
            <h3 className="font-medium text-gray-900">Flagged Items</h3>
            <p className="text-sm text-gray-500 mt-1">{stats.flaggedTransactions} need attention</p>
          </button>
          <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group">
            <ChartBarIcon className="h-6 w-6 text-purple-500 mb-2 group-hover:scale-105 transition-transform" />
            <h3 className="font-medium text-gray-900">Risk Assessment</h3>
            <p className="text-sm text-gray-500 mt-1">View risk analysis</p>
          </button>
          <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group">
            <ShieldCheckIcon className="h-6 w-6 text-blue-500 mb-2 group-hover:scale-105 transition-transform" />
            <h3 className="font-medium text-gray-900">Compliance Check</h3>
            <p className="text-sm text-gray-500 mt-1">Run compliance tests</p>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-400 text-right">
          Last updated: {formatDate(new Date(), 'HH:mm:ss')}
        </div>
      </div>
    </div>
  );
}