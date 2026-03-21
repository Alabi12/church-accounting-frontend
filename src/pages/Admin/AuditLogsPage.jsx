import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ShieldCheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangePicker from '../../components/common/DateRangePicker';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auditLogs', page, filters],
    queryFn: () => adminService.getAuditLogs({
      page,
      perPage: 20,
      ...filters
    }),
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      await adminService.exportAuditLogs(filters);
      toast.success('Audit logs exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export audit logs');
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const actions = [
    'CREATE_USER', 'UPDATE_USER', 'DELETE_USER',
    'CREATE_INCOME', 'UPDATE_INCOME', 'DELETE_INCOME',
    'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE',
    'CREATE_BUDGET', 'UPDATE_BUDGET', 'DELETE_BUDGET', 'APPROVE_BUDGET', 'REJECT_BUDGET',
    'USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_CHANGE',
    'SYSTEM_SETTINGS_UPDATE', 'ROLE_PERMISSIONS_UPDATE',
  ];

  const resources = [
    'user', 'income', 'expense', 'budget', 'member', 'donation',
    'report', 'account', 'settings', 'role', 'permission',
  ];

  if (isLoading && !data) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track all system activities and changes
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{data.total || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Today's Logs</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.logs?.filter(log => 
                  new Date(log.timestamp).toDateString() === new Date().toDateString()
                ).length || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Unique Users</p>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(data.logs?.map(log => log.userId)).size || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Create Actions</p>
              <p className="text-2xl font-bold text-green-600">
                {data.logs?.filter(log => log.action.includes('CREATE')).length || 0}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-gray-200 p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    User ID
                  </label>
                  <input
                    type="text"
                    name="userId"
                    value={filters.userId}
                    onChange={handleFilterChange}
                    placeholder="Enter user ID"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Action
                  </label>
                  <select
                    name="action"
                    value={filters.action}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">All Actions</option>
                    {actions.map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Resource
                  </label>
                  <select
                    name="resource"
                    value={filters.resource}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">All Resources</option>
                    {resources.map(resource => (
                      <option key={resource} value={resource}>{resource}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Date Range
                  </label>
                  <DateRangePicker
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    onStartDateChange={(date) => setFilters({ ...filters, startDate: date })}
                    onEndDateChange={(date) => setFilters({ ...filters, endDate: date })}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Search in data..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.logs?.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDateTime(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{log.userName || `User ${log.userId}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.resourceId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {(!data?.logs || data.logs.length === 0) && (
            <div className="text-center py-12">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search ? 'Try adjusting your filters' : 'No activities have been logged yet.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {data.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === data.pages}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Log Details Modal */}
        {showDetails && selectedLog && (
          <LogDetailsModal
            log={selectedLog}
            onClose={() => {
              setShowDetails(false);
              setSelectedLog(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Log Details Modal Component
const LogDetailsModal = ({ log, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Audit Log Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Log ID</p>
              <p className="font-medium">{log.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Timestamp</p>
              <p className="font-medium">{formatDateTime(log.timestamp)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-medium">{log.userId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User Name</p>
              <p className="font-medium">{log.userName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Action</p>
              <p className="font-medium">
                <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Resource</p>
              <p className="font-medium">{log.resource}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Resource ID</p>
              <p className="font-medium">{log.resourceId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">IP Address</p>
              <p className="font-medium">{log.ipAddress || 'N/A'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">User Agent</p>
            <p className="text-sm bg-gray-50 p-3 rounded break-all">
              {log.userAgent || 'N/A'}
            </p>
          </div>

          {log.data && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Additional Data</p>
              <pre className="text-sm bg-gray-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;