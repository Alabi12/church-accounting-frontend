import React, { useState, useEffect } from 'react';
import { 
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AuditReview() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/audit/transactions?status=${filter}`);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setMockTransactions();
    } finally {
      setLoading(false);
    }
  };

  const setMockTransactions = () => {
    setTransactions([
      { 
        id: 1, 
        date: '2024-03-15', 
        description: 'Large cash withdrawal', 
        category: 'Cash',
        amount: 15000, 
        status: 'flagged',
        submittedBy: 'John Doe',
        riskLevel: 'high',
        reason: 'Amount exceeds normal pattern'
      },
      { 
        id: 2, 
        date: '2024-03-14', 
        description: 'Unusual vendor payment', 
        category: 'Expense',
        amount: 8500, 
        status: 'pending',
        submittedBy: 'Jane Smith',
        riskLevel: 'medium',
        reason: 'New vendor without approval'
      },
      { 
        id: 3, 
        date: '2024-03-13', 
        description: 'Missing receipt', 
        category: 'Expense',
        amount: 350, 
        status: 'pending',
        submittedBy: 'Bob Johnson',
        riskLevel: 'low',
        reason: 'Receipt not attached'
      },
    ]);
  };

  const handleFlag = async (id) => {
    const reason = window.prompt('Please provide a reason for flagging:');
    if (!reason) return;

    try {
      await api.post(`/audit/transactions/${id}/flag`, { reason, notes });
      toast.success('Transaction flagged for review');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to flag transaction');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/audit/transactions/${id}/approve`, { notes });
      toast.success('Transaction approved');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to approve transaction');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await api.post(`/audit/transactions/${id}/reject`, { reason, notes });
      toast.success('Transaction rejected');
      fetchTransactions();
    } catch (error) {
      toast.error('Failed to reject transaction');
    }
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Audit Review</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="pending">Pending Review</option>
          <option value="flagged">Flagged</option>
          <option value="approved">Approved</option>
          <option value="all">All Transactions</option>
        </select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Risk</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(tx.date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-medium">{tx.description}</div>
                  <div className="text-xs text-gray-500">by {tx.submittedBy}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tx.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(tx.riskLevel)}`}>
                    {tx.riskLevel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTransaction(tx);
                      setShowDetails(true);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                    title="View details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(tx.id)}
                    className="text-green-600 hover:text-green-700"
                    title="Approve"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleFlag(tx.id)}
                    className="text-yellow-600 hover:text-yellow-700"
                    title="Flag for review"
                  >
                    <FlagIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleReject(tx.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Reject"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Date</dt>
                <dd className="text-sm font-medium">{formatDate(selectedTransaction.date)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Amount</dt>
                <dd className="text-sm font-medium">{formatCurrency(selectedTransaction.amount)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="text-sm">{selectedTransaction.description}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Category</dt>
                <dd className="text-sm">{selectedTransaction.category}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Submitted By</dt>
                <dd className="text-sm">{selectedTransaction.submittedBy}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Risk Level</dt>
                <dd className="text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(selectedTransaction.riskLevel)}`}>
                    {selectedTransaction.riskLevel}
                  </span>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-500">Flag Reason</dt>
                <dd className="text-sm mt-1 p-3 bg-gray-50 rounded">
                  {selectedTransaction.reason || 'No reason provided'}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}