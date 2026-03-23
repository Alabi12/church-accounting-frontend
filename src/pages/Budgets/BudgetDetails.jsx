// pages/Budgets/BudgetDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { treasurerService } from '../../services/treasurer';
import { pastorService } from '../../services/pastor';
import { budgetService } from '../../services/budgets';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Determine which service to use based on user role
  const isPastor = user?.role === 'pastor' || user?.role === 'super_admin';
  const isTreasurer = user?.role === 'treasurer' || user?.role === 'admin' || user?.role === 'super_admin';
  
  // Use the appropriate service
  const service = isPastor ? pastorService : treasurerService;

  useEffect(() => {
    fetchBudgetData();
  }, [id]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      
      // Fetch budget details
      let budgetData;
      if (isPastor) {
        budgetData = await pastorService.getBudgetDetails(id);
      } else {
        budgetData = await treasurerService.getBudget(id);
      }
      setBudget(budgetData);
      
      // Fetch comments - this endpoint may not exist yet
      try {
        const commentsData = await budgetService.getBudgetComments(id);
        setComments(commentsData.comments || []);
      } catch (commentError) {
        console.warn('Comments feature not available yet:', commentError);
        // Don't show error toast for comments
      }
      
    } catch (error) {
      console.error('Error fetching budget:', error);
      toast.error('Failed to load budget details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!isPastor) {
      toast.error('Only pastors can approve budgets');
      return;
    }
    
    setApproving(true);
    try {
      await pastorService.approveBudget(id);
      toast.success('Budget approved successfully!');
      fetchBudgetData(); // Refresh data
    } catch (error) {
      console.error('Error approving budget:', error);
      toast.error('Failed to approve budget');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!isPastor) {
      toast.error('Only pastors can reject budgets');
      return;
    }
    
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setApproving(true);
    try {
      await pastorService.rejectBudget(id, rejectReason);
      toast.success('Budget rejected');
      setShowRejectModal(false);
      setRejectReason('');
      fetchBudgetData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting budget:', error);
      toast.error('Failed to reject budget');
    } finally {
      setApproving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!isTreasurer) {
      toast.error('Only treasurers can submit budgets');
      return;
    }
    
    setApproving(true);
    try {
      await treasurerService.submitBudgetForApproval(id);
      toast.success('Budget submitted for approval!');
      fetchBudgetData(); // Refresh data
    } catch (error) {
      console.error('Error submitting budget:', error);
      toast.error('Failed to submit budget');
    } finally {
      setApproving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await budgetService.addBudgetComment(id, newComment);
      toast.success('Comment added');
      setNewComment('');
      fetchBudgetData(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!budget) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Budget not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const canApprove = isPastor && budget.status === 'PENDING';
  const canSubmit = isTreasurer && budget.status === 'DRAFT';
  const canEdit = isTreasurer && budget.status === 'DRAFT';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{budget.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(budget.status)}`}>
                  {budget.status}
                </span>
                <span className="text-sm text-gray-500">
                  Department: {budget.department}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {canApprove && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {approving ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={approving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {canSubmit && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={approving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {approving ? 'Submitting...' : 'Submit for Approval'}
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => navigate(`/treasurer/budgets/edit/${budget.id}`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Budget Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(budget.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fiscal Year</p>
              <p className="font-medium">{budget.fiscal_year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              <p className="font-medium">{budget.priority}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget Type</p>
              <p className="font-medium">{budget.budget_type}</p>
            </div>
            {budget.start_date && (
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{formatDate(budget.start_date)}</p>
              </div>
            )}
            {budget.end_date && (
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{formatDate(budget.end_date)}</p>
              </div>
            )}
            {budget.submitted_by_name && (
              <div>
                <p className="text-sm text-gray-500">Submitted By</p>
                <p className="font-medium">{budget.submitted_by_name}</p>
              </div>
            )}
            {budget.submitted_at && (
              <div>
                <p className="text-sm text-gray-500">Submitted At</p>
                <p className="font-medium">{formatDate(budget.submitted_at)}</p>
              </div>
            )}
            {budget.approved_by_name && (
              <div>
                <p className="text-sm text-gray-500">Approved By</p>
                <p className="font-medium">{budget.approved_by_name}</p>
              </div>
            )}
          </div>
          
          {budget.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1">{budget.description}</p>
            </div>
          )}
          
          {budget.justification && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Justification</p>
              <p className="mt-1">{budget.justification}</p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{comment.user_name || 'User'}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{comment.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No comments yet</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
              rows="2"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(27,158,76)] disabled:opacity-50 self-end"
            >
              Post
            </button>
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Reject Budget</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                rows="4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={approving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {approving ? 'Processing...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetDetails;