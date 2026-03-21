import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  HandRaisedIcon
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

export default function CommitteeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingBudgets: 0,
    upcomingMeetings: 0,
    openVotes: 0,
    reviewedBudgets: 0,
    pendingResolutions: 0,
    upcomingDeadlines: 0
  });
  const [recentBudgets, setRecentBudgets] = useState([]);
  const [upcomingVotes, setUpcomingVotes] = useState([]);
  const [meetingSchedule, setMeetingSchedule] = useState([]);
  const [budgetTrends, setBudgetTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        statsRes,
        budgetsRes,
        votesRes,
        meetingsRes,
        trendsRes,
        alertsRes
      ] = await Promise.all([
        api.get('/committee/dashboard-stats'),
        api.get('/committee/recent-budgets'),
        api.get('/committee/upcoming-votes'),
        api.get('/committee/upcoming-meetings'),
        api.get('/committee/budget-trends'),
        api.get('/committee/alerts')
      ]);

      setStats(statsRes.data);
      setRecentBudgets(budgetsRes.data.budgets || []);
      setUpcomingVotes(votesRes.data.votes || []);
      setMeetingSchedule(meetingsRes.data.meetings || []);
      setBudgetTrends(trendsRes.data || []);
      setAlerts(alertsRes.data.alerts || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setStats({
      pendingBudgets: 5,
      upcomingMeetings: 2,
      openVotes: 3,
      reviewedBudgets: 12,
      pendingResolutions: 4,
      upcomingDeadlines: 7
    });

    setRecentBudgets([
      {
        id: 1,
        name: 'Youth Ministry Annual Budget',
        department: 'Youth Ministry',
        amount: 75000,
        submittedBy: 'John Pastor',
        submittedDate: '2024-03-10',
        status: 'pending',
        priority: 'high'
      },
      {
        id: 2,
        name: 'Worship Department Budget',
        department: 'Worship',
        amount: 45000,
        submittedBy: 'Sarah Worship',
        submittedDate: '2024-03-08',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: 3,
        name: 'Building Maintenance Fund',
        department: 'Facilities',
        amount: 120000,
        submittedBy: 'Mike Facilities',
        submittedDate: '2024-03-05',
        status: 'reviewed',
        priority: 'high'
      },
    ]);

    setUpcomingVotes([
      {
        id: 1,
        title: 'Youth Ministry Budget Approval',
        meeting: 'March Committee Meeting',
        date: '2024-03-20',
        deadline: '2024-03-18',
        status: 'open',
        yesVotes: 3,
        noVotes: 1,
        abstain: 0
      },
      {
        id: 2,
        title: 'Building Fund Resolution',
        meeting: 'Special Meeting',
        date: '2024-03-22',
        deadline: '2024-03-20',
        status: 'open',
        yesVotes: 2,
        noVotes: 2,
        abstain: 1
      },
      {
        id: 3,
        title: 'Audit Committee Appointment',
        meeting: 'March Committee Meeting',
        date: '2024-03-20',
        deadline: '2024-03-19',
        status: 'upcoming',
        yesVotes: 0,
        noVotes: 0,
        abstain: 0
      },
    ]);

    setMeetingSchedule([
      {
        id: 1,
        title: 'Monthly Finance Committee Meeting',
        date: '2024-03-20',
        time: '19:00',
        location: 'Conference Room A',
        agenda: ['Budget Reviews', 'Financial Reports', 'New Business'],
        attendees: 7
      },
      {
        id: 2,
        title: 'Special Budget Review Session',
        date: '2024-03-22',
        time: '18:30',
        location: 'Zoom',
        agenda: ['Emergency Funding Request', 'Capital Campaign Review'],
        attendees: 5
      },
    ]);

    setBudgetTrends([
      { month: 'Jan', requested: 450000, approved: 420000, variance: 30000 },
      { month: 'Feb', requested: 480000, approved: 465000, variance: 15000 },
      { month: 'Mar', requested: 520000, approved: 500000, variance: 20000 },
      { month: 'Apr', requested: 490000, approved: 475000, variance: 15000 },
      { month: 'May', requested: 510000, approved: 495000, variance: 15000 },
      { month: 'Jun', requested: 530000, approved: 510000, variance: 20000 },
    ]);

    setAlerts([
      { id: 1, type: 'warning', message: '3 budgets pending review before deadline', time: '2 hours ago' },
      { id: 2, type: 'info', message: 'Committee meeting scheduled for March 20', time: '1 day ago' },
      { id: 3, type: 'critical', message: 'Vote on Youth Ministry budget closes tomorrow', time: '3 hours ago' },
    ]);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Finance Committee Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, {user?.fullName} | Next meeting: {meetingSchedule[0]?.date ? formatDate(meetingSchedule[0].date, 'MMMM dd, yyyy') : 'No upcoming meetings'}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
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
              <p className="text-sm font-medium text-gray-500">Pending Budgets</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.pendingBudgets}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-yellow-600">
            Need review this week
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Meetings</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.upcomingMeetings}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-blue-600">
            Next: {formatDate(meetingSchedule[0]?.date, 'MMM dd')}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open Votes</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.openVotes}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <HandRaisedIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-green-600">
            Your vote needed
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Reviewed Budgets</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.reviewedBudgets}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-purple-600">
            This quarter
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Budget Request Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budgetTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="requested" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="approved" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Votes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Votes</h2>
          <div className="space-y-4">
            {upcomingVotes.map((vote) => (
              <div key={vote.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{vote.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{vote.meeting}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <span className="text-gray-500">Date: {formatDate(vote.date)}</span>
                      <span className="text-gray-500">Deadline: {formatDate(vote.deadline)}</span>
                    </div>
                    {vote.status === 'open' && (
                      <div className="mt-2 flex space-x-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Yes: {vote.yesVotes}
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          No: {vote.noVotes}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          Abstain: {vote.abstain}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    vote.status === 'open' ? 'bg-green-100 text-green-800' :
                    vote.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vote.status}
                  </span>
                </div>
                {vote.status === 'open' && (
                  <button className="mt-3 text-sm text-primary-600 hover:text-primary-700">
                    Cast Your Vote →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Budgets */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Pending Budget Reviews</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBudgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {budget.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {budget.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(budget.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {budget.submittedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(budget.submittedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(budget.priority)}`}>
                      {budget.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(budget.status)}`}>
                      {budget.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-700">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meeting Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Meetings</h2>
          <div className="space-y-4">
            {meetingSchedule.map((meeting) => (
              <div key={meeting.id} className="border-l-4 border-primary-500 bg-gray-50 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(meeting.date)} at {meeting.time} • {meeting.location}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Agenda: {meeting.agenda.join(' • ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {meeting.attendees} members attending
                    </p>
                  </div>
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <DocumentTextIcon className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-medium">Review Budgets</h3>
              <p className="text-sm text-gray-500">{stats.pendingBudgets} pending</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <HandRaisedIcon className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-medium">Cast Votes</h3>
              <p className="text-sm text-gray-500">{stats.openVotes} open votes</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <CalendarIcon className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-medium">Schedule Meeting</h3>
              <p className="text-sm text-gray-500">Create new meeting</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <ChartBarIcon className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-medium">View Reports</h3>
              <p className="text-sm text-gray-500">Financial summaries</p>
            </button>
          </div>
        </div>
      </div>

      {/* Committee Progress */}
      <div className="bg-primary-50 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-primary-900 mb-4">Committee Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-primary-700">Budgets Reviewed</p>
            <p className="text-2xl font-bold text-primary-600">{stats.reviewedBudgets}/20</p>
            <div className="mt-2 h-2 bg-primary-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          <div>
            <p className="text-sm text-primary-700">Meeting Attendance</p>
            <p className="text-2xl font-bold text-primary-600">85%</p>
            <div className="mt-2 h-2 bg-primary-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          <div>
            <p className="text-sm text-primary-700">Resolutions Passed</p>
            <p className="text-2xl font-bold text-primary-600">12/15</p>
            <div className="mt-2 h-2 bg-primary-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}