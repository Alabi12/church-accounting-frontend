// src/pages/Leave/LeaveRequests.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { leaveService } from '../../services/leaveService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function LeaveRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [approveDialog, setApproveDialog] = useState({ isOpen: false, id: null, name: '' });
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, id: null, name: '', reason: '' });

  // Fetch leave requests
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaveRequests', statusFilter],
    queryFn: () => leaveService.getLeaveRequests({ status: statusFilter !== 'all' ? statusFilter : undefined }),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id) => leaveService.approveLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequests']);
      toast.success('Leave request approved successfully');
      setApproveDialog({ isOpen: false, id: null, name: '' });
    },
    onError: (error) => {
      toast.error('Failed to approve leave request');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => leaveService.rejectLeaveRequest(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequests']);
      toast.success('Leave request rejected');
      setRejectDialog({ isOpen: false, id: null, name: '', reason: '' });
    },
    onError: (error) => {
      toast.error('Failed to reject leave request');
    },
  });

  const handleApprove = (id, name) => {
    setApproveDialog({ isOpen: true, id, name });
  };

  const confirmApprove = () => {
    if (approveDialog.id) {
      approveMutation.mutate(approveDialog.id);
    }
  };

  const handleReject = (id, name) => {
    setRejectDialog({ isOpen: true, id, name, reason: '' });
  };

  const confirmReject = () => {
    if (rejectDialog.id) {
      rejectMutation.mutate({ 
        id: rejectDialog.id, 
        reason: rejectDialog.reason 
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-100 text-blue-800';
      case 'sick':
        return 'bg-red-100 text-red-800';
      case 'bereavement':
        return 'bg-gray-100 text-gray-800';
      case 'maternity':
        return 'bg-purple-100 text-purple-800';
      case 'paternity':
        return 'bg-indigo-100 text-indigo-800';
      case 'study':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorAlert message="Failed to load leave requests" />;

  const requests = data?.data?.requests || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Leave Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage employee leave requests and approvals.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => navigate('/leave/requests/new')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Leave Request
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Requests Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Employee
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Leave Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Period
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Days
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Reason
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Submitted
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{request.employee_name}</div>
                        <div className="text-gray-500">{request.employee?.department || 'N/A'}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getLeaveTypeColor(request.leave_type)}`}>
                          {request.leave_type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>{formatDate(request.start_date)}</div>
                        <div className="text-xs">to {formatDate(request.end_date)}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center font-medium">
                        {request.days_requested}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {request.reason || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {request.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(request.id, request.employee_name)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id, request.employee_name)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/leave/requests/${request.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500">
                        No leave requests found. Click "New Leave Request" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={approveDialog.isOpen}
        onClose={() => setApproveDialog({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmApprove}
        title="Approve Leave Request"
        message={`Are you sure you want to approve the leave request for ${approveDialog.name}?`}
        confirmText="Approve"
        cancelText="Cancel"
        type="success"
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={rejectDialog.isOpen}
        onClose={() => setRejectDialog({ isOpen: false, id: null, name: '', reason: '' })}
        onConfirm={confirmReject}
        title="Reject Leave Request"
        message={
          <div>
            <p className="mb-3">Are you sure you want to reject the leave request for {rejectDialog.name}?</p>
            <textarea
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Please provide a reason for rejection..."
              className="w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm"
              rows="3"
            />
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default LeaveRequests;