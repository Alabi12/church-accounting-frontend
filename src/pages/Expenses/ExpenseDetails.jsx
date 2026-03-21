// components/expenses/ExpenseDetailsModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  XCircleIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

const ExpenseDetailsModal = ({ expense, onClose, onRefresh }) => {
  const getStatusIcon = (status) => {
    switch(status) {
      case 'PENDING': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'APPROVED': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'REJECTED': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'POSTED': return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'POSTED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const AccountIcon = expense.account_type === 'bank' ? BuildingOfficeIcon : BanknotesIcon;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`mb-4 p-3 rounded-lg flex items-center ${getStatusColor(expense.status)}`}>
          {getStatusIcon(expense.status)}
          <span className="ml-2 font-medium">Status: {expense.status}</span>
        </div>

        {/* Main Details */}
        <div className="space-y-4">
          {/* Amount */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Amount</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(expense.amount, 'GHS')}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Description</span>
            </div>
            <p className="text-gray-900 ml-7">{expense.description}</p>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-1">
                <TagIcon className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-xs font-medium text-gray-500">Category</span>
              </div>
              <p className="text-sm text-gray-900 ml-5">{expense.category}</p>
            </div>
            <div>
              <div className="flex items-center mb-1">
                <CalendarIcon className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-xs font-medium text-gray-500">Date</span>
              </div>
              <p className="text-sm text-gray-900 ml-5">{formatDate(expense.date)}</p>
            </div>
          </div>

          {/* Account Information */}
          <div className="border-t border-gray-200 pt-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Account Information</h3>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center">
                <AccountIcon className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{expense.account_name}</p>
                  <p className="text-xs text-gray-500">
                    {expense.account_type === 'bank' ? 'Bank Account' : 'Petty Cash'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-gray-500">Payment Method</span>
              <p className="text-sm text-gray-900 capitalize mt-1">
                {expense.payment_method?.replace('_', ' ')}
              </p>
            </div>
            {expense.reference && (
              <div>
                <span className="text-xs font-medium text-gray-500">Reference</span>
                <p className="text-sm text-gray-900 mt-1">{expense.reference}</p>
              </div>
            )}
          </div>

          {/* Submitted By */}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-xs font-medium text-gray-500">Submitted by</span>
            </div>
            <p className="text-sm text-gray-900 ml-5 mt-1">
              {expense.submitted_by_name || 'Unknown'} on {formatDateTime(expense.created_at)}
            </p>
          </div>

          {/* Approval/Rejection Info */}
          {expense.status === 'APPROVED' && expense.approved_by_name && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center text-green-700 mb-1">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Approved</span>
              </div>
              <p className="text-xs text-green-600 ml-5">
                by {expense.approved_by_name} on {formatDateTime(expense.approved_date)}
              </p>
            </div>
          )}

          {expense.status === 'REJECTED' && expense.rejection_reason && (
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center text-red-700 mb-1">
                <XCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Rejected</span>
              </div>
              <p className="text-xs text-red-600 ml-5">
                Reason: {expense.rejection_reason}
              </p>
              {expense.rejected_by_name && (
                <p className="text-xs text-red-600 ml-5 mt-1">
                  by {expense.rejected_by_name} on {formatDateTime(expense.rejected_date)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ExpenseDetailsModal;