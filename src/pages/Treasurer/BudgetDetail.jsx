// src/pages/Treasurer/BudgetDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilIcon,
  PaperAirplaneIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBudget();
  }, [id]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const data = await treasurerService.getBudget(id);
      setBudget(data);
    } catch (error) {
      console.error('Error fetching budget:', error);
      toast.error('Failed to load budget');
      navigate('/treasurer/budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!window.confirm('Submit this budget for approval?')) return;
    
    setSubmitting(true);
    try {
      await treasurerService.submitBudgetForApproval(id);
      toast.success('Budget submitted for approval');
      fetchBudget(); // Refresh data
    } catch (error) {
      toast.error('Failed to submit budget');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'DRAFT': return <ClockIcon className="h-5 w-5 text-gray-500" />;
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Budget Not Found</h3>
            <button
              onClick={() => navigate('/treasurer/budgets')}
              className="mt-4 px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg"
            >
              Back to Budgets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/treasurer/budgets')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Budgets
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Budget Details</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(budget.status)}`}>
              {budget.status}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            {/* Title and Status */}
            <div className="flex items-center space-x-3 mb-6">
              {getStatusIcon(budget.status)}
              <h2 className="text-xl font-semibold text-gray-900">{budget.name}</h2>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium">{budget.department}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Fiscal Year</p>
                    <p className="text-sm font-medium">{budget.fiscalYear}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Created By</p>
                    <p className="text-sm font-medium">{budget.submittedBy || 'You'}</p>
                    <p className="text-xs text-gray-400">{formatDate(budget.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Budget Amount</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(budget.amount)}</p>
                  </div>
                </div>
                
                {budget.startDate && (
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500">Period</p>
                      <p className="text-sm font-medium">
                        {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <p className="text-sm font-medium">{budget.priority}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {budget.description && (
              <div className="mb-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Description</p>
                <p className="text-sm text-gray-700">{budget.description}</p>
              </div>
            )}

            {/* Justification */}
            {budget.justification && (
              <div className="mb-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Justification</p>
                <p className="text-sm text-gray-700">{budget.justification}</p>
              </div>
            )}

            {/* Approval/Rejection Info */}
            {budget.approvedBy && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
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
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <div className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Rejected by {budget.rejectedBy}</p>
                    <p className="text-xs text-red-600 mb-2">{formatDate(budget.rejectedDate)}</p>
                    <p className="text-sm text-red-700 bg-white p-2 rounded">{budget.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {budget.status === 'DRAFT' && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => navigate(`/treasurer/budgets/edit/${budget.id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleSubmitForApproval}
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg text-sm font-medium hover:bg-[rgb(27,158,76)] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BudgetDetail;