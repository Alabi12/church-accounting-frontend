// pages/BudgetDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { budgetService } from '../../services/budgets';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBudgetData();
    }
  }, [id]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching budget with ID:', id);
      
      // Try getBudgetById first, fallback to getBudget
      let response;
      if (typeof budgetService.getBudgetById === 'function') {
        response = await budgetService.getBudgetById(id);
      } else {
        response = await budgetService.getBudget(id);
      }
      
      console.log('📦 Budget data:', response);
      setBudget(response.budget || response);
      
      // Fetch comments if available
      if (typeof budgetService.getBudgetComments === 'function') {
        try {
          const commentsResponse = await budgetService.getBudgetComments(id);
          setComments(commentsResponse.comments || []);
        } catch (error) {
          console.warn('Could not fetch comments:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching budget:', error);
      toast.error('Failed to load budget details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      await budgetService.addBudgetComment(id, newComment);
      toast.success('Comment added');
      setNewComment('');
      // Refresh comments
      if (typeof budgetService.getBudgetComments === 'function') {
        const commentsResponse = await budgetService.getBudgetComments(id);
        setComments(commentsResponse.comments || []);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this budget?')) return;
    
    try {
      await budgetService.approveBudget(id);
      toast.success('Budget approved successfully');
      fetchBudgetData(); // Refresh data
    } catch (error) {
      console.error('Error approving budget:', error);
      toast.error('Failed to approve budget');
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await budgetService.rejectBudget(id, reason);
      toast.success('Budget rejected');
      fetchBudgetData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting budget:', error);
      toast.error('Failed to reject budget');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'DRAFT': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'APPROVED': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REJECTED': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Budget Not Found</h3>
            <p className="text-gray-500 mb-4">The budget you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/pastor/budget-approvals')}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)]"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Budgets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/pastor/budget-approvals')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Approvals
          </button>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadge(budget.status)}`}>
              {budget.status}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Budget details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Budget info card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">{budget.name}</h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <BuildingOfficeIcon className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-medium">{budget.department || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <CalendarIcon className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Fiscal Year</p>
                      <p className="text-sm font-medium">{budget.fiscalYear || budget.fiscal_year || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <CurrencyDollarIcon className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Requested Amount</p>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(budget.amount, 'GHS')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm font-medium">{formatDate(budget.submittedDate || budget.submitted_date)}</p>
                    </div>
                  </div>
                </div>

                {budget.description && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{budget.description}</p>
                  </div>
                )}

                {budget.justification && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Justification</p>
                    <p className="text-sm text-gray-700">{budget.justification}</p>
                  </div>
                )}

                {/* Approval/Rejection info */}
                {budget.approvedBy && (
                  <div className="pt-4 border-t border-gray-200 bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Approved by {budget.approvedBy}</p>
                        <p className="text-xs text-green-600">{formatDate(budget.approvedDate)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {budget.rejectedBy && (
                  <div className="pt-4 border-t border-gray-200 bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Rejected by {budget.rejectedBy}</p>
                        <p className="text-xs text-red-600 mb-2">{formatDate(budget.rejectedDate)}</p>
                        <p className="text-sm text-red-700 bg-white p-2 rounded">{budget.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Categories section */}
            {budget.categories && budget.categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Budget Categories</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {budget.categories.map((cat, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{cat.name}</span>
                        <span className="text-sm font-medium">{formatCurrency(cat.requested || cat.amount, 'GHS')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right column - Actions and Comments */}
          <div className="space-y-6">
            {/* Action buttons */}
            {budget.status === 'PENDING' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Approve Budget
                  </button>
                  <button
                    onClick={handleReject}
                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Reject Budget
                  </button>
                </div>
              </motion.div>
            )}

            {/* Comments section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
              </div>
              
              <div className="p-6">
                {/* Comment list */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {comments.length > 0 ? (
                    comments.map((comment, index) => (
                      <div key={comment.id || index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-medium text-gray-700">{comment.user || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">{formatDate(comment.date)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.text || comment.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                  )}
                </div>

                {/* Add comment form */}
                <div className="border-t border-gray-200 pt-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    rows="3"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !newComment.trim()}
                    className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)] disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDetails;