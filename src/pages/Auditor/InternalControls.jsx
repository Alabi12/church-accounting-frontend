import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function InternalControls() {
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState([]);
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    effective: 0,
    warning: 0,
    failed: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [editingControl, setEditingControl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    frequency: 'monthly',
    owner: '',
    testProcedure: ''
  });

  useEffect(() => {
    fetchControls();
  }, []);

  const fetchControls = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/internal-controls');
      setControls(response.data.controls || []);
      setTests(response.data.tests || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching controls:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setControls([
      {
        id: 1,
        name: 'Segregation of Duties',
        category: 'Financial',
        description: 'Different personnel handle cash receipt, recording, and reconciliation',
        frequency: 'continuous',
        owner: 'Finance Department',
        lastTested: '2024-03-01',
        nextTestDue: '2024-04-01',
        status: 'effective',
        effectiveness: 95
      },
      {
        id: 2,
        name: 'Dual Authorization for Payments',
        category: 'Financial',
        description: 'All payments above $1,000 require two approvers',
        frequency: 'daily',
        owner: 'Treasurer',
        lastTested: '2024-03-10',
        nextTestDue: '2024-03-17',
        status: 'warning',
        effectiveness: 85
      },
      {
        id: 3,
        name: 'Bank Reconciliation Review',
        category: 'Financial',
        description: 'Monthly bank statements reconciled by independent reviewer',
        frequency: 'monthly',
        owner: 'Accountant',
        lastTested: '2024-02-28',
        nextTestDue: '2024-03-28',
        status: 'failed',
        effectiveness: 60
      },
      {
        id: 4,
        name: 'Access Controls',
        category: 'IT',
        description: 'User access reviews and password policies',
        frequency: 'quarterly',
        owner: 'IT Department',
        lastTested: '2024-02-15',
        nextTestDue: '2024-05-15',
        status: 'effective',
        effectiveness: 92
      },
    ]);

    setTests([
      { id: 1, controlId: 1, date: '2024-03-01', result: 'pass', notes: 'All duties properly segregated', testedBy: 'Internal Audit' },
      { id: 2, controlId: 2, date: '2024-03-10', result: 'warning', notes: 'One payment had single approval', testedBy: 'Internal Audit' },
      { id: 3, controlId: 3, date: '2024-02-28', result: 'fail', notes: 'Reconciliation not performed for January', testedBy: 'External Audit' },
    ]);

    setStats({
      total: 4,
      effective: 2,
      warning: 1,
      failed: 1
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(editingControl ? 'Control updated' : 'Control created');
    setShowForm(false);
    setEditingControl(null);
    resetForm();
  };

  const handleTest = (controlId) => {
    toast.success('Starting control test...');
    // Implement test workflow
  };

  const handleEdit = (control) => {
    setEditingControl(control);
    setFormData({
      name: control.name,
      category: control.category,
      description: control.description,
      frequency: control.frequency,
      owner: control.owner,
      testProcedure: control.testProcedure || ''
    });
    setShowForm(true);
  };

  const handleDelete = (controlId) => {
    if (window.confirm('Are you sure you want to delete this control?')) {
      toast.success('Control deleted');
      // Implement delete
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      frequency: 'monthly',
      owner: '',
      testProcedure: ''
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'effective': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'effective': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return <ShieldCheckIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Internal Controls</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
            setEditingControl(null);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Control
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Controls</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Effective</p>
          <p className="text-2xl font-bold text-green-600">{stats.effective}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Warning</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Controls List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Control Inventory</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {controls.map((control) => (
            <div key={control.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(control.status)}
                    <h3 className="text-lg font-medium text-gray-900">{control.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(control.status)}`}>
                      {control.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">{control.description}</p>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium text-gray-900">{control.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Frequency</p>
                      <p className="text-sm text-gray-900">{control.frequency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Owner</p>
                      <p className="text-sm text-gray-900">{control.owner}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Tested</p>
                      <p className="text-sm text-gray-900">{new Date(control.lastTested).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Next Test Due</p>
                      <p className="text-sm text-gray-900">{new Date(control.nextTestDue).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Effectiveness Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Effectiveness</span>
                      <span>{control.effectiveness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          control.effectiveness >= 80 ? 'bg-green-500' :
                          control.effectiveness >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${control.effectiveness}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex space-x-2">
                  <button
                    onClick={() => handleTest(control.id)}
                    className="p-2 text-primary-600 hover:text-primary-700"
                    title="Run Test"
                  >
                    <PlayIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(control)}
                    className="p-2 text-blue-600 hover:text-blue-700"
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(control.id)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Recent Test Results */}
              {tests.filter(t => t.controlId === control.id).length > 0 && (
                <div className="mt-4 pl-8 border-l-2 border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Test Results</h4>
                  {tests.filter(t => t.controlId === control.id).map(test => (
                    <div key={test.id} className="flex items-start space-x-3 text-sm">
                      <span className={`mt-1 ${
                        test.result === 'pass' ? 'text-green-500' :
                        test.result === 'warning' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        •
                      </span>
                      <div>
                        <p className="text-gray-600">{test.notes}</p>
                        <p className="text-xs text-gray-400">
                          Tested by {test.testedBy} on {new Date(test.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New/Edit Control Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingControl ? 'Edit Control' : 'New Control'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Control Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Financial">Financial</option>
                    <option value="IT">IT</option>
                    <option value="Operational">Operational</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="continuous">Continuous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Control Owner</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Test Procedure</label>
                <textarea
                  value={formData.testProcedure}
                  onChange={(e) => setFormData({ ...formData, testProcedure: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Describe how to test this control..."
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
                  {editingControl ? 'Update Control' : 'Create Control'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}