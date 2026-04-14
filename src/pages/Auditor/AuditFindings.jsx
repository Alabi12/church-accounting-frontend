// pages/Auditor/AuditFindings.jsx
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
  PaperAirplaneIcon,
  ArrowPathIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AuditFindings() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [findings, setFindings] = useState([]);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [editingFinding, setEditingFinding] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    severity: 'all',
    status: 'all',
    category: 'all'
  });
  const [categories, setCategories] = useState([]);
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

  const fetchFindings = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      // Fetch findings from API
      const response = await api.get('/audit/findings');
      const findingsData = response.data.findings || [];
      
      setFindings(findingsData);
      
      // Calculate stats
      const openCount = findingsData.filter(f => f.status === 'open').length;
      const inProgressCount = findingsData.filter(f => f.status === 'in-progress').length;
      const resolvedCount = findingsData.filter(f => f.status === 'resolved').length;
      
      setStats({
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        total: findingsData.length
      });

      // Extract unique categories
      const uniqueCategories = [...new Set(findingsData.map(f => f.category).filter(Boolean))];
      setCategories(uniqueCategories);

      if (showToast) toast.success('Findings refreshed');
      
    } catch (error) {
      console.error('Error fetching findings:', error);
      // Fallback to mock data if API fails
      setMockData();
      if (showToast) toast.error('Failed to fetch findings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setMockData = () => {
    const mockFindings = [
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
    ];

    setFindings(mockFindings);
    setStats({
      open: 2,
      inProgress: 1,
      resolved: 1,
      total: 4
    });
    setCategories(['Internal Control', 'Documentation', 'Financial', 'IT']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingFinding) {
        // Update existing finding
        await api.put(`/audit/findings/${editingFinding.id}`, formData);
        toast.success('Finding updated successfully');
      } else {
        // Create new finding
        await api.post('/audit/findings', formData);
        toast.success('Finding created successfully');
      }
      
      setShowForm(false);
      setEditingFinding(null);
      resetForm();
      fetchFindings(true);
      
    } catch (error) {
      console.error('Error saving finding:', error);
      toast.error(error.response?.data?.error || 'Failed to save finding');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/audit/findings/${id}`, { status: newStatus });
      toast.success(`Finding status updated to ${newStatus}`);
      fetchFindings(true);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this finding?')) {
      try {
        await api.delete(`/audit/findings/${id}`);
        toast.success('Finding deleted');
        fetchFindings(true);
      } catch (error) {
        console.error('Error deleting finding:', error);
        toast.error('Failed to delete finding');
      }
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

  const filteredFindings = findings.filter(finding => {
    if (filters.severity !== 'all' && finding.severity !== filters.severity) return false;
    if (filters.status !== 'all' && finding.status !== filters.status) return false;
    if (filters.category !== 'all' && finding.category !== filters.category) return false;
    return true;
  });

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Findings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage audit findings and recommendations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchFindings(true)}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
                setEditingFinding(null);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-xl hover:bg-[rgb(25,142,69)] transition-colors shadow-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Finding
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">Total Findings</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">Open</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.open}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FilterIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Filters</span>
            {showFilters ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </button>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                >
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No findings found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-[rgb(31,178,86)] hover:underline"
            >
              Create your first finding
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFindings.map((finding) => (
              <div key={finding.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
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

                    <p className="text-sm text-gray-600 mb-4">{finding.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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

                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Recommendations</p>
                      <p className="text-sm text-gray-700">{finding.recommendations}</p>
                    </div>
                  </div>

                  <div className="flex lg:flex-col gap-2">
                    <select
                      value={finding.status}
                      onChange={(e) => handleStatusChange(finding.id, e.target.value)}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button
                      onClick={() => handleEdit(finding)}
                      className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(finding.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New/Edit Finding Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingFinding ? 'Edit Finding' : 'New Audit Finding'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                      required
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audit Reference <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.auditRef}
                      onChange={(e) => setFormData({ ...formData, auditRef: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recommendations <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.recommendations}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingFinding(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
                  >
                    {editingFinding ? 'Update Finding' : 'Create Finding'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}