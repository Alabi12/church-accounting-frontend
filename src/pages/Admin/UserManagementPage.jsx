import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import UserForm from '../../components/admin/UserForm';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });
  const [statusDialog, setStatusDialog] = useState({ isOpen: false, id: null, currentStatus: false });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', page, filters],
    queryFn: () => adminService.getUsers({
      page,
      perPage: 10,
      ...filters
    }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminService.toggleUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User status updated successfully');
    },
    onError: (error) => {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update user status');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(deleteDialog.id);
    setDeleteDialog({ isOpen: false, id: null });
  };

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate({ 
      id: statusDialog.id, 
      isActive: !statusDialog.currentStatus 
    });
    setStatusDialog({ isOpen: false, id: null, currentStatus: false });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      await adminService.exportUsers(filters);
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export users');
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      treasurer: 'bg-green-100 text-green-800',
      accountant: 'bg-blue-100 text-blue-800',
      auditor: 'bg-orange-100 text-orange-800',
      pastor: 'bg-indigo-100 text-indigo-800',
      finance_committee: 'bg-yellow-100 text-yellow-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'treasurer', label: 'Treasurer' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'pastor', label: 'Pastor' },
    { value: 'finance_committee', label: 'Finance Committee' },
    { value: 'user', label: 'User' },
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage system users, roles, and permissions
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
            <button
              onClick={() => {
                setSelectedUser(null);
                setShowUserForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{data.total || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {data.users?.filter(u => u.isActive).length || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Inactive Users</p>
              <p className="text-2xl font-bold text-red-600">
                {data.users?.filter(u => !u.isActive).length || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.users?.filter(u => u.role === 'admin' || u.role === 'super_admin').length || 0}
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
                    Role
                  </label>
                  <select
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
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
                      placeholder="Search by name or email..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.users?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(user.role)}`}>
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setStatusDialog({ 
                          isOpen: true, 
                          id: user.id, 
                          currentStatus: user.isActive 
                        })}
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(user.isActive)}`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserForm(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, id: user.id })}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {(!data?.users || data.users.length === 0) && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search ? 'Try adjusting your search' : 'Get started by adding a new user.'}
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

        {/* User Form Modal */}
        {showUserForm && (
          <UserForm
            user={selectedUser}
            onClose={() => {
              setShowUserForm(false);
              setSelectedUser(null);
            }}
            onSuccess={() => {
              refetch();
              setShowUserForm(false);
              setSelectedUser(null);
            }}
          />
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <UserDetailsModal
            user={selectedUser}
            onClose={() => {
              setShowUserDetails(false);
              setSelectedUser(null);
            }}
            onEdit={() => {
              setShowUserDetails(false);
              setShowUserForm(true);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, id: null })}
          onConfirm={handleDelete}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />

        {/* Status Toggle Dialog */}
        <ConfirmDialog
          isOpen={statusDialog.isOpen}
          onClose={() => setStatusDialog({ isOpen: false, id: null, currentStatus: false })}
          onConfirm={handleToggleStatus}
          title={`${statusDialog.currentStatus ? 'Deactivate' : 'Activate'} User`}
          message={`Are you sure you want to ${statusDialog.currentStatus ? 'deactivate' : 'activate'} this user?`}
          confirmText={statusDialog.currentStatus ? 'Deactivate' : 'Activate'}
          type={statusDialog.currentStatus ? 'warning' : 'success'}
        />
      </div>
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}
              </h3>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium capitalize">{user.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Church ID</p>
              <p className="font-medium">{user.churchId || 'N/A'}</p>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;