// pages/Accountant/JournalEntries.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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
  
  // Refs for debouncing
  const searchTimeout = useRef(null);
  const fetchInProgress = useRef(false);

  // Debounced filter change handler
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Individual filter handlers with debouncing
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

  // Fetch entries with retry logic for rate limiting
  const fetchEntries = useCallback(async (showLoadingIndicator = true, retryCount = 0) => {
    // Prevent multiple simultaneous fetch requests
    if (fetchInProgress.current) {
      console.log('🔄 Fetch already in progress, skipping...');
      return;
    }

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
      
      console.log('📤 Fetching with params:', params);
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
      
      // Reset retry count on success
      retryCount = 0;
      
    } catch (error) {
      console.error('❌ Error fetching journal entries:', error);
      
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429) {
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`⏳ Rate limited. Retrying in ${delay/1000}s... (Attempt ${retryCount + 1}/${maxRetries})`);
          toast.error(`Rate limited. Retrying in ${delay/1000}s...`);
          
          // Clear the in-progress flag before retry
          fetchInProgress.current = false;
          
          setTimeout(() => {
            fetchEntries(showLoadingIndicator, retryCount + 1);
          }, delay);
          return; // Exit early to keep loading state
        } else {
          toast.error('Too many requests. Please try again later.');
        }
      } else {
        toast.error('Failed to load journal entries');
      }
    } finally {
      fetchInProgress.current = false;
      if (showLoadingIndicator) setLoading(false);
    }
  }, [filters, pagination.page, pagination.perPage]);

  // Debounced effect for filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [filters.startDate, filters.endDate, filters.status, filters.search, pagination.page, refreshTrigger, fetchEntries]);

  const handlePost = async (id) => {
    if (!window.confirm('Posting this entry will update account balances and cannot be undone. Continue?')) {
      return;
    }
    
    try {
      await accountantService.postJournalEntry(id);
      toast.success('Journal entry posted to ledger successfully');
      fetchEntries(false);
    } catch (error) {
      console.error('Error posting journal entry:', error);
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
      console.error('Error voiding journal entry:', error);
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
      console.error('Error deleting journal entry:', error);
      toast.error(error.response?.data?.error || 'Failed to delete journal entry');
    }
  };

  const handleViewApprovalHistory = async (entryId) => {
    try {
      const history = await approvalService.getApprovalHistory('journal_entry', entryId);
      setApprovalHistory(history.history || []);
      setShowApprovalHistory(true);
    } catch (error) {
      console.error('Error fetching approval history:', error);
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
      console.error('Error resubmitting entry:', error);
      toast.error(error.response?.data?.error || 'Failed to resubmit entry');
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'RETURNED': 'bg-orange-100 text-orange-800',
      'POSTED': 'bg-purple-100 text-purple-800',
      'VOID': 'bg-gray-100 text-gray-800'
    };
    
    const icons = {
      'DRAFT': <ClockIcon className="h-3 w-3 mr-1" />,
      'PENDING': <ClockIcon className="h-3 w-3 mr-1" />,
      'APPROVED': <CheckCircleIcon className="h-3 w-3 mr-1" />,
      'REJECTED': <XCircleIcon className="h-3 w-3 mr-1" />,
      'RETURNED': <ArrowPathIcon className="h-3 w-3 mr-1" />,
      'POSTED': <CheckCircleIcon className="h-3 w-3 mr-1" />,
      'VOID': <XCircleIcon className="h-3 w-3 mr-1" />
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}
        <span className="ml-1">{status}</span>
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage journal entries with double-entry accounting
          </p>
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            <span>Workflow: Accountant → Treasurer Approval → Post to Ledger</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
            title="Refresh"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setSelectedEntry(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="date"
            defaultValue={filters.startDate}
            onChange={handleStartDateChange}
            className="px-3 py-2 border rounded-md"
            placeholder="Start Date"
          />
          <input
            type="date"
            defaultValue={filters.endDate}
            onChange={handleEndDateChange}
            className="px-3 py-2 border rounded-md"
            placeholder="End Date"
          />
          <select
            value={filters.status}
            onChange={handleStatusChange}
            className="px-3 py-2 border rounded-md"
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
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              defaultValue={filters.search}
              onChange={handleSearchChange}
              placeholder="Search entries..."
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No journal entries found</p>
                    <p className="text-sm">Create your first journal entry to get started.</p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.entry_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {accountantService.formatDate(entry.entry_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {accountantService.formatCurrency(entry.total_debit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {accountantService.formatCurrency(entry.total_credit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewApprovalHistory(entry.id)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
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
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
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
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleResubmit(entry.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Resubmit"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {entry.status === 'APPROVED' && (
                          <button
                            onClick={() => handlePost(entry.id)}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
                          >
                            Post
                          </button>
                        )}
                        
                        {entry.status === 'POSTED' && (
                          <button
                            onClick={() => handleVoid(entry.id)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
      {showApprovalHistory && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Approval History</h2>
              <button onClick={() => setShowApprovalHistory(false)}>
                <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {approvalHistory.length > 0 ? (
                approvalHistory.map((item, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.action === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        item.action === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.action}
                      </span>
                      <span className="text-xs text-gray-500">
                        {accountantService.formatDate(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{item.comments || 'No comments'}</p>
                    <p className="text-xs text-gray-500 mt-1">By: {item.user || 'Unknown'}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No approval history found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;