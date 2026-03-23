// pages/Accountant/JournalEntries.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import { approvalService } from '../../services/approval';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import JournalEntryForm from './JournalEntryForm';

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showApprovalHistory, setShowApprovalHistory] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    pages: 0
  });
  
  const searchTimeout = useRef(null);
  const fetchInProgress = useRef(false);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleFilterChange({ ...filters, startDate: value });
    }, 500);
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleFilterChange({ ...filters, endDate: value });
    }, 500);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    handleFilterChange({ ...filters, status: value });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleFilterChange({ ...filters, search: value });
    }, 500);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', status: '', search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const fetchEntries = useCallback(async (showLoadingIndicator = true, retryCount = 0) => {
    if (fetchInProgress.current) return;

    const maxRetries = 3;
    
    try {
      fetchInProgress.current = true;
      if (showLoadingIndicator) setLoading(true);
      
      const params = {
        page: pagination.page,
        perPage: pagination.perPage,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.status && { status: filters.status.toUpperCase() }),
        ...(filters.search && { search: filters.search })
      };
      
      const response = await accountantService.getJournalEntries(params);
      
      const processedEntries = (response.entries || []).map(entry => ({
        ...entry,
        entry_number: entry.entry_number || entry.journalNumber || '-',
        entry_date: entry.entry_date || entry.date || null,
        status: (entry.status || 'DRAFT').toUpperCase(),
        total_debit: entry.total_debit || entry.lines?.reduce((sum, l) => sum + (l.debit || 0), 0) || 0,
        total_credit: entry.total_credit || entry.lines?.reduce((sum, l) => sum + (l.credit || 0), 0) || 0,
        created_by_name: entry.created_by_name || entry.createdBy || 'System'
      }));
      
      setEntries(processedEntries);
      setPagination({
        page: response.current_page || 1,
        perPage: response.per_page || 20,
        total: response.total || 0,
        pages: response.pages || 0
      });
      
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      if (error.response?.status === 429 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        fetchInProgress.current = false;
        setTimeout(() => fetchEntries(showLoadingIndicator, retryCount + 1), delay);
        return;
      }
      toast.error('Failed to load journal entries');
    } finally {
      fetchInProgress.current = false;
      if (showLoadingIndicator) setLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEntries(), 300);
    return () => {
      clearTimeout(timer);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [filters.startDate, filters.endDate, filters.status, filters.search, pagination.page, refreshTrigger, fetchEntries]);

  const handlePost = async (id) => {
    if (!window.confirm('Posting this entry will update account balances and cannot be undone. Continue?')) return;
    try {
      await accountantService.postJournalEntry(id);
      toast.success('Journal entry posted to ledger successfully');
      fetchEntries(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to post journal entry');
    }
  };

  const handleVoid = async (id) => {
    const reason = window.prompt('Please enter a reason for voiding this entry:');
    if (!reason) return;
    try {
      await accountantService.voidJournalEntry(id, reason);
      toast.success('Journal entry voided successfully');
      fetchEntries(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to void journal entry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this draft entry?')) return;
    try {
      await accountantService.deleteJournalEntry(id);
      toast.success('Journal entry deleted successfully');
      fetchEntries(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete journal entry');
    }
  };

  const handleViewApprovalHistory = async (entryId) => {
    try {
      const history = await approvalService.getApprovalHistory('journal_entry', entryId);
      setApprovalHistory(history.history || []);
      setShowApprovalHistory(true);
    } catch (error) {
      toast.error('Failed to load approval history');
    }
  };

  const handleResubmit = async (entryId) => {
    if (!window.confirm('Are you sure you want to resubmit this entry for approval?')) return;
    try {
      await approvalService.submitForApproval('journal_entry', entryId, 'Resubmitted after corrections');
      toast.success('Entry resubmitted for treasurer approval');
      fetchEntries(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resubmit entry');
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-700', icon: <ClockIcon className="h-3 w-3" /> },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <ClockIcon className="h-3 w-3" /> },
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircleIcon className="h-3 w-3" /> },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircleIcon className="h-3 w-3" /> },
      'RETURNED': { bg: 'bg-orange-100', text: 'text-orange-800', icon: <ArrowPathIcon className="h-3 w-3" /> },
      'POSTED': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <CheckCircleIcon className="h-3 w-3" /> },
      'VOID': { bg: 'bg-gray-100', text: 'text-gray-700', icon: <XCircleIcon className="h-3 w-3" /> }
    };
    const s = styles[status] || styles.DRAFT;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.icon}
        {status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Journal Entries</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage journal entries with double-entry accounting
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <UserGroupIcon className="h-4 w-4" />
              <span>Workflow: Accountant → Treasurer Approval → Post to Ledger</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setSelectedEntry(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-xl hover:bg-[rgb(25,142,69)] transition-colors shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              New Entry
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {(filters.startDate || filters.endDate || filters.status || filters.search) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      defaultValue={filters.startDate}
                      onChange={handleStartDateChange}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      placeholder="Start Date"
                    />
                  </div>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      defaultValue={filters.endDate}
                      onChange={handleEndDateChange}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                      placeholder="End Date"
                    />
                  </div>
                  <select
                    value={filters.status}
                    onChange={handleStatusChange}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="RETURNED">Returned</option>
                    <option value="POSTED">Posted</option>
                    <option value="VOID">Void</option>
                  </select>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      defaultValue={filters.search}
                      onChange={handleSearchChange}
                      placeholder="Search entries..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Total Entries</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Posted</p>
            <p className="text-2xl font-bold text-purple-600">
              {entries.filter(e => e.status === 'POSTED').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {entries.filter(e => e.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Draft</p>
            <p className="text-2xl font-bold text-gray-600">
              {entries.filter(e => e.status === 'DRAFT').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry #</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No journal entries found</p>
                      <p className="text-sm text-gray-400 mt-1">Create your first journal entry to get started.</p>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                        {entry.entry_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(entry.entry_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {formatCurrency(entry.total_debit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                        {formatCurrency(entry.total_credit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(entry.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleViewApprovalHistory(entry.id)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Approval History"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {entry.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedEntry(entry);
                                  setShowForm(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {entry.status === 'RETURNED' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedEntry(entry);
                                  setShowForm(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleResubmit(entry.id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Resubmit"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {entry.status === 'APPROVED' && (
                            <button
                              onClick={() => handlePost(entry.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Post
                            </button>
                          )}
                          
                          {entry.status === 'POSTED' && (
                            <button
                              onClick={() => handleVoid(entry.id)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Void"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.perPage + 1} - {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination({ ...pagination, page: pageNum })}
                        className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-[rgb(31,178,86)] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Journal Entry Form Modal */}
        {showForm && (
          <JournalEntryForm
            entry={selectedEntry}
            onClose={() => {
              setShowForm(false);
              setSelectedEntry(null);
            }}
            onSuccess={() => {
              setShowForm(false);
              setSelectedEntry(null);
              setRefreshTrigger(prev => prev + 1);
            }}
          />
        )}

        {/* Approval History Modal */}
        <AnimatePresence>
          {showApprovalHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50 p-4"
              onClick={() => setShowApprovalHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Approval History</h2>
                  <button
                    onClick={() => setShowApprovalHistory(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    {approvalHistory.length > 0 ? (
                      approvalHistory.map((item, index) => (
                        <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.action === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              item.action === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.action}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.comments || 'No comments'}</p>
                          <p className="text-xs text-gray-400 mt-1">By: {item.user || 'Unknown'}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No approval history found</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JournalEntries;