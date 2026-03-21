import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ActionItems() {
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    assignee: 'all',
    priority: 'all'
  });

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/committee/action-items');
      setActions(response.data.actions || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
      setMockActions();
    } finally {
      setLoading(false);
    }
  };

  const setMockActions = () => {
    setActions([
      {
        id: 1,
        title: 'Review Youth Ministry Budget Details',
        description: 'Schedule meeting with Youth Pastor to discuss line items',
        meeting: 'March Committee Meeting',
        assignee: 'John Treasurer',
        priority: 'high',
        dueDate: '2024-03-25',
        status: 'in-progress',
        createdAt: '2024-03-15'
      },
      {
        id: 2,
        title: 'Prepare Q1 Financial Report',
        description: 'Compile Q1 financials for next committee meeting',
        meeting: 'April Committee Meeting',
        assignee: 'Sarah Accountant',
        priority: 'high',
        dueDate: '2024-04-05',
        status: 'pending',
        createdAt: '2024-03-10'
      },
      {
        id: 3,
        title: 'Update Building Maintenance Quotes',
        description: 'Get updated quotes for roof repair from three contractors',
        meeting: 'March Committee Meeting',
        assignee: 'Mike Facilities',
        priority: 'medium',
        dueDate: '2024-03-20',
        status: 'pending',
        createdAt: '2024-03-12'
      },
      {
        id: 4,
        title: 'Draft Investment Policy Resolution',
        description: 'Create draft resolution for investment policy update',
        meeting: 'April Committee Meeting',
        assignee: 'John Treasurer',
        priority: 'low',
        dueDate: '2024-03-30',
        status: 'completed',
        createdAt: '2024-03-01'
      },
    ]);
  };

  const handleStatusChange = (id, newStatus) => {
    toast.success(`Action marked as ${newStatus}`);
    // Implement status change
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this action item?')) {
      toast.success('Action item deleted');
      // Implement delete
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in-progress': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'pending': return <ClockIcon className="h-5 w-5 text-gray-400" />;
      default: return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredActions = actions.filter(action => {
    if (filters.status !== 'all' && action.status !== filters.status) return false;
    if (filters.priority !== 'all' && action.priority !== filters.priority) return false;
    if (filters.assignee !== 'all' && action.assignee !== filters.assignee) return false;
    return true;
  });

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>
        <button
          onClick={() => {
            setEditingAction(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Action Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              value={filters.assignee}
              onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Assignees</option>
              <option value="John Treasurer">John Treasurer</option>
              <option value="Sarah Accountant">Sarah Accountant</option>
              <option value="Mike Facilities">Mike Facilities</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-4">
        {filteredActions.map((action) => (
          <div key={action.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(action.status)}
                  <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(action.priority)}`}>
                    {action.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(action.status)}`}>
                    {action.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-2">{action.description}</p>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Meeting</p>
                    <p className="text-sm text-gray-900">{action.meeting}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assignee</p>
                    <p className="text-sm text-gray-900">{action.assignee}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className={`text-sm ${
                      isOverdue(action.dueDate) && action.status !== 'completed' 
                        ? 'text-red-600 font-medium' 
                        : 'text-gray-900'
                    }`}>
                      {formatDate(action.dueDate)}
                      {isOverdue(action.dueDate) && action.status !== 'completed' && ' (Overdue)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm text-gray-900">{formatDate(action.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="ml-6 flex flex-col space-y-2 min-w-[100px]">
                <select
                  value={action.status}
                  onChange={(e) => handleStatusChange(action.id, e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => {
                    setEditingAction(action);
                    setShowForm(true);
                  }}
                  className="inline-flex items-center justify-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(action.id)}
                  className="inline-flex items-center justify-center px-3 py-1 border border-gray-300 rounded-md text-sm text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New/Edit Action Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingAction ? 'Edit Action Item' : 'New Action Item'}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  defaultValue={editingAction?.title}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  defaultValue={editingAction?.description}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assignee</label>
                  <select
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    defaultValue={editingAction?.assignee}
                  >
                    <option>John Treasurer</option>
                    <option>Sarah Accountant</option>
                    <option>Mike Facilities</option>
                    <option>Lisa Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    defaultValue={editingAction?.priority}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    defaultValue={editingAction?.dueDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    defaultValue={editingAction?.meeting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  defaultValue={editingAction?.status}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingAction ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}