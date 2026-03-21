import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  UserIcon,
  DocumentTextIcon,
  HashtagIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PrinterIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { incomeService } from '../../services/income';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const IncomeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    fetchIncome();
  }, [id]);

  const fetchIncome = async () => {
    try {
      setLoading(true);
      const data = await incomeService.getIncomeById(id);
      setIncome(data);
    } catch (error) {
      console.error('Error fetching income:', error);
      toast.error('Failed to load income details');
      navigate('/income');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await incomeService.deleteIncome(id);
      toast.success('Income deleted successfully');
      navigate('/income');
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error('Failed to delete income');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReceipt = () => {
    // Implement email receipt functionality
    toast.success('Receipt sent to member email');
  };

  const getStatusBadge = (status) => {
    const colors = {
      posted: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      void: 'bg-gray-100 text-gray-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'posted':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'void':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 print:px-0">
        {/* Header - Hidden when printing */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate('/income')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Income
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print
            </button>
            {income.memberEmail && (
              <button
                onClick={handleEmailReceipt}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Email Receipt
              </button>
            )}
            <Link
              to={`/income/edit/${id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit
            </Link>
            <button
              onClick={() => setDeleteDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] px-6 py-5 print:bg-gray-100 print:text-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg print:bg-gray-200">
                  <CurrencyDollarIcon className="h-6 w-6 text-white print:text-gray-700" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white print:text-gray-900">Income Receipt</h2>
                  <p className="text-sm text-green-100 mt-0.5 print:text-gray-600">
                    Transaction #{income.transactionNumber || income.id}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-2 print:bg-gray-200 print:px-3 print:py-1 print:rounded-full`}>
                {getStatusIcon(income.status)}
                <span className={`px-3 py-1 text-sm rounded-full print:bg-transparent print:text-gray-700 ${getStatusBadge(income.status)}`}>
                  {income.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            {/* Amount Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
              <p className="text-sm text-green-600 mb-1">Amount</p>
              <p className="text-4xl font-bold text-green-700">
                {formatCurrency(income.amount)}
              </p>
              <p className="text-xs text-green-500 mt-2">
                Received on {formatDate(income.date, 'long')}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Transaction Date</p>
                    <p className="font-medium">{formatDate(income.date, 'long')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <TagIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{income.category?.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CreditCardIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">{income.paymentMethod?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Member</p>
                    <p className="font-medium">{income.memberName || 'Anonymous'}</p>
                    {income.memberEmail && (
                      <p className="text-xs text-gray-500 mt-1">{income.memberEmail}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <HashtagIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-medium">{income.reference || 'N/A'}</p>
                  </div>
                </div>

                {income.transactionNumber && (
                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Transaction #</p>
                      <p className="font-medium font-mono">{income.transactionNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {income.description && (
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-start space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{income.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {income.notes && (
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-start space-x-3">
                  <PencilSquareIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium bg-gray-50 p-3 rounded-lg">{income.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Info */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Audit Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">Created by:</span>{' '}
                  <span className="font-medium">{income.submittedBy || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created at:</span>{' '}
                  <span className="font-medium">
                    {income.createdAt ? formatDateTime(income.createdAt) : 'N/A'}
                  </span>
                </div>
                {income.approvedBy && (
                  <>
                    <div>
                      <span className="text-gray-500">Approved by:</span>{' '}
                      <span className="font-medium">{income.approvedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Approved at:</span>{' '}
                      <span className="font-medium">
                        {income.approvedDate ? formatDateTime(income.approvedDate) : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog}
          onClose={() => setDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Income"
          message="Are you sure you want to delete this income transaction? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </div>
    </div>
  );
};

// Need to import TagIcon at the top
import { TagIcon } from '@heroicons/react/24/outline';

export default IncomeDetails;