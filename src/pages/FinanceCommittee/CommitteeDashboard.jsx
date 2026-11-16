import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  HandRaisedIcon,
  InformationCircleIcon 
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    pendingBudgets: 0,
    upcomingMeetings: 0,
    openVotes: 0,
    reviewedBudgets: 0,
    pendingResolutions: 0,
    upcomingDeadlines: 0,
    totalBudgets: 20,
    attendanceRate: 85,
    resolutionsPassed: 12,
    totalResolutions: 15
  });
  const [recentBudgets, setRecentBudgets] = useState([]);
  const [upcomingVotes, setUpcomingVotes] = useState([]);
  const [meetingSchedule, setMeetingSchedule] = useState([]);
  const [budgetTrends, setBudgetTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        statsRes,
        budgetsRes,
        votesRes,
        meetingsRes,
        trendsRes,
        alertsRes
      ] = await Promise.allSettled([
        api.get('/committee/dashboard-stats'),
        api.get('/committee/recent-budgets'),
        api.get('/committee/upcoming-votes'),
        api.get('/committee/upcoming-meetings'),
        api.get('/committee/budget-trends'),
        api.get('/committee/alerts')
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(prev => ({ ...prev, ...statsRes.value.data }));
      } else {
        console.error('Failed to fetch stats:', statsRes.reason);
        toast.error('Failed to load dashboard statistics');
      }

      if (budgetsRes.status === 'fulfilled') {
        setRecentBudgets(budgetsRes.value.data.budgets || []);
      } else {
        console.error('Failed to fetch budgets:', budgetsRes.reason);
        setRecentBudgets([]);
      }

      if (votesRes.status === 'fulfilled') {
        setUpcomingVotes(votesRes.value.data.votes || []);
      } else {
        console.error('Failed to fetch votes:', votesRes.reason);
        setUpcomingVotes([]);
      }

      if (meetingsRes.status === 'fulfilled') {
        setMeetingSchedule(meetingsRes.value.data.meetings || []);
      } else {
        console.error('Failed to fetch meetings:', meetingsRes.reason);
        setMeetingSchedule([]);
      }

      if (trendsRes.status === 'fulfilled') {
        setBudgetTrends(trendsRes.value.data || []);
      } else {
        console.error('Failed to fetch trends:', trendsRes.reason);
        setBudgetTrends([]);
      }

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data.alerts || []);
      } else {
        console.error('Failed to fetch alerts:', alertsRes.reason);
        setAlerts([]);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection and try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Navigation to routes that ACTUALLY exist
  const handleReviewBudget = (budgetId) => {
    // Navigate to budget review page with the budget ID as query param
    navigate(`/committee/budget-review?id=${budgetId}`);
  };

  const handleCastVote = (voteId) => {
    // Navigate to votes page (the votes page will handle which vote to show)
    navigate('/committee/votes');
  };

  const handleViewMeeting = (meetingId) => {
    // Meeting details page doesn't exist yet
    toast.info('Meeting details feature coming soon');
  };

  const handleViewAllBudgets = () => {
    // Navigate to budget review page
    navigate('/committee/budget-review');
  };

  const handleScheduleMeeting = () => {
    // Schedule meeting page doesn't exist yet
    // toast.info('Schedule meeting feature coming soon');
     navigate('/committee/meetings/schedule');
  };

  const handleViewReports = () => {
    // Navigate to financial review page
    navigate('/committee/financial-review');
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'critical': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const nextMeeting = meetingSchedule.length > 0 ? meetingSchedule[0] : null;
  const reviewedPercentage = stats.totalBudgets > 0 ? (stats.reviewedBudgets / stats.totalBudgets) * 100 : 0;
  const resolutionsPercentage = stats.totalResolutions > 0 ? (stats.resolutionsPassed / stats.totalResolutions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Committee Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, {user?.fullName || 'Committee Member'} | Next meeting: {nextMeeting?.date ? formatDate(nextMeeting.date, 'MMMM dd, yyyy') : 'No upcoming meetings'}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24">
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
              <button 
                onClick={() => handleViewMeeting(alert.meetingId)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
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
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.pendingBudgets || 0}</p>
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
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.upcomingMeetings || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-blue-600">
            Next: {nextMeeting?.date ? formatDate(nextMeeting.date, 'MMM dd') : 'No meetings'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open Votes</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.openVotes || 0}</p>
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
              <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.reviewedBudgets || 0}</p>
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
          {budgetTrends.length > 0 ? (
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
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>

        {/* Upcoming Votes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Votes</h2>
          {upcomingVotes.length > 0 ? (
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
                            Yes: {vote.yesVotes || 0}
                          </span>
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            No: {vote.noVotes || 0}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                            Abstain: {vote.abstain || 0}
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
                    <button 
                      onClick={() => handleCastVote(vote.id)}
                      className="mt-3 text-sm text-primary-600 hover:text-primary-700"
                    >
                      Cast Your Vote →
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No upcoming votes
            </div>
          )}
        </div>
      </div>

      {/* Recent Budgets */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Pending Budget Reviews</h2>
          <button 
            onClick={handleViewAllBudgets}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View All
          </button>
        </div>
        {recentBudgets.length > 0 ? (
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
                      <button 
                        onClick={() => handleReviewBudget(budget.id)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No pending budgets
          </div>
        )}
      </div>

      {/* Meeting Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Meetings</h2>
          {meetingSchedule.length > 0 ? (
            <div className="space-y-4">
              {meetingSchedule.map((meeting) => (
                <div key={meeting.id} className="border-l-4 border-primary-500 bg-gray-50 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(meeting.date)} at {meeting.time} • {meeting.location}
                      </p>
                      {meeting.agenda && meeting.agenda.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Agenda: {meeting.agenda.join(' • ')}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {meeting.attendees || 0} members attending
                      </p>
                    </div>
                    <button 
                      onClick={() => handleViewMeeting(meeting.id)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No upcoming meetings
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleViewAllBudgets}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <DocumentTextIcon className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-medium">Review Budgets</h3>
              <p className="text-sm text-gray-500">{stats.pendingBudgets || 0} pending</p>
            </button>
            <button 
              onClick={() => navigate('/committee/votes')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <HandRaisedIcon className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-medium">Cast Votes</h3>
              <p className="text-sm text-gray-500">{stats.openVotes || 0} open votes</p>
            </button>
            <button 
              onClick={handleScheduleMeeting}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <CalendarIcon className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-medium">Schedule Meeting</h3>
              <p className="text-sm text-gray-500">Create new meeting</p>
            </button>
            <button 
              onClick={handleViewReports}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
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
            <p className="text-2xl font-bold text-primary-600">{stats.reviewedBudgets || 0}/{stats.totalBudgets || 0}</p>
            <div className="mt-2 h-2 bg-primary-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full" 
                style={{ width: `${reviewedPercentage}%` }}
              ></div>
            </div>
          </div>
          <div>
            <p className="text-sm text-primary-700">Meeting Attendance</p>
            <p className="text-2xl font-bold text-primary-600">{stats.attendanceRate || 0}%</p>
            <div className="mt-2 h-2 bg-primary-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full" 
                style={{ width: `${stats.attendanceRate || 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <p className="text-sm text-primary-700">Resolutions Passed</p>
            <p className="text-2xl font-bold text-primary-600">{stats.resolutionsPassed || 0}/{stats.totalResolutions || 0}</p>
            <div className="mt-2 h-2 bg-primary-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full" 
                style={{ width: `${resolutionsPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}