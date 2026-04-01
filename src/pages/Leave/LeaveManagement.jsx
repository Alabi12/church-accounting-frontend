// src/pages/Leave/LeaveManagement.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarIcon,
  ArrowPathIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { leaveService } from '../../services/leaveService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function LeaveManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending_pastor');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showProcessAllowanceDialog, setShowProcessAllowanceDialog] = useState(false);
  const [showTreasurerApproveDialog, setShowTreasurerApproveDialog] = useState(false);
  const [showPostToLedgerDialog, setShowPostToLedgerDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [allowanceAmount, setAllowanceAmount] = useState(0);

  // Get current user role from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role;

  // Fetch workflow summary
  const { 
    data: summaryData, 
    isLoading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['leaveWorkflowSummary'],
    queryFn: () => leaveService.getWorkflowSummary(),
    refetchInterval: 30000,
  });

  // Fetch leave requests based on active tab
  const { 
    data: requestsData, 
    isLoading: requestsLoading, 
    error: requestsError,
    refetch: refetchRequests 
  } = useQuery({
    queryKey: ['leaveRequests', activeTab],
    queryFn: () => leaveService.getLeaveRequests({ stage: activeTab }),
    refetchInterval: 30000,
  });

  // Pastor approve mutation
  const pastorApproveMutation = useMutation({
    mutationFn: ({ id, comments }) => leaveService.pastorApproveLeave(id, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequests']);
      queryClient.invalidateQueries(['leaveWorkflowSummary']);
      toast.success('Leave request approved by Pastor');
      setShowApproveDialog(false);
      setComments('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve');
    },
  });

  // Accountant process allowance mutation
  const processAllowanceMutation = useMutation({
    mutationFn: ({ id, comments, allowanceAmount }) => 
      leaveService.processLeaveAllowance(id, { comments, allowance_amount: allowanceAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequests']);
      queryClient.invalidateQueries(['leaveWorkflowSummary']);
      toast.success('Leave allowance processed and sent to Treasurer');
      setShowProcessAllowanceDialog(false);
      setComments('');
      setAllowanceAmount(0);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process allowance');
    },
  });

  // Treasurer approve allowance mutation
  const treasurerApproveMutation = useMutation({
    mutationFn: ({ id, comments }) => leaveService.treasurerApproveAllowance(id, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequests']);
      queryClient.invalidateQueries(['leaveWorkflowSummary']);
      toast.success('Leave allowance approved by Treasurer');
      setShowTreasurerApproveDialog(false);
      setComments('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve');
    },
  });

  // Accountant post to ledger mutation
  const postToLedgerMutation = useMutation({
    mutationFn: ({ id, comments }) => leaveService.postLeavePaymentToLedger(id, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequests']);
      queryClient.invalidateQueries(['leaveWorkflowSummary']);
      toast.success('Leave payment posted to ledger');
      setShowPostToLedgerDialog(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to post to ledger');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => leaveService.rejectLeaveRequest(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequests']);
      queryClient.invalidateQueries(['leaveWorkflowSummary']);
      toast.success('Leave request rejected');
      setShowRejectDialog(false);
      setComments('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reject');
    },
  });

  const tabs = [
    { id: 'pending_pastor', name: 'Pending Pastor', icon: ClockIcon, color: 'yellow', role: ['pastor', 'admin', 'super_admin'] },
    { id: 'pending_allowance', name: 'Pending Allowance', icon: CurrencyDollarIcon, color: 'blue', role: ['accountant', 'admin', 'super_admin'] },
    { id: 'pending_treasurer', name: 'Pending Treasurer', icon: BanknotesIcon, color: 'purple', role: ['treasurer', 'admin', 'super_admin'] },
    { id: 'pending_payment', name: 'Pending Payment', icon: DocumentArrowDownIcon, color: 'green', role: ['accountant', 'admin', 'super_admin'] },
    { id: 'completed', name: 'Completed', icon: CheckCircleIcon, color: 'gray', role: ['admin', 'super_admin', 'pastor', 'accountant', 'treasurer'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.role.includes(userRole));

  const getStageActions = (request) => {
    switch (activeTab) {
      case 'pending_pastor':
        if (userRole === 'pastor' || userRole === 'admin' || userRole === 'super_admin') {
          return (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  setShowApproveDialog(true);
                }}
                className="text-green-600 hover:text-green-900"
                title="Approve"
              >
                <CheckCircleIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  setShowRejectDialog(true);
                }}
                className="text-red-600 hover:text-red-900"
                title="Reject"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate(`/leave/requests/${request.id}`)}
                className="text-blue-600 hover:text-blue-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>
          );
        }
        break;

      case 'pending_allowance':
        if (userRole === 'accountant' || userRole === 'admin' || userRole === 'super_admin') {
          return (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  setAllowanceAmount(request.allowance_amount || 0);
                  setShowProcessAllowanceDialog(true);
                }}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                Process Allowance
              </button>
              <button
                onClick={() => navigate(`/leave/requests/${request.id}`)}
                className="text-blue-600 hover:text-blue-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>
          );
        }
        break;

      case 'pending_treasurer':
        if (userRole === 'treasurer' || userRole === 'admin' || userRole === 'super_admin') {
          return (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  setShowTreasurerApproveDialog(true);
                }}
                className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Approve Allowance
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  setShowRejectDialog(true);
                }}
                className="text-red-600 hover:text-red-900"
                title="Reject"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate(`/leave/requests/${request.id}`)}
                className="text-blue-600 hover:text-blue-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>
          );
        }
        break;

      case 'pending_payment':
        if (userRole === 'accountant' || userRole === 'admin' || userRole === 'super_admin') {
          return (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  setShowPostToLedgerDialog(true);
                }}
                className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Post to Ledger
              </button>
              <button
                onClick={() => navigate(`/leave/requests/${request.id}`)}
                className="text-blue-600 hover:text-blue-900"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>
          );
        }
        break;

      default:
        return (
          <button
            onClick={() => navigate(`/leave/requests/${request.id}`)}
            className="text-blue-600 hover:text-blue-900"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
        );
    }
    return null;
  };

  const summary = summaryData || {
    pending_pastor: 0,
    pending_allowance: 0,
    pending_treasurer: 0,
    pending_payment: 0,
    completed: 0,
    total_requests: 0
  };

  const requests = requestsData?.requests || [];

  if (summaryLoading || requestsLoading) return <LoadingSpinner fullScreen />;
  if (summaryError || requestsError) return <ErrorAlert message="Failed to load leave management data" />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage leave requests through the complete approval workflow
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button
              onClick={() => {
                refetchSummary();
                refetchRequests();
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              title="Refresh Data"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => navigate('/leave/calendar')}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Calendar View
            </button>
            <button
              onClick={() => navigate('/leave/balances')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Leave Balances
            </button>
            <button
              onClick={() => navigate('/leave/requests/new')}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Leave Request
            </button>
          </div>
        </div>

        {/* Workflow Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Pastor</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pending_pastor}</p>
              </div>
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            {summary.pending_pastor > 0 && (
              <p className="text-xs text-gray-500 mt-2">{summary.pending_pastor} request(s) awaiting pastor approval</p>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Allowance</p>
                <p className="text-2xl font-bold text-blue-600">{summary.pending_allowance}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            {summary.pending_allowance > 0 && (
              <p className="text-xs text-gray-500 mt-2">{summary.pending_allowance} request(s) need allowance calculation</p>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Treasurer</p>
                <p className="text-2xl font-bold text-purple-600">{summary.pending_treasurer}</p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BanknotesIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            {summary.pending_treasurer > 0 && (
              <p className="text-xs text-gray-500 mt-2">{summary.pending_treasurer} request(s) awaiting treasurer approval</p>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payment</p>
                <p className="text-2xl font-bold text-green-600">{summary.pending_payment}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <DocumentArrowDownIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            {summary.pending_payment > 0 && (
              <p className="text-xs text-gray-500 mt-2">{summary.pending_payment} request(s) ready for payment posting</p>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-600">{summary.completed}</p>
              </div>
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            {summary.completed > 0 && (
              <p className="text-xs text-gray-500 mt-2">{summary.completed} request(s) fully processed</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {filteredTabs.map((tab) => {
              const Icon = tab.icon;
              const tabCount = summary[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.id ? `text-${tab.color}-500` : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  {tab.name}
                  {tabCount > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                      activeTab === tab.id ? `bg-${tab.color}-100 text-${tab.color}-600` : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tabCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Requests Table - Enhanced with Allowance Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{request.employee?.name || request.employee_name}</div>
                      <div className="text-sm text-gray-500">{request.employee?.position || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        request.leave_type === 'annual' ? 'bg-blue-100 text-blue-800' :
                        request.leave_type === 'sick' ? 'bg-red-100 text-red-800' :
                        request.leave_type === 'maternity' ? 'bg-purple-100 text-purple-800' :
                        request.leave_type === 'paternity' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.leave_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(request.start_date), 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        to {format(new Date(request.end_date), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium">{request.days_requested}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeTab === 'pending_treasurer' && request.allowance_amount > 0 ? (
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">
                            GH₵ {request.allowance_amount?.toLocaleString() || '0'}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            <CalculatorIcon className="h-3 w-3 inline mr-1" />
                            Processed by Accountant
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-green-600 block text-right">
                          GH₵ {request.allowance_amount?.toLocaleString() || '0'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.allowance_processed_at ? (
                        <div>
                          <span className="text-xs text-blue-600">Accountant</span>
                          <div className="text-xs">
                            {format(new Date(request.allowance_processed_at), 'dd MMM yyyy')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(request.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStageActions(request)}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <ClockIcon className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No leave requests in this stage</p>
                        <p className="text-sm">Check other tabs or create a new leave request</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pastor Approve Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => {
          setShowApproveDialog(false);
          setComments('');
        }}
        onConfirm={() => pastorApproveMutation.mutate({ 
          id: selectedRequest?.id, 
          comments 
        })}
        title="Approve Leave Request"
        message={
          <div>
            <p className="mb-3">Approve leave request for {selectedRequest?.employee?.name || selectedRequest?.employee_name}?</p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Optional comments..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              rows="2"
            />
          </div>
        }
        confirmText="Approve"
        cancelText="Cancel"
        type="success"
      />

      {/* Process Allowance Dialog - Accountant */}
      <ConfirmDialog
        isOpen={showProcessAllowanceDialog}
        onClose={() => {
          setShowProcessAllowanceDialog(false);
          setComments('');
          setAllowanceAmount(0);
        }}
        onConfirm={() => processAllowanceMutation.mutate({ 
          id: selectedRequest?.id, 
          comments,
          allowanceAmount 
        })}
        title="Process Leave Allowance"
        message={
          <div className="space-y-3">
            <p>Process leave allowance for <strong>{selectedRequest?.employee?.name || selectedRequest?.employee_name}</strong></p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600 mb-2">Leave Details:</p>
              <p className="text-xs">Type: {selectedRequest?.leave_type}</p>
              <p className="text-xs">Days: {selectedRequest?.days_requested}</p>
              <p className="text-xs">Period: {selectedRequest?.start_date && format(new Date(selectedRequest.start_date), 'dd MMM yyyy')} - {selectedRequest?.end_date && format(new Date(selectedRequest.end_date), 'dd MMM yyyy')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Allowance Amount (GHS) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={allowanceAmount}
                onChange={(e) => setAllowanceAmount(parseFloat(e.target.value))}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter the leave allowance amount to be paid to the employee</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Comments</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                rows="2"
                placeholder="Optional comments about allowance calculation..."
              />
            </div>
          </div>
        }
        confirmText="Process Allowance"
        cancelText="Cancel"
        type="info"
      />

      {/* Treasurer Approve Dialog - Shows Allowance Amount */}
      <ConfirmDialog
        isOpen={showTreasurerApproveDialog}
        onClose={() => {
          setShowTreasurerApproveDialog(false);
          setComments('');
        }}
        onConfirm={() => treasurerApproveMutation.mutate({ 
          id: selectedRequest?.id, 
          comments 
        })}
        title="Approve Leave Allowance"
        message={
          <div>
            <p className="mb-3">Review and approve leave allowance for <strong>{selectedRequest?.employee?.name || selectedRequest?.employee_name}</strong></p>
            
            {/* Allowance Summary Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Leave Allowance Amount:</span>
                <span className="text-2xl font-bold text-green-700">
                  GH₵ {selectedRequest?.allowance_amount?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                <div>
                  <span className="font-medium">Leave Type:</span> {selectedRequest?.leave_type}
                </div>
                <div>
                  <span className="font-medium">Days:</span> {selectedRequest?.days_requested}
                </div>
                <div>
                  <span className="font-medium">Processed By:</span> Accountant
                </div>
                <div>
                  <span className="font-medium">Processed On:</span> {selectedRequest?.allowance_processed_at && format(new Date(selectedRequest.allowance_processed_at), 'dd MMM yyyy')}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">Do you approve this allowance amount for payment?</p>
            
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Optional approval comments..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              rows="2"
            />
          </div>
        }
        confirmText="Approve Allowance"
        cancelText="Reject"
        type="success"
      />

      {/* Post to Ledger Dialog */}
      <ConfirmDialog
        isOpen={showPostToLedgerDialog}
        onClose={() => {
          setShowPostToLedgerDialog(false);
          setComments('');
        }}
        onConfirm={() => postToLedgerMutation.mutate({ 
          id: selectedRequest?.id, 
          comments 
        })}
        title="Post to Ledger"
        message={
          <div>
            <p className="mb-3">Post leave payment of <strong className="text-green-600">GH₵ {selectedRequest?.allowance_amount?.toLocaleString()}</strong> for <strong>{selectedRequest?.employee?.name || selectedRequest?.employee_name}</strong> to the general ledger?</p>
            <div className="bg-gray-50 p-3 rounded mb-3">
              <p className="text-sm font-medium mb-2">Journal Entry:</p>
              <p className="text-xs">Debit: Leave Allowance Expense (Expense Account)</p>
              <p className="text-xs">Credit: Bank Account (Asset Account)</p>
            </div>
            <p className="text-sm text-gray-500 mb-3">This will create a journal entry and mark the leave as paid.</p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Reference / Comments..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              rows="2"
            />
          </div>
        }
        confirmText="Post to Ledger"
        cancelText="Cancel"
        type="info"
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setComments('');
        }}
        onConfirm={() => rejectMutation.mutate({ 
          id: selectedRequest?.id, 
          reason: comments 
        })}
        title="Reject Leave Request"
        message={
          <div>
            <p className="mb-3">Reject leave request for {selectedRequest?.employee?.name || selectedRequest?.employee_name}?</p>
            {activeTab === 'pending_treasurer' && selectedRequest?.allowance_amount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-medium text-yellow-800">Allowance Amount: GH₵ {selectedRequest.allowance_amount.toLocaleString()}</p>
                <p className="text-xs text-yellow-700">Rejecting will cancel the allowance and return the request to Accountant.</p>
              </div>
            )}
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500"
              rows="3"
              required
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

export default LeaveManagement;