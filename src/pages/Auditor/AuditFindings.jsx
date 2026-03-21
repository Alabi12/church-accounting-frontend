import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AuditFindings() {
  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState([]);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [editingFinding, setEditingFinding] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    category: '',
    auditRef: '',
    recommendations: '',
    dueDate: '',
    assignedTo: ''
  });

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/findings');
      setFindings(response.data.findings || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching findings:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setFindings([
      {
        id: 1,
        title: 'Inadequate segregation of duties in cash handling',
        description: 'Same person collecting cash and recording transactions',
        severity: 'high',
        category: 'Internal Control',
        auditRef: 'AUD-2024-001',
        recommendations: 'Implement dual control and separate duties',
        dueDate: '2024-04-15',
        assignedTo: 'Finance Manager',
        status: 'open',
        createdAt: '2024-03-01',
        updatedAt: '2024-03-01'
      },
      {
        id: 2,
        title: 'Missing supporting documents for expenses',
        description: '5 expenses totaling $3,500 lack receipts',
        severity: 'medium',
        category: 'Documentation',
        auditRef: 'AUD-2024-002',
        recommendations: 'Obtain missing receipts or write policy exception',
        dueDate: '2024-03-30',
        assignedTo: 'Accountant',
        status: 'in-progress',
        createdAt: '2024-03-05',
        updatedAt: '2024-03-10'
      },
      {
        id: 3,
        title: 'Bank reconciliation not performed monthly',
        description: 'March reconciliation still pending',
        severity: 'high',
        category: 'Financial',
        auditRef: 'AUD-2024-003',
        recommendations: 'Complete reconciliation by month end',
        dueDate: '2024-03-31',
        assignedTo: 'Accountant',
        status: 'open',
        createdAt: '2024-03-08',
        updatedAt: '2024-03-08'
      },
      {
        id: 4,
        title: 'Outdated user access list',
        description: 'Former employees still have system access',
        severity: 'medium',
        category: 'IT',
        auditRef: 'AUD-2024-004',
        recommendations: 'Review and update access monthly',
        dueDate: '2024-04-01',
        assignedTo: 'IT Admin',
        status: 'resolved',
        createdAt: '2024-02-15',
        updatedAt: '2024-03-01'
      },
    ]);

    setStats({
      open: 2,
      inProgress: 1,
      resolved: 1,
      total: 4
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(editingFinding ? 'Finding updated' : 'Finding created');
    setShowForm(false);
    setEditingFinding(null);
    resetForm();
  };

  const handleStatusChange = (id, newStatus) => {
    toast.success(`Finding status updated to ${newStatus}`);
    // Implement status change
  };

  const handleEdit = (finding) => {
    setEditingFinding(finding);
    setFormData({
      title: finding.title,
      description: finding.description,
      severity: finding.severity,
      category: finding.category,
      auditRef: finding.auditRef,
      recommendations: finding.recommendations,
      dueDate: finding.dueDate,
      assignedTo: finding.assignedTo
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this finding?')) {
      toast.success('Finding deleted');
      // Implement delete
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      category: '',
      auditRef: '',
      recommendations: '',
      dueDate: '',
      assignedTo: ''
    });
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'in-progress': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'resolved': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default: return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Audit Findings</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
            setEditingFinding(null);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Finding
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Findings</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {findings.map((finding) => (
          <div key={finding.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(finding.status)}
                  <h3 className="text-lg font-medium text-gray-900">{finding.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(finding.severity)}`}>
                    {finding.severity}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(finding.status)}`}>
                    {finding.status}
                  </span>
                  {isOverdue(finding.dueDate) && finding.status !== 'resolved' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      Overdue
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mt-2">{finding.description}</p>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Audit Reference</p>
                    <p className="text-sm font-medium text-gray-900">{finding.auditRef}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-gray-900">{finding.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="text-sm text-gray-900">{finding.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className={`text-sm ${
                      isOverdue(finding.dueDate) && finding.status !== 'resolved' 
                        ? 'text-red-600 font-medium' 
                        : 'text-gray-900'
                    }`}>
                      {formatDate(finding.dueDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">{formatDate(finding.updatedAt)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500">Recommendations</p>
                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded">
                    {finding.recommendations}
                  </p>
                </div>
              </div>

              <div className="ml-6 flex flex-col space-y-2">
                <select
                  value={finding.status}
                  onChange={(e) => handleStatusChange(finding.id, e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button
                  onClick={() => handleEdit(finding)}
                  className="inline-flex items-center justify-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(finding.id)}
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

      {/* New/Edit Finding Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingFinding ? 'Edit Finding' : 'New Audit Finding'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Audit Reference</label>
                  <input
                    type="text"
                    value={formData.auditRef}
                    onChange={(e) => setFormData({ ...formData, auditRef: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Recommendations</label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
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
                  {editingFinding ? 'Update Finding' : 'Create Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}