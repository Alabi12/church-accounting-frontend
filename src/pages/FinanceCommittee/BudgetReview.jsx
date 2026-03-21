import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function BudgetReview() {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending',
    department: 'all',
    search: '',
    priority: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchBudgets();
  }, [filters]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/committee/budgets?${params}`);
      setBudgets(response.data.budgets || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setBudgets([
      {
        id: 1,
        name: 'Youth Ministry Annual Budget 2024',
        department: 'Youth Ministry',
        fiscalYear: 2024,
        totalAmount: 75000,
        requestedAmount: 85000,
        previousAmount: 65000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        submittedBy: 'John Pastor',
        submittedDate: '2024-03-10',
        status: 'pending',
        priority: 'high',
        description: 'Annual budget for youth programs, events, and outreach',
        categories: [
          { name: 'Events & Retreats', requested: 30000, approved: 0, notes: 'Summer camp and conferences' },
          { name: 'Curriculum & Materials', requested: 15000, approved: 0, notes: 'Sunday school materials' },
          { name: 'Staff & Volunteers', requested: 25000, approved: 0, notes: 'Youth pastor stipend' },
          { name: 'Outreach Programs', requested: 15000, approved: 0, notes: 'Community events' },
        ],
        attachments: ['budget_proposal.pdf', 'event_schedule.xlsx'],
        comments: [
          { id: 1, user: 'Mike Treasurer', text: 'Need more details on event costs', date: '2024-03-11' },
          { id: 2, user: 'Sarah Accountant', text: 'Previous year actuals were lower', date: '2024-03-12' },
        ]
      },
      {
        id: 2,
        name: 'Worship Department Budget',
        department: 'Worship',
        fiscalYear: 2024,
        totalAmount: 45000,
        requestedAmount: 52000,
        previousAmount: 42000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        submittedBy: 'Sarah Worship',
        submittedDate: '2024-03-08',
        status: 'pending',
        priority: 'medium',
        description: 'Worship ministry including music, sound, and production',
        categories: [
          { name: 'Music Licensing', requested: 5000, approved: 0, notes: 'CCLI license' },
          { name: 'Equipment Maintenance', requested: 8000, approved: 0, notes: 'Sound system upkeep' },
          { name: 'New Instruments', requested: 15000, approved: 0, notes: 'Guitar and keyboard' },
          { name: 'Volunteer Training', requested: 14000, approved: 0, notes: 'Workshops and resources' },
        ],
        comments: []
      },
      {
        id: 3,
        name: 'Building Maintenance Fund',
        department: 'Facilities',
        fiscalYear: 2024,
        totalAmount: 120000,
        requestedAmount: 150000,
        previousAmount: 110000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        submittedBy: 'Mike Facilities',
        submittedDate: '2024-03-05',
        status: 'reviewed',
        priority: 'high',
        description: 'Building repairs, maintenance, and improvements',
        categories: [
          { name: 'HVAC Maintenance', requested: 25000, approved: 25000, notes: 'Quarterly service' },
          { name: 'Roof Repair', requested: 45000, approved: 40000, notes: 'Partial repair needed' },
          { name: 'Painting', requested: 30000, approved: 25000, notes: 'Interior painting' },
          { name: 'Plumbing', requested: 50000, approved: 30000, notes: 'Bathroom renovations' },
        ],
        comments: [
          { id: 3, user: 'Jane Auditor', text: 'Roof quote seems high, get second opinion', date: '2024-03-07' },
        ]
      },
    ]);

    setStats({
      total: 8,
      pending: 5,
      reviewed: 2,
      approved: 1,
      rejected: 0
    });
  };

  const handleApprove = (budgetId) => {
    toast.success('Budget approved');
    // Implement approval
  };

  const handleReject = (budgetId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      toast.success('Budget rejected');
      // Implement rejection with reason
    }
  };

  const handleRequestChanges = (budgetId) => {
    const changes = window.prompt('Please specify changes needed:');
    if (changes) {
      toast.success('Change request sent');
      // Implement change request
    }
  };

  const handleAddComment = (budgetId) => {
    if (!newComment.trim()) return;
    toast.success('Comment added');
    setNewComment('');
    // Implement comment addition
  };

  const handleCategoryApprove = (budgetId, categoryIndex) => {
    // Implement category-level approval
    toast.success('Category approved');
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
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateVariance = (requested, approved) => {
    if (!approved) return null;
    const variance = ((approved - requested) / requested) * 100;
    return {
      amount: approved - requested,
      percentage: variance
    };
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Budget Review</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchBudgets}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Reviewed</p>
          <p className="text-xl font-bold text-blue-600">{stats.reviewed}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Departments</option>
              <option value="Youth Ministry">Youth Ministry</option>
              <option value="Worship">Worship</option>
              <option value="Facilities">Facilities</option>
              <option value="Missions">Missions</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search budgets..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-4">
        {budgets.map((budget) => (
          <div key={budget.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-medium text-gray-900">{budget.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(budget.priority)}`}>
                    {budget.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(budget.status)}`}>
                    {budget.status}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900">{budget.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fiscal Year</p>
                    <p className="text-sm text-gray-900">{budget.fiscalYear}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitted By</p>
                    <p className="text-sm text-gray-900">{budget.submittedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitted Date</p>
                    <p className="text-sm text-gray-900">{formatDate(budget.submittedDate)}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Requested Amount</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(budget.requestedAmount)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Previous Year</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(budget.previousAmount)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Variance</p>
                    <p className={`text-lg font-semibold ${
                      budget.requestedAmount > budget.previousAmount ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {((budget.requestedAmount - budget.previousAmount) / budget.previousAmount * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-4">{budget.description}</p>

                {/* Category Summary */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Budget Categories</h4>
                  <div className="space-y-2">
                    {budget.categories.map((category, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{category.name}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-900">{formatCurrency(category.requested)}</span>
                          {category.approved > 0 && (
                            <span className="text-green-600">{formatCurrency(category.approved)}</span>
                          )}
                          {budget.status === 'pending' && (
                            <button
                              onClick={() => handleCategoryApprove(budget.id, idx)}
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments Section */}
                {budget.comments.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Comments</h4>
                    <div className="space-y-2">
                      {budget.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-2 rounded">
                          <p className="text-sm text-gray-600">{comment.text}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {comment.user} • {formatDate(comment.date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="ml-6 flex flex-col space-y-2 min-w-[120px]">
                <button
                  onClick={() => {
                    setSelectedBudget(budget);
                    setShowDetails(true);
                  }}
                  className="inline-flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Review
                </button>
                {budget.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(budget.id)}
                      className="inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestChanges(budget.id)}
                      className="inline-flex items-center justify-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleReject(budget.id)}
                      className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget Details Modal */}
      {showDetails && selectedBudget && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedBudget.name}</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Budget Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{selectedBudget.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fiscal Year</p>
                  <p className="font-medium">{selectedBudget.fiscalYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted By</p>
                  <p className="font-medium">{selectedBudget.submittedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted Date</p>
                  <p className="font-medium">{formatDate(selectedBudget.submittedDate)}</p>
                </div>
              </div>

              {/* Budget Amounts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Requested Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedBudget.requestedAmount)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Previous Year</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedBudget.previousAmount)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Variance</p>
                  <p className={`text-2xl font-bold ${
                    selectedBudget.requestedAmount > selectedBudget.previousAmount ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {((selectedBudget.requestedAmount - selectedBudget.previousAmount) / selectedBudget.previousAmount * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedBudget.description}
                </p>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Budget Categories</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Requested</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Approved</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedBudget.categories.map((category, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-900">{category.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(category.requested)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {category.approved ? formatCurrency(category.approved) : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">{category.notes}</td>
                        <td className="px-4 py-2 text-center">
                          {selectedBudget.status === 'pending' && (
                            <button
                              onClick={() => handleCategoryApprove(selectedBudget.id, idx)}
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Attachments */}
              {selectedBudget.attachments && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {selectedBudget.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center text-sm text-primary-600 hover:text-primary-700">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        <button>{file}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Comments & Discussion</h3>
                <div className="space-y-3 mb-4">
                  {selectedBudget.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">{comment.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {comment.user} • {formatDate(comment.date)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <button
                    onClick={() => handleAddComment(selectedBudget.id)}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                    Comment
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedBudget.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleReject(selectedBudget.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleRequestChanges(selectedBudget.id)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleApprove(selectedBudget.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve Budget
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}