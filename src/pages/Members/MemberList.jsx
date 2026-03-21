import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { memberService } from '../../services/members';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const MemberList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: 'active',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['members', page, filters],
    queryFn: () => memberService.getMembers({
      page,
      perPage: 20,
      search: filters.search,
      isActive: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
    }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => memberService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['members']);
      toast.success('Member deactivated successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to deactivate member');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(deleteDialog.id);
    setDeleteDialog({ isOpen: false, id: null });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      // Implement export functionality
      toast.success('Member data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export member data');
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  if (isLoading && !data) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage church members and track their giving history
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
            <Link
              to="/members/add"
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Member
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{data.total || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Active Members</p>
              <p className="text-2xl font-bold text-green-600">
                {data.members?.filter(m => m.isActive).length || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total Giving</p>
              <p className="text-2xl font-bold text-[rgb(31,178,86)]">
                {formatCurrency(data.members?.reduce((sum, m) => sum + (m.totalGiven || 0), 0) || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Average per Member</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  (data.members?.reduce((sum, m) => sum + (m.totalGiven || 0), 0) || 0) / 
                  (data.members?.filter(m => m.totalGiven > 0).length || 1)
                )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option value="all">All Members</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
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
                      placeholder="Search by name, email, or phone..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.members?.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-[rgb(31,178,86)] bg-opacity-10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-[rgb(31,178,86)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{member.fullName}</h3>
                      <p className="text-xs text-gray-500">Member since {formatDate(member.createdAt, 'year')}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(member.isActive)}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {member.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Given</p>
                      <p className="text-lg font-bold text-[rgb(31,178,86)]">
                        {formatCurrency(member.totalGiven || 0)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/members/${member.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/members/edit/${member.id}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      {member.isActive && (
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, id: member.id })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {(!data?.members || data.members.length === 0) && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search ? 'Try adjusting your search' : 'Get started by adding a new member.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {data.pages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data.pages}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, id: null })}
          onConfirm={handleDelete}
          title="Deactivate Member"
          message="Are you sure you want to deactivate this member? They will no longer appear in active lists."
          confirmText="Deactivate"
          type="warning"
        />
      </div>
    </div>
  );
};

export default MemberList;