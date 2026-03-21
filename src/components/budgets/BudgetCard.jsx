// components/budgets/BudgetCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { budgetService } from '../../services/budgets';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetCard = ({ budget, onUpdate }) => {
  const navigate = useNavigate();
  const { isPastor, isTreasurer, isSuperAdmin } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  // Safely access budget properties with fallbacks
  const budgetId = budget?.id;
  const budgetName = budget?.name || 'Unnamed Budget';
  const budgetDepartment = budget?.department || 'General';
  const budgetAmount = budget?.amount || 0;
  const budgetStatus = budget?.status || 'DRAFT';
  const budgetFiscalYear = budget?.fiscal_year || budget?.fiscalYear || new Date().getFullYear();
  const budgetDescription = budget?.description;
  const budgetApprovedAt = budget?.approved_at || budget?.approvedAt;

  // Determine permissions
  const canEdit = (isTreasurer || isSuperAdmin) && budgetStatus === 'DRAFT';
  const canSubmit = (isTreasurer || isSuperAdmin) && budgetStatus === 'DRAFT';
  const canApprove = (isPastor || isSuperAdmin) && budgetStatus === 'PENDING';

  const getStatusIcon = (status) => {
    switch(status?.toUpperCase()) {
      case 'DRAFT': return <ClockIcon className="h-4 w-4 text-gray-500" />;
      case 'PENDING': return <PaperAirplaneIcon className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'REJECTED': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this budget?')) return;
    
    setActionLoading(true);
    try {
      await budgetService.approveBudget(budgetId);
      toast.success('Budget approved successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Error approving budget:', error);
      toast.error(error.message || 'Failed to approve budget');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit this budget for pastor approval?')) return;
    
    setActionLoading(true);
    try {
      await budgetService.submitForApproval(budgetId);
      toast.success('Budget submitted for approval');
      onUpdate?.();
    } catch (error) {
      console.error('Error submitting budget:', error);
      toast.error(error.message || 'Failed to submit budget');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/treasurer/budgets/edit/${budgetId}`);
  };

  const handleView = () => {
    // Make sure this path matches your route configuration
    navigate(`/budgets/${budgetId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
    >
      {/* Header with status */}
      <div className={`px-4 py-3 border-b ${getStatusColor(budgetStatus)}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {getStatusIcon(budgetStatus)}
            <span className="text-sm font-medium capitalize">{budgetStatus.toLowerCase()}</span>
          </div>
          <span className="text-xs text-gray-500">#{budgetId}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{budgetName}</h3>
        <p className="text-sm text-gray-600 mb-2">{budgetDepartment}</p>
        
        <div className="flex items-center text-sm text-gray-700 mb-3">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-1" />
          <span className="font-medium">{formatCurrency(budgetAmount, 'GHS')}</span>
        </div>

        {budgetDescription && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{budgetDescription}</p>
        )}

        {/* Fiscal year */}
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>FY {budgetFiscalYear}</span>
        </div>

        {/* Approval info - shown when approved */}
        {budgetStatus === 'APPROVED' && budgetApprovedAt && (
          <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs">
            <div className="flex items-center text-green-700">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              <span className="font-medium">Approved</span>
            </div>
            <p className="text-green-600 mt-1">
              {formatDate(budgetApprovedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-end gap-2">
        {/* View button - always visible */}
        <button
          onClick={handleView}
          disabled={actionLoading}
          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center"
          title="View Details"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </button>

        {/* Edit button - only for treasurer with DRAFT status */}
        {canEdit && (
          <button
            onClick={handleEdit}
            disabled={actionLoading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            title="Edit Budget"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
        )}

        {/* Submit button - only for treasurer with DRAFT status */}
        {canSubmit && (
          <button
            onClick={handleSubmit}
            disabled={actionLoading}
            className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center"
            title="Submit for Approval"
          >
            {actionLoading ? (
              <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <PaperAirplaneIcon className="h-4 w-4 mr-1" />
            )}
            Submit
          </button>
        )}

        {/* Approve button - only for pastor with PENDING status */}
        {canApprove && (
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            title="Approve Budget"
          >
            {actionLoading ? (
              <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <CheckCircleIcon className="h-4 w-4 mr-1" />
            )}
            Approve
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default BudgetCard;