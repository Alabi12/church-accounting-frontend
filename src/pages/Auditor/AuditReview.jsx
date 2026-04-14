// pages/Auditor/AuditReview.jsx
import React, { useState, useEffect } from 'react';
import { 
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AuditReview() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    flagged: 0,
    approved: 0,
    rejected: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      
      const params = { status: filter };
      if (riskFilter !== 'all') params.riskLevel = riskFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/audit/transactions', { params });
      const data = response.data.transactions || response.data || [];
      
      setTransactions(data);
      
      // Calculate stats
      const total = data.length;
      const pending = data.filter(t => t.status === 'pending').length;
      const flagged = data.filter(t => t.status === 'flagged').length;
      const approved = data.filter(t => t.status === 'approved').length;
      const rejected = data.filter(t => t.status === 'rejected').length;
      const highRisk = data.filter(t => t.riskLevel === 'high').length;
      const mediumRisk = data.filter(t => t.riskLevel === 'medium').length;
      const lowRisk = data.filter(t => t.riskLevel === 'low').length;
      
      setStats({ total, pending, flagged, approved, rejected, highRisk, mediumRisk, lowRisk });
      
      if (showToast) toast.success('Transactions refreshed');
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setMockTransactions();
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setMockTransactions = () => {
    const mockData = [
      { 
        id: 1, 
        date: '2026-04-13', 
        description: 'Large cash withdrawal', 
        category: 'Cash',
        amount: 15000, 
        status: 'flagged',
        submittedBy: 'John Doe',
        riskLevel: 'high',
        reason: 'Amount exceeds normal pattern',
        reference: 'CASH-2026-001'
      },
      { 
        id: 2, 
        date: '2026-04-12', 
        description: 'Unusual vendor payment', 
        category: 'Expense',
        amount: 8500, 
        status: 'pending',
        submittedBy: 'Jane Smith',
        riskLevel: 'medium',
        reason: 'New vendor without approval',
        reference: 'EXP-2026-045'
      },
      { 
        id: 3, 
        date: '2026-04-11', 
        description: 'Missing receipt', 
        category: 'Expense',
        amount: 350, 
        status: 'pending',
        submittedBy: 'Bob Johnson',
        riskLevel: 'low',
        reason: 'Receipt not attached',
        reference: 'EXP-2026-046'
      },
      { 
        id: 4, 
        date: '2026-04-10', 
        description: 'Payroll run - April 2026', 
        category: 'Payroll',
        amount: 16350, 
        status: 'approved',
        submittedBy: 'Accountant',
        riskLevel: 'low',
        reason: 'Regular payroll',
        reference: 'PAYROLL-2026-04'
      },
      { 
        id: 5, 
        date: '2026-04-09', 
        description: 'Duplicate payment to vendor', 
        category: 'Expense',
        amount: 2500, 
        status: 'flagged',
        submittedBy: 'Sarah Williams',
        riskLevel: 'high',
        reason: 'Duplicate invoice detected',
        reference: 'EXP-2026-044'
      },
    ];
    setTransactions(mockData);
    
    // Calculate stats for mock data
    const total = mockData.length;
    const pending = mockData.filter(t => t.status === 'pending').length;
    const flagged = mockData.filter(t => t.status === 'flagged').length;
    const approved = mockData.filter(t => t.status === 'approved').length;
    const rejected = mockData.filter(t => t.status === 'rejected').length;
    const highRisk = mockData.filter(t => t.riskLevel === 'high').length;
    const mediumRisk = mockData.filter(t => t.riskLevel === 'medium').length;
    const lowRisk = mockData.filter(t => t.riskLevel === 'low').length;
    
    setStats({ total, pending, flagged, approved, rejected, highRisk, mediumRisk, lowRisk });
  };

  const handleFlag = async (id) => {
    const reason = window.prompt('Please provide a reason for flagging:');
    if (!reason) return;

    try {
      await api.post(`/audit/transactions/${id}/flag`, { reason, notes });
      toast.success('Transaction flagged for review');
      fetchTransactions(true);
    } catch (error) {
      console.error('Error flagging transaction:', error);
      // Update UI optimistically
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'flagged', reason, flagNotes: notes } : t
      ));
      toast.success('Transaction flagged (local)');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/audit/transactions/${id}/approve`, { notes });
      toast.success('Transaction approved');
      fetchTransactions(true);
    } catch (error) {
      console.error('Error approving transaction:', error);
      // Update UI optimistically
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'approved', approvalNotes: notes } : t
      ));
      toast.success('Transaction approved (local)');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await api.post(`/audit/transactions/${id}/reject`, { reason, notes });
      toast.success('Transaction rejected');
      fetchTransactions(true);
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      // Update UI optimistically
      setTransactions(prev => prev.map(t => 
        t.id === id ? { ...t, status: 'rejected', rejectionReason: reason, rejectionNotes: notes } : t
      ));
      toast.success('Transaction rejected (local)');
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

  const getRiskIcon = (risk) => {
    switch(risk) {
      case 'high': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'medium': return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'low': return <InformationCircleIcon className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (riskFilter !== 'all' && t.riskLevel !== riskFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return t.description?.toLowerCase().includes(searchLower) ||
             t.category?.toLowerCase().includes(searchLower) ||
             t.submittedBy?.toLowerCase().includes(searchLower) ||
             t.reference?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Review</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and analyze flagged transactions for compliance
            </p>
          </div>
          <button
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Flagged</p>
            <p className="text-xl font-bold text-red-600">{stats.flagged}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Approved</p>
            <p className="text-xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500">High Risk</p>
            <p className="text-xl font-bold text-red-600">{stats.highRisk}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Medium Risk</p>
            <p className="text-xl font-bold text-yellow-600">{stats.mediumRisk}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500">Low Risk</p>
            <p className="text-xl font-bold text-green-600">{stats.lowRisk}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value="pending">Pending Review</option>
                <option value="flagged">Flagged</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Transactions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value="all">All Risks</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by description, category, or person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
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
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      <DocumentMagnifyingGlassIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{tx.description}</div>
                        <div className="text-xs text-gray-500">
                          Ref: {tx.reference || tx.id} | by {tx.submittedBy}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <span className={tx.amount > 10000 ? 'text-red-600' : 'text-gray-900'}>
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getRiskIcon(tx.riskLevel)}
                          <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(tx.riskLevel)}`}>
                            {tx.riskLevel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTransaction(tx);
                              setShowDetails(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {tx.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(tx.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                          {tx.status !== 'flagged' && (
                            <button
                              onClick={() => handleFlag(tx.id)}
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Flag for review"
                            >
                              <FlagIcon className="h-4 w-4" />
                            </button>
                          )}
                          {tx.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(tx.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Transaction Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Transaction ID</dt>
                    <dd className="text-sm font-medium text-gray-900">{selectedTransaction.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Reference</dt>
                    <dd className="text-sm font-medium text-gray-900">{selectedTransaction.reference || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Date</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatDate(selectedTransaction.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Amount</dt>
                    <dd className={`text-sm font-bold ${selectedTransaction.amount > 10000 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(selectedTransaction.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Description</dt>
                    <dd className="text-sm text-gray-900">{selectedTransaction.description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Category</dt>
                    <dd className="text-sm text-gray-900">{selectedTransaction.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Submitted By</dt>
                    <dd className="text-sm text-gray-900">{selectedTransaction.submittedBy}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Risk Level</dt>
                    <dd>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getRiskColor(selectedTransaction.riskLevel)}`}>
                        {getRiskIcon(selectedTransaction.riskLevel)}
                        {selectedTransaction.riskLevel}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                    </dd>
                  </div>
                </div>
                
                {(selectedTransaction.reason || selectedTransaction.flagReason) && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <dt className="text-sm font-medium text-yellow-800 mb-1">Flag Reason</dt>
                    <dd className="text-sm text-yellow-700">{selectedTransaction.reason || selectedTransaction.flagReason}</dd>
                  </div>
                )}
                
                {selectedTransaction.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-700 mb-1">Audit Notes</dt>
                    <dd className="text-sm text-gray-600">{selectedTransaction.notes}</dd>
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedTransaction.status !== 'approved' && (
                  <button
                    onClick={() => {
                      handleApprove(selectedTransaction.id);
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}