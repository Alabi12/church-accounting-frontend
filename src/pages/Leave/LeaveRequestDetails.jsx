// src/pages/Leave/LeaveRequestDetails.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  CalculatorIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { leaveService } from '../../services/leaveService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function LeaveRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showProcessAllowanceDialog, setShowProcessAllowanceDialog] = useState(false);
  const [showTreasurerApproveDialog, setShowTreasurerApproveDialog] = useState(false);
  const [showPostToLedgerDialog, setShowPostToLedgerDialog] = useState(false);
  const [comments, setComments] = useState('');
  const [allowanceAmount, setAllowanceAmount] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role;

  const { data: request, isLoading, error, refetch } = useQuery({
    queryKey: ['leaveRequest', id],
    queryFn: () => leaveService.getLeaveRequest(id),
  });

  const pastorApproveMutation = useMutation({
    mutationFn: ({ id, comments }) => leaveService.pastorApproveLeave(id, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequest', id]);
      toast.success('Leave request approved by Pastor');
      setShowApproveDialog(false);
      setComments('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve');
    },
  });

  const processAllowanceMutation = useMutation({
    mutationFn: ({ id, comments, allowanceAmount }) => 
      leaveService.processLeaveAllowance(id, { comments, allowance_amount: allowanceAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequest', id]);
      toast.success('Leave allowance processed and sent to Treasurer');
      setShowProcessAllowanceDialog(false);
      setComments('');
      setAllowanceAmount(0);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to process allowance');
    },
  });

  const treasurerApproveMutation = useMutation({
    mutationFn: ({ id, comments }) => leaveService.treasurerApproveAllowance(id, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequest', id]);
      toast.success('Leave allowance approved by Treasurer');
      setShowTreasurerApproveDialog(false);
      setComments('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve');
    },
  });

  const postToLedgerMutation = useMutation({
    mutationFn: ({ id, comments }) => leaveService.postLeavePaymentToLedger(id, { comments }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequest', id]);
      toast.success('Leave payment posted to ledger');
      setShowPostToLedgerDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to post to ledger');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => leaveService.rejectLeaveRequest(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leaveRequest', id]);
      toast.success('Leave request rejected');
      setShowRejectDialog(false);
      setComments('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reject');
    },
  });

  const getStatusBadge = () => {
    if (!request) return null;
    
    const statusConfig = {
      PENDING_PASTOR: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Pending Pastor Approval' },
      APPROVED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, text: 'Approved by Pastor' },
      ALLOWANCE_PROCESSED: { color: 'bg-purple-100 text-purple-800', icon: CurrencyDollarIcon, text: 'Allowance Processed - Pending Treasurer' },
      ALLOWANCE_APPROVED: { color: 'bg-green-100 text-green-800', icon: BanknotesIcon, text: 'Allowance Approved - Ready for Payment' },
      PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Paid & Posted to Ledger' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Rejected' },
    };
    
    const config = statusConfig[request.status] || statusConfig.PENDING_PASTOR;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.text}
      </span>
    );
  };

  const getWorkflowStepStatus = (step) => {
    if (!request) return 'pending';
    
    switch (step) {
      case 'admin':
        return request.admin_id ? 'completed' : 'pending';
      case 'pastor':
        if (request.status === 'REJECTED' && request.rejection_stage === 'pastor') return 'rejected';
        if (request.pastor_id) return 'completed';
        if (request.status === 'PENDING_PASTOR') return 'current';
        return 'pending';
      case 'accountant':
        if (request.status === 'REJECTED' && request.rejection_stage === 'accountant') return 'rejected';
        if (request.allowance_processed) return 'completed';
        if (request.status === 'APPROVED' && !request.allowance_processed) return 'current';
        return 'pending';
      case 'treasurer':
        if (request.status === 'REJECTED' && request.rejection_stage === 'treasurer') return 'rejected';
        if (request.allowance_approved) return 'completed';
        if (request.allowance_processed && !request.allowance_approved) return 'current';
        return 'pending';
      case 'posting':
        if (request.posted_to_ledger) return 'completed';
        if (request.allowance_approved && !request.posted_to_ledger) return 'current';
        return 'pending';
      default:
        return 'pending';
    }
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'current':
        return <ClockIcon className="h-6 w-6 text-blue-500 animate-pulse" />;
      case 'rejected':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-300" />;
    }
  };

  const canApprove = () => {
    if (!request) return false;
    if (request.status === 'PENDING_PASTOR' && (userRole === 'pastor' || userRole === 'admin' || userRole === 'super_admin')) {
      return true;
    }
    return false;
  };

  const canProcessAllowance = () => {
    if (!request) return false;
    if (request.status === 'APPROVED' && !request.allowance_processed && (userRole === 'accountant' || userRole === 'admin' || userRole === 'super_admin')) {
      return true;
    }
    return false;
  };

  const canApproveAllowance = () => {
    if (!request) return false;
    if (request.allowance_processed && !request.allowance_approved && (userRole === 'treasurer' || userRole === 'admin' || userRole === 'super_admin')) {
      return true;
    }
    return false;
  };

  const canPostToLedger = () => {
    if (!request) return false;
    if (request.allowance_approved && !request.posted_to_ledger && (userRole === 'accountant' || userRole === 'admin' || userRole === 'super_admin')) {
      return true;
    }
    return false;
  };

  const canReject = () => {
    if (!request) return false;
    if (request.status === 'PENDING_PASTOR' && (userRole === 'pastor' || userRole === 'admin' || userRole === 'super_admin')) {
      return true;
    }
    if (request.allowance_processed && !request.allowance_approved && (userRole === 'treasurer' || userRole === 'admin' || userRole === 'super_admin')) {
      return true;
    }
    return false;
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorAlert message="Failed to load leave request details" />;
  if (!request) return <ErrorAlert message="Leave request not found" />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/leave/management')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Leave Management
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>

        <div className="mb-6">
          {getStatusBadge()}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-900">Leave Request Details</h1>
            <p className="text-sm text-gray-500 mt-1">Request ID: {request.id}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">Employee Information</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Name:</span> {request.employee?.name || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">Position:</span> {request.employee?.position || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">Department:</span> {request.employee?.department || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">Leave Details</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Leave Type:</span>{' '}
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                      request.leave_type === 'annual' ? 'bg-blue-100 text-blue-800' :
                      request.leave_type === 'sick' ? 'bg-red-100 text-red-800' :
                      request.leave_type === 'maternity' ? 'bg-purple-100 text-purple-800' :
                      request.leave_type === 'paternity' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.leave_type}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Period:</span> {format(new Date(request.start_date), 'dd MMM yyyy')} - {format(new Date(request.end_date), 'dd MMM yyyy')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Days Requested:</span> {request.days_requested} days
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">Reason for Leave</h3>
              </div>
              <p className="text-sm text-gray-600">{request.reason || 'No reason provided'}</p>
            </div>

            {/* Enhanced Allowance Section - Always visible if allowance exists */}
            {request.allowance_amount > 0 && (
              <div className={`rounded-lg p-5 border-2 ${
                request.allowance_approved 
                  ? 'bg-green-50 border-green-300' 
                  : request.allowance_processed 
                    ? 'bg-purple-50 border-purple-300' 
                    : 'bg-yellow-50 border-yellow-300'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className={`h-6 w-6 mr-2 ${
                      request.allowance_approved ? 'text-green-600' : 
                      request.allowance_processed ? 'text-purple-600' : 
                      'text-yellow-600'
                    }`} />
                    <h3 className={`text-lg font-semibold ${
                      request.allowance_approved ? 'text-green-800' : 
                      request.allowance_processed ? 'text-purple-800' : 
                      'text-yellow-800'
                    }`}>
                      Leave Allowance Details
                    </h3>
                  </div>
                  {request.allowance_approved && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Approved
                    </span>
                  )}
                  {request.allowance_processed && !request.allowance_approved && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Pending Treasurer Approval
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Allowance Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      GH₵ {request.allowance_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Processed By</p>
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 text-blue-500 mr-1" />
                      <p className="text-sm font-medium">Accountant</p>
                    </div>
                    {request.allowance_processed_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(request.allowance_processed_at), 'dd MMM yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Calculation</p>
                    <p className="text-sm">
                      {request.days_requested} days × Daily Rate
                    </p>
                    {request.accountant_comments && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{request.accountant_comments}"</p>
                    )}
                  </div>
                </div>
                
                {request.allowance_approved && request.allowance_approved_at && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">
                        <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                        Approved by Treasurer
                      </span>
                      <span className="text-green-600">
                        {format(new Date(request.allowance_approved_at), 'dd MMM yyyy HH:mm')}
                      </span>
                    </div>
                    {request.treasurer_comments && (
                      <p className="text-xs text-green-600 mt-1 italic">"{request.treasurer_comments}"</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Show message when allowance hasn't been processed yet */}
            {!request.allowance_processed && request.status === 'APPROVED' && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <CalculatorIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-700">
                    Allowance not yet processed. Accountant needs to calculate and enter the allowance amount.
                  </p>
                </div>
              </div>
            )}

            {request.posted_to_ledger && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center mb-3">
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-medium text-blue-800">Payment Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-600">Journal Entry ID</p>
                    <p className="text-sm font-medium text-blue-700">#{request.journal_entry_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Posted Date</p>
                    <p className="text-sm font-medium text-blue-700">
                      {request.posted_at ? format(new Date(request.posted_at), 'dd MMM yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Timeline</h3>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 bg-white rounded-full z-10">
                    {getStepIcon(getWorkflowStepStatus('admin'))}
                  </div>
                  <div className="ml-10">
                    <p className="text-sm font-medium text-gray-900">Admin/HR Entry</p>
                    <p className="text-xs text-gray-500">
                      {request.admin_at ? format(new Date(request.admin_at), 'dd MMM yyyy HH:mm') : 'Pending'}
                    </p>
                    {request.admin_comments && (
                      <p className="text-xs text-gray-600 mt-1">Comments: {request.admin_comments}</p>
                    )}
                  </div>
                </div>

                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 bg-white rounded-full z-10">
                    {getStepIcon(getWorkflowStepStatus('pastor'))}
                  </div>
                  <div className="ml-10">
                    <p className="text-sm font-medium text-gray-900">Pastor Approval</p>
                    <p className="text-xs text-gray-500">
                      {request.pastor_at ? format(new Date(request.pastor_at), 'dd MMM yyyy HH:mm') : 'Pending'}
                    </p>
                    {request.pastor_comments && (
                      <p className="text-xs text-gray-600 mt-1">Comments: {request.pastor_comments}</p>
                    )}
                    {request.rejection_stage === 'pastor' && (
                      <p className="text-xs text-red-600 mt-1">Rejected: {request.rejection_reason}</p>
                    )}
                  </div>
                </div>

                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 bg-white rounded-full z-10">
                    {getStepIcon(getWorkflowStepStatus('accountant'))}
                  </div>
                  <div className="ml-10">
                    <p className="text-sm font-medium text-gray-900">Process Allowance</p>
                    <p className="text-xs text-gray-500">
                      {request.allowance_processed_at ? format(new Date(request.allowance_processed_at), 'dd MMM yyyy HH:mm') : 'Pending'}
                    </p>
                    {request.accountant_comments && (
                      <p className="text-xs text-gray-600 mt-1">Comments: {request.accountant_comments}</p>
                    )}
                    {request.allowance_amount > 0 && (
                      <p className="text-xs text-green-600 mt-1">Amount: GH₵ {request.allowance_amount.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="relative flex items-start mb-8">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 bg-white rounded-full z-10">
                    {getStepIcon(getWorkflowStepStatus('treasurer'))}
                  </div>
                  <div className="ml-10">
                    <p className="text-sm font-medium text-gray-900">Treasurer Approval</p>
                    <p className="text-xs text-gray-500">
                      {request.allowance_approved_at ? format(new Date(request.allowance_approved_at), 'dd MMM yyyy HH:mm') : 'Pending'}
                    </p>
                    {request.treasurer_comments && (
                      <p className="text-xs text-gray-600 mt-1">Comments: {request.treasurer_comments}</p>
                    )}
                    {request.rejection_stage === 'treasurer' && (
                      <p className="text-xs text-red-600 mt-1">Rejected: {request.rejection_reason}</p>
                    )}
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="absolute left-0 flex items-center justify-center w-6 h-6 bg-white rounded-full z-10">
                    {getStepIcon(getWorkflowStepStatus('posting'))}
                  </div>
                  <div className="ml-10">
                    <p className="text-sm font-medium text-gray-900">Post to Ledger</p>
                    <p className="text-xs text-gray-500">
                      {request.posted_at ? format(new Date(request.posted_at), 'dd MMM yyyy HH:mm') : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {canApprove() && (
                <button
                  onClick={() => setShowApproveDialog(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Approve Leave Request
                </button>
              )}

              {canProcessAllowance() && (
                <button
                  onClick={() => {
                    setAllowanceAmount(request.allowance_amount || 0);
                    setShowProcessAllowanceDialog(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CalculatorIcon className="h-5 w-5 mr-2" />
                  Process Allowance
                </button>
              )}

              {canApproveAllowance() && (
                <button
                  onClick={() => setShowTreasurerApproveDialog(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Approve Allowance
                </button>
              )}

              {canPostToLedger() && (
                <button
                  onClick={() => setShowPostToLedgerDialog(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Post to Ledger
                </button>
              )}

              {canReject() && (
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Reject Request
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pastor Approve Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => { setShowApproveDialog(false); setComments(''); }}
        onConfirm={() => pastorApproveMutation.mutate({ id: request.id, comments })}
        title="Approve Leave Request"
        message={
          <div>
            <p className="mb-3">Approve leave request for {request.employee?.name}?</p>
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

      {/* Process Allowance Dialog - Enhanced for Accountant */}
      <ConfirmDialog
        isOpen={showProcessAllowanceDialog}
        onClose={() => { setShowProcessAllowanceDialog(false); setComments(''); setAllowanceAmount(0); }}
        onConfirm={() => processAllowanceMutation.mutate({ id: request.id, comments, allowanceAmount })}
        title="Process Leave Allowance"
        message={
          <div className="space-y-4">
            <p className="text-gray-700">Calculate and enter leave allowance for <strong>{request.employee?.name}</strong></p>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Leave Information:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Leave Type:</span> {request.leave_type}</div>
                <div><span className="text-gray-500">Days:</span> {request.days_requested}</div>
                <div><span className="text-gray-500">Period:</span> {format(new Date(request.start_date), 'dd MMM')} - {format(new Date(request.end_date), 'dd MMM yyyy')}</div>
                <div><span className="text-gray-500">Daily Rate:</span> ~GH₵ {(request.employee?.basic_salary / 30)?.toFixed(2) || 'N/A'}</div>
              </div>
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
                placeholder="Enter amount"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Suggested: GH₵ {(request.days_requested * (request.employee?.basic_salary / 30))?.toFixed(2) || '0.00'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Calculation Notes</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                rows="2"
                placeholder="E.g., Calculated based on daily rate of GH₵ X for Y days"
              />
            </div>
          </div>
        }
        confirmText="Process Allowance"
        cancelText="Cancel"
        type="info"
      />

      {/* Treasurer Approve Dialog - Shows Allowance Amount Clearly */}
      <ConfirmDialog
        isOpen={showTreasurerApproveDialog}
        onClose={() => { setShowTreasurerApproveDialog(false); setComments(''); }}
        onConfirm={() => treasurerApproveMutation.mutate({ id: request.id, comments })}
        title="Approve Leave Allowance"
        message={
          <div>
            <p className="mb-3">Review and approve leave allowance for <strong>{request.employee?.name}</strong></p>
            
            {/* Allowance Summary Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="text-center mb-3">
                <p className="text-sm text-green-700">Allowance Amount</p>
                <p className="text-3xl font-bold text-green-700">
                  GH₵ {request.allowance_amount?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm border-t border-green-200 pt-3">
                <div>
                  <span className="text-gray-600">Leave Type:</span><br />
                  <span className="font-medium">{request.leave_type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Days:</span><br />
                  <span className="font-medium">{request.days_requested} days</span>
                </div>
                <div>
                  <span className="text-gray-600">Processed By:</span><br />
                  <span className="font-medium">Accountant</span>
                </div>
                <div>
                  <span className="text-gray-600">Processed On:</span><br />
                  <span className="font-medium">{request.allowance_processed_at ? format(new Date(request.allowance_processed_at), 'dd MMM yyyy') : 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {request.accountant_comments && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-500 mb-1">Accountant's Notes:</p>
                <p className="text-sm italic">"{request.accountant_comments}"</p>
              </div>
            )}
            
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Approval comments (optional)..."
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
        onClose={() => { setShowPostToLedgerDialog(false); setComments(''); }}
        onConfirm={() => postToLedgerMutation.mutate({ id: request.id, comments })}
        title="Post to Ledger"
        message={
          <div>
            <p className="mb-3">Post leave payment of <strong className="text-green-600">GH₵ {request.allowance_amount?.toLocaleString()}</strong> for <strong>{request.employee?.name}</strong> to the general ledger?</p>
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
        onClose={() => { setShowRejectDialog(false); setComments(''); }}
        onConfirm={() => rejectMutation.mutate({ id: request.id, reason: comments })}
        title="Reject Leave Request"
        message={
          <div>
            <p className="mb-3">Reject leave request for {request.employee?.name}?</p>
            {request.allowance_amount > 0 && !request.allowance_approved && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm font-medium text-yellow-800">Allowance Amount: GH₵ {request.allowance_amount.toLocaleString()}</p>
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

export default LeaveRequestDetails;