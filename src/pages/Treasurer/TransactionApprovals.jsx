// pages/Treasurer/TransactionApprovals.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftIcon,
  BanknotesIcon,
  BriefcaseIcon,
  ScaleIcon,
  InformationCircleIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { approvalService } from '../../services/approval';
import { accountantService } from '../../services/accountant';
import { journalService } from '../../services/journal'; // Add this import
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

// Icons for account types
const getAccountTypeIcon = (type) => {
  switch(type) {
    case 'ASSET': return <BanknotesIcon className="h-4 w-4 text-blue-600" />;
    case 'LIABILITY': return <BriefcaseIcon className="h-4 w-4 text-orange-600" />;
    case 'EQUITY': return <ScaleIcon className="h-4 w-4 text-purple-600" />;
    case 'REVENUE': return <CurrencyDollarIcon className="h-4 w-4 text-green-600" />;
    case 'EXPENSE': return <CurrencyDollarIcon className="h-4 w-4 text-red-600" />;
    default: return <DocumentTextIcon className="h-4 w-4 text-gray-600" />;
  }
};

const TransactionApprovals = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvals, setApprovals] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [actionDialog, setActionDialog] = useState({ 
    isOpen: false, 
    requestId: null, 
    entityId: null, 
    action: null, 
    comments: '' 
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    returned: 0,
    total: 0,
    totalAmount: 0,
    pendingAmount: 0
  });

  // Status badge configuration
  const statusConfig = {
    'PENDING': {
      label: 'Pending',
      icon: ClockIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      progressColor: 'bg-yellow-500'
    },
    'APPROVED': {
      label: 'Approved',
      icon: CheckCircleIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-100 text-green-800 border-green-200',
      progressColor: 'bg-green-500'
    },
    'REJECTED': {
      label: 'Rejected',
      icon: XCircleIcon,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
      progressColor: 'bg-red-500'
    },
    'RETURNED': {
      label: 'Returned',
      icon: ChatBubbleLeftIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      progressColor: 'bg-orange-500'
    },
    'DRAFT': {
      label: 'Draft',
      icon: DocumentTextIcon,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
      progressColor: 'bg-gray-500'
    },
    'POSTED': {
      label: 'Posted',
      icon: DocumentDuplicateIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      progressColor: 'bg-purple-500'
    }
  };

  // Check if there's an approval ID in URL to auto-review
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reviewId = params.get('review');
    if (reviewId && approvals.length > 0) {
      const approval = approvals.find(a => a.entity_id === parseInt(reviewId) || a.id === reviewId);
      if (approval) {
        handleViewDetails(approval);
      }
    }
  }, [location.search, approvals]);

  useEffect(() => {
    fetchApprovals();
  }, []);

 const fetchApprovals = async () => {
  try {
    setLoading(true);
    console.log('📥 ========== FETCHING TRANSACTION APPROVALS ==========');
    
    // Track seen entity IDs to prevent duplicates
    const seenEntityIds = new Set();
    let allApprovals = [];
    
    // Source 1: Get from approval service
    console.log('🔍 Source 1: Fetching from approval service...');
    try {
      const response = await approvalService.getPendingApprovals('journal_entry');
      console.log('📦 Approval service response:', response);
      
      if (response && response.approvals) {
        const approvalsFromService = response.approvals.map(approval => ({
          ...approval,
          source: 'approval',
          uniqueKey: `approval-${approval.id}`
        }));
        
        // Add to allApprovals and track entity IDs
        approvalsFromService.forEach(approval => {
          if (approval.entity_id) {
            seenEntityIds.add(`entity-${approval.entity_id}`);
          }
          allApprovals.push(approval);
        });
        
        console.log(`✅ Found ${approvalsFromService.length} approvals from service`);
      }
    } catch (error) {
      console.error('❌ Error from approval service:', error);
    }
    
    // Source 2: Get journal entries with PENDING status directly
    console.log('🔍 Source 2: Fetching pending journal entries directly...');
    try {
      const journalResponse = await journalService.getJournalEntries({ 
        status: 'PENDING',
        perPage: 100
      });
      console.log('📦 Journal service response:', journalResponse);
      
      if (journalResponse && journalResponse.entries) {
        // Filter out journal entries that already have approval requests
        const pendingJournalEntries = journalResponse.entries
          .filter(entry => !seenEntityIds.has(`entity-${entry.id}`))
          .map(entry => ({
            id: `je-${entry.id}`,
            entity_id: entry.id,
            entity_type: 'journal_entry',
            status: entry.status || 'PENDING',
            description: entry.description,
            amount: entry.total_debit || entry.total_credit || 0,
            requester_name: entry.created_by_name || 'Unknown',
            requester: entry.created_by_name || 'Unknown',
            submitted_at: entry.created_at,
            created_at: entry.created_at,
            metadata: {
              description: entry.description,
              total_amount: entry.total_debit || entry.total_credit,
              lines: entry.lines
            },
            current_step: 1,
            total_steps: 2,
            workflow_name: 'Journal Entry Approval',
            source: 'journal',
            uniqueKey: `journal-${entry.id}`
          }));
        
        console.log(`✅ Found ${pendingJournalEntries.length} new pending journal entries`);
        allApprovals = [...allApprovals, ...pendingJournalEntries];
      }
    } catch (error) {
      console.error('❌ Error from journal service:', error);
    }
    
    console.log(`📊 Total combined approvals after dedup: ${allApprovals.length}`);
    
    if (allApprovals.length === 0) {
      console.log('⚠️ No approvals found from any source');
      setApprovals([]);
      setStats({
        pending: 0,
        approved: 0,
        rejected: 0,
        returned: 0,
        total: 0,
        totalAmount: 0,
        pendingAmount: 0
      });
      setLoading(false);
      return;
    }
    
    // Enrich approvals with metadata and properly extract amount
    const enrichedApprovals = allApprovals.map(approval => {
      const metadata = approval.metadata || {};
      
      // Try multiple ways to get the amount
      let amount = 0;
      
      // Method 1: Direct amount field
      if (approval.amount) {
        amount = parseFloat(approval.amount) || 0;
      }
      // Method 2: From metadata total_amount
      else if (metadata.total_amount) {
        amount = parseFloat(metadata.total_amount) || 0;
      }
      // Method 3: From metadata total
      else if (metadata.total) {
        amount = parseFloat(metadata.total) || 0;
      }
      // Method 4: Calculate from lines if available
      else if (metadata.lines && Array.isArray(metadata.lines)) {
        amount = metadata.lines.reduce((sum, line) => {
          return sum + (parseFloat(line.debit) || parseFloat(line.credit) || 0);
        }, 0);
      }
      // Method 5: From entry total fields
      else if (approval.total_debit) {
        amount = parseFloat(approval.total_debit) || 0;
      }
      else if (approval.total_credit) {
        amount = parseFloat(approval.total_credit) || 0;
      }
      
      // Get status config
      const status = approval.status || 'PENDING';
      const config = statusConfig[status] || statusConfig['PENDING'];
      
      return {
        ...approval,
        id: approval.id,
        entity_id: approval.entity_id || approval.entityId || approval.id,
        amount: amount,
        description: metadata.description || approval.description || approval.metadata?.description || `Journal Entry #${approval.entity_id}`,
        requester: approval.requester_name || approval.requester || approval.created_by_name || 'Unknown',
        submitted_at: approval.created_at || approval.submitted_at || approval.submittedAt,
        reference: metadata.reference || approval.reference,
        lines: metadata.lines || approval.lines || [],
        current_step: approval.current_step || metadata.current_step || 1,
        total_steps: approval.total_steps || metadata.total_steps || 2,
        statusConfig: config,
        workflow_name: approval.workflow_name || metadata.workflow_name || 'Standard Approval',
        comments: approval.comments || [],
        history: approval.history || []
      };
    });
    
    console.log('📊 Enriched approvals:', enrichedApprovals.map(a => ({
      id: a.id,
      entity_id: a.entity_id,
      description: a.description,
      amount: a.amount,
      status: a.status,
      source: a.source || 'unknown'
    })));
    
    setApprovals(enrichedApprovals);
    
    // Calculate stats
    const pending = enrichedApprovals.filter(a => a.status === 'PENDING');
    const approved = enrichedApprovals.filter(a => a.status === 'APPROVED');
    const rejected = enrichedApprovals.filter(a => a.status === 'REJECTED');
    const returned = enrichedApprovals.filter(a => a.status === 'RETURNED');
    
    const newStats = {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      returned: returned.length,
      total: enrichedApprovals.length,
      totalAmount: enrichedApprovals.reduce((sum, a) => sum + (a.amount || 0), 0),
      pendingAmount: pending.reduce((sum, a) => sum + (a.amount || 0), 0)
    };
    
    console.log('📊 Calculated stats:', newStats);
    setStats(newStats);
    
    // If filter is 'pending' and we have pending items, log them
    if (filter === 'pending' && pending.length > 0) {
      console.log('✅ Pending items to display:', pending.length);
    }
    
  } catch (error) {
    console.error('❌ Error fetching approvals:', error);
    toast.error('Failed to load approvals');
    
    setApprovals([]);
    setStats({
      pending: 0,
      approved: 0,
      rejected: 0,
      returned: 0,
      total: 0,
      totalAmount: 0,
      pendingAmount: 0
    });
  } finally {
    setLoading(false);
  }
};

 // Update the handleViewDetails function
const handleViewDetails = async (approval) => {
  try {
    setLoading(true);
    console.log('📥 Fetching journal entry details for:', approval);
    
    // Get the entity ID - try different possible field names
    const entityId = approval.entity_id || approval.entityId || approval.id?.replace('je-', '');
    console.log('🔍 Entity ID to fetch:', entityId);
    
    if (!entityId) {
      console.error('❌ No entity ID found in approval:', approval);
      toast.error('Invalid approval data - missing entity ID');
      setLoading(false);
      return;
    }
    
    // Try to get the journal entry
    let entry = null;
    try {
      // First try using accountantService
      entry = await accountantService.getJournalEntry(entityId);
      console.log('📦 Journal entry from accountantService:', entry);
    } catch (error) {
      console.log('⚠️ Failed to fetch from accountantService, trying journalService...');
      
      // If that fails, try journalService
      try {
        const journalResponse = await journalService.getJournalEntry(entityId);
        console.log('📦 Journal entry from journalService:', journalResponse);
        entry = journalResponse;
      } catch (journalError) {
        console.error('❌ Both services failed to fetch journal entry:', journalError);
      }
    }
    
    if (!entry) {
      console.error('❌ Could not fetch journal entry for ID:', entityId);
      
      // Create a fallback entry from approval data
      console.log('🔄 Creating fallback entry from approval data');
      const fallbackEntry = {
        id: entityId,
        entry_number: `JE-${entityId}`,
        entry_date: approval.submitted_at || new Date().toISOString(),
        description: approval.description || 'Journal Entry',
        reference: approval.reference || '',
        total_debit: approval.amount || 0,
        total_credit: approval.amount || 0,
        lines: approval.lines || approval.metadata?.lines || [
          {
            account_id: 0,
            account_code: 'N/A',
            account_name: 'Unknown Account',
            debit: approval.amount || 0,
            credit: 0,
            description: 'Debit'
          },
          {
            account_id: 0,
            account_code: 'N/A',
            account_name: 'Unknown Account',
            debit: 0,
            credit: approval.amount || 0,
            description: 'Credit'
          }
        ],
        created_by_name: approval.requester || 'Unknown',
        created_at: approval.submitted_at
      };
      
      setSelectedApproval(approval);
      setSelectedEntry(fallbackEntry);
      setShowDetails(true);
      
      toast.warning('Showing limited details - full journal entry not found');
      setLoading(false);
      return;
    }
    
    setSelectedApproval(approval);
    setSelectedEntry(entry);
    setShowDetails(true);
    
  } catch (error) {
    console.error('❌ Error in handleViewDetails:', error);
    toast.error('Failed to load journal entry details: ' + (error.message || 'Unknown error'));
  } finally {
    setLoading(false);
  }
};

  const handleApprove = async () => {
  const { requestId, comments } = actionDialog;
  
  if (!requestId) {
    toast.error('Invalid approval request');
    return;
  }
  
  setSubmitting(true);
  try {
    console.log('📡 Approving request:', requestId);
    
    // Extract the numeric ID if it has a prefix like 'je-'
    let cleanRequestId = requestId;
    if (typeof requestId === 'string' && requestId.startsWith('je-')) {
      cleanRequestId = requestId.replace('je-', '');
      console.log('🔄 Cleaned request ID:', cleanRequestId);
    }
    
    const response = await approvalService.approveRequest(cleanRequestId, comments || 'Approved by Treasurer');
    console.log('📦 Approve response:', response);
    
    toast.success('Journal entry approved successfully');
    
    // Refresh the list
    await fetchApprovals();
    
    // Close dialog and details
    setActionDialog({ isOpen: false, requestId: null, entityId: null, action: null, comments: '' });
    setShowDetails(false);
    
  } catch (error) {
    console.error('❌ Error approving:', error);
    toast.error(error.response?.data?.error || 'Failed to approve');
  } finally {
    setSubmitting(false);
  }
};

const handleReject = async () => {
  const { requestId, comments } = actionDialog;
  
  if (!requestId) {
    toast.error('Invalid approval request');
    return;
  }
  
  if (!comments.trim()) {
    toast.error('Please provide a reason for rejection');
    return;
  }
  
  setSubmitting(true);
  try {
    console.log('📡 Rejecting request:', requestId, 'Reason:', comments);
    
    // Extract the numeric ID if it has a prefix like 'je-'
    let cleanRequestId = requestId;
    if (typeof requestId === 'string' && requestId.startsWith('je-')) {
      cleanRequestId = requestId.replace('je-', '');
      console.log('🔄 Cleaned request ID:', cleanRequestId);
    }
    
    const response = await approvalService.rejectRequest(cleanRequestId, comments);
    console.log('📦 Reject response:', response);
    
    toast.success('Journal entry rejected');
    
    await fetchApprovals();
    
    setActionDialog({ isOpen: false, requestId: null, entityId: null, action: null, comments: '' });
    setShowDetails(false);
    
  } catch (error) {
    console.error('❌ Error rejecting:', error);
    toast.error(error.response?.data?.error || 'Failed to reject');
  } finally {
    setSubmitting(false);
  }
};

const handleReturn = async () => {
  const { requestId, comments } = actionDialog;
  
  if (!requestId) {
    toast.error('Invalid approval request');
    return;
  }
  
  if (!comments.trim()) {
    toast.error('Please provide comments for return');
    return;
  }
  
  setSubmitting(true);
  try {
    console.log('📡 Returning request:', requestId, 'Comments:', comments);
    
    // Extract the numeric ID if it has a prefix like 'je-'
    let cleanRequestId = requestId;
    if (typeof requestId === 'string' && requestId.startsWith('je-')) {
      cleanRequestId = requestId.replace('je-', '');
      console.log('🔄 Cleaned request ID:', cleanRequestId);
    }
    
    const response = await approvalService.returnForCorrection(cleanRequestId, comments);
    console.log('📦 Return response:', response);
    
    toast.success('Journal entry returned for correction');
    
    await fetchApprovals();
    
    setActionDialog({ isOpen: false, requestId: null, entityId: null, action: null, comments: '' });
    setShowDetails(false);
    
  } catch (error) {
    console.error('❌ Error returning:', error);
    toast.error(error.response?.data?.error || 'Failed to return');
  } finally {
    setSubmitting(false);
  }
};

  const handleBulkApprove = async () => {
    const pendingItems = filteredItems.filter(a => a.status === 'PENDING');
    if (pendingItems.length === 0) {
      toast.info('No pending approvals to process');
      return;
    }
    
    const totalAmount = pendingItems.reduce((sum, a) => sum + (a.amount || 0), 0);
    
    if (!window.confirm(`Are you sure you want to approve ${pendingItems.length} pending journal entries totaling ${formatCurrency(totalAmount)}?`)) {
      return;
    }
    
    setSubmitting(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      let approvedAmount = 0;
      
      for (const approval of pendingItems) {
        try {
          await approvalService.approveRequest(approval.id, 'Bulk approved');
          successCount++;
          approvedAmount += approval.amount || 0;
        } catch (error) {
          console.error(`Error approving request ${approval.id}:`, error);
          errorCount++;
        }
      }
      
      toast.success(`Approved ${successCount} entries (${formatCurrency(approvedAmount)})${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      await fetchApprovals(); // Refresh the list
      
    } catch (error) {
      console.error('Error in bulk approve:', error);
      toast.error('Failed to process bulk approval');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredItems = () => {
    let filtered = approvals;
    
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.status === filter.toUpperCase());
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.description?.toLowerCase().includes(term) ||
        item.requester?.toLowerCase().includes(term) ||
        `#${item.entity_id}`.includes(term) ||
        item.reference?.toLowerCase().includes(term) ||
        item.workflow_name?.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch(sortBy) {
        case 'date_desc':
          return new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0);
        case 'date_asc':
          return new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0);
        case 'amount_desc':
          return (b.amount || 0) - (a.amount || 0);
        case 'amount_asc':
          return (a.amount || 0) - (b.amount || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig['PENDING'];
    return config.badgeColor;
  };

  const getStatusIcon = (status) => {
    const config = statusConfig[status] || statusConfig['PENDING'];
    const Icon = config.icon;
    return <Icon className={`h-5 w-5 ${config.color}`} />;
  };

  const filteredItems = getFilteredItems();
  const pendingCount = filteredItems.filter(a => a.status === 'PENDING').length;
  const filteredTotalAmount = filteredItems.reduce((sum, a) => sum + (a.amount || 0), 0);

  // Debug render
  console.log('🔄 Render - approvals:', approvals.length, 'filtered:', filteredItems.length, 'filter:', filter);

  if (loading && approvals.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/treasurer/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Journal Entry Approvals</h1>
              <p className="mt-2 text-sm text-gray-600">
                Review and approve journal entries submitted for approval
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {pendingCount > 0 && (
              <button
                onClick={handleBulkApprove}
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                Approve All ({pendingCount})
              </button>
            )}
            <button
              onClick={fetchApprovals}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards with Amounts */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total: {formatCurrency(stats.totalAmount)}</p>
          </div>
          <div className={`bg-white rounded-lg p-4 border ${statusConfig.PENDING.borderColor}`}>
            <p className={`text-xs ${statusConfig.PENDING.textColor}`}>Pending</p>
            <p className={`text-2xl font-bold ${statusConfig.PENDING.color}`}>{stats.pending}</p>
            <p className={`text-xs ${statusConfig.PENDING.textColor} mt-1`}>{formatCurrency(stats.pendingAmount)}</p>
          </div>
          <div className={`bg-white rounded-lg p-4 border ${statusConfig.APPROVED.borderColor}`}>
            <p className={`text-xs ${statusConfig.APPROVED.textColor}`}>Approved</p>
            <p className={`text-2xl font-bold ${statusConfig.APPROVED.color}`}>{stats.approved}</p>
            <p className={`text-xs ${statusConfig.APPROVED.textColor} mt-1`}>
              {formatCurrency(approvals.filter(a => a.status === 'APPROVED').reduce((sum, a) => sum + (a.amount || 0), 0))}
            </p>
          </div>
          <div className={`bg-white rounded-lg p-4 border ${statusConfig.REJECTED.borderColor}`}>
            <p className={`text-xs ${statusConfig.REJECTED.textColor}`}>Rejected</p>
            <p className={`text-2xl font-bold ${statusConfig.REJECTED.color}`}>{stats.rejected}</p>
            <p className={`text-xs ${statusConfig.REJECTED.textColor} mt-1`}>
              {formatCurrency(approvals.filter(a => a.status === 'REJECTED').reduce((sum, a) => sum + (a.amount || 0), 0))}
            </p>
          </div>
          <div className={`bg-white rounded-lg p-4 border ${statusConfig.RETURNED.borderColor}`}>
            <p className={`text-xs ${statusConfig.RETURNED.textColor}`}>Returned</p>
            <p className={`text-2xl font-bold ${statusConfig.RETURNED.color}`}>{stats.returned}</p>
            <p className={`text-xs ${statusConfig.RETURNED.textColor} mt-1`}>
              {formatCurrency(approvals.filter(a => a.status === 'RETURNED').reduce((sum, a) => sum + (a.amount || 0), 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-xs text-purple-600">Filtered</p>
            <p className="text-2xl font-bold text-purple-600">{filteredItems.length}</p>
            <p className="text-xs text-purple-600 mt-1">{formatCurrency(filteredTotalAmount)}</p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-[rgb(31,178,86)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
              <button
                onClick={() => setFilter('returned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'returned'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Returned ({stats.returned})
              </button>
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="status">By Status</option>
              </select>
              
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-500">
              Showing {filteredItems.length} of {approvals.length} requests
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('pending');
                  setSortBy('date_desc');
                }}
                className="text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)] font-medium flex items-center"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            )}
          </div>
          <p className="text-sm font-medium text-purple-600">
            Filtered Total: {formatCurrency(filteredTotalAmount)}
          </p>
        </div>

        {/* Approvals List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredItems.length > 0 ? (
              filteredItems.map((approval) => {
                const config = statusConfig[approval.status] || statusConfig['PENDING'];
                const StatusIcon = config.icon;
                
                return (
                  <motion.div
                    key={approval.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`bg-white rounded-xl shadow-sm border ${config.borderColor} p-6 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3 flex-wrap gap-2">
                          <div className={`p-1.5 rounded-full ${config.bgColor}`}>
                            <StatusIcon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full border ${config.badgeColor}`}>
                            {config.label}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatDate(approval.submitted_at)}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {approval.requester}
                          </span>
                          {approval.reference && (
                            <span className="text-sm text-gray-500 flex items-center">
                              <TagIcon className="h-4 w-4 mr-1" />
                              Ref: {approval.reference}
                            </span>
                          )}
                          {approval.source && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {approval.source}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {approval.description}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm mb-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 text-xs mb-1">Amount</p>
                            <p className="font-bold text-purple-600 text-lg">
                              {approval.amount ? formatCurrency(approval.amount) : 'GHS 0.00'}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 text-xs mb-1">Entry #</p>
                            <p className="font-medium text-gray-900">#{approval.entity_id}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                            <p className="text-gray-500 text-xs mb-1">Progress</p>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900 mr-2">
                                Step {approval.current_step || 0}/{approval.total_steps || 1}
                              </span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className={`h-2 rounded-full ${config.progressColor}`} 
                                  style={{ width: `${((approval.current_step || 0) / (approval.total_steps || 1)) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 text-xs mb-1">Workflow</p>
                            <p className="font-medium text-gray-900 truncate" title={approval.workflow_name}>
                              {approval.workflow_name}
                            </p>
                          </div>
                        </div>

                        {/* Comments/Notes Section */}
                        {(approval.notes || approval.comments?.length > 0) && (
                          <div className="mt-3 space-y-2">
                            {approval.notes && (
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                  <span className="font-medium">Submitter notes:</span> {approval.notes}
                                </p>
                              </div>
                            )}
                            
                            {approval.comments?.length > 0 && (
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-2">Recent Comments:</p>
                                {approval.comments.slice(-2).map((comment, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 mb-1">
                                    <span className="font-medium">{comment.user}:</span> {comment.text}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-6 flex flex-col space-y-2 min-w-[120px]">
                        <button
                          onClick={() => handleViewDetails(approval)}
                          className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] text-sm w-full justify-center transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Review
                        </button>
                        
                        {approval.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setActionDialog({ 
                                isOpen: true, 
                                requestId: approval.id,
                                entityId: approval.entity_id,
                                action: 'approve',
                                comments: ''
                              })}
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm w-full justify-center transition-colors"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Approve
                            </button>
                            
                            <button
                              onClick={() => setActionDialog({ 
                                isOpen: true, 
                                requestId: approval.id,
                                entityId: approval.entity_id,
                                action: 'return',
                                comments: ''
                              })}
                              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm w-full justify-center transition-colors"
                            >
                              <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                              Return
                            </button>
                            
                            <button
                              onClick={() => setActionDialog({ 
                                isOpen: true, 
                                requestId: approval.id,
                                entityId: approval.entity_id,
                                action: 'reject',
                                comments: ''
                              })}
                              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm w-full justify-center transition-colors"
                            >
                              <XCircleIcon className="h-4 w-4 mr-2" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200"
              >
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Approvals Found</h3>
                <p className="text-gray-500">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your search filters'
                    : 'No journal entries pending approval'}
                </p>
                {(searchTerm || filter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('pending');
                    }}
                    className="mt-4 px-4 py-2 text-sm text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)] font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Details Modal */}
        <AnimatePresence>
          {showDetails && selectedApproval && selectedEntry && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Journal Entry Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-1.5 rounded-full ${selectedApproval.statusConfig?.bgColor || 'bg-gray-50'}`}>
                      {getStatusIcon(selectedApproval.status)}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(selectedApproval.status)}`}>
                      {selectedApproval.status}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Submitted {formatDateTime(selectedApproval.submitted_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Entry Number</p>
                      <p className="font-medium">{selectedEntry.entry_number || `#${selectedEntry.id}`}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(selectedEntry.entry_date)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{selectedEntry.description}</p>
                  </div>

                  {selectedEntry.reference && (
                    <div>
                      <p className="text-sm text-gray-500">Reference</p>
                      <p className="font-medium">{selectedEntry.reference}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Debit</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedEntry.total_debit || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Credit</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(selectedEntry.total_credit || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-b border-gray-200 py-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Journal Lines</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Account</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Debit</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Credit</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedEntry.lines?.map((line, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center">
                                  {getAccountTypeIcon(line.account_type)}
                                  <span className="ml-2">
                                    {line.account_code} - {line.account_name || `Account #${line.account_id}`}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                                {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                                {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {line.description || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td className="px-4 py-3 text-sm font-medium">Totals</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                              {formatCurrency(selectedEntry.total_debit || 0)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                              {formatCurrency(selectedEntry.total_credit || 0)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Approval History */}
                  {selectedApproval.history && selectedApproval.history.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Approval History</h3>
                      <div className="space-y-2">
                        {selectedApproval.history.map((item, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-sm">
                            <div className="w-20 text-xs text-gray-400">{formatDate(item.created_at)}</div>
                            <div className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </div>
                            <div className="text-gray-600">
                              <span className="font-medium">{item.user_name || item.user}:</span> {item.comment}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApproval.notes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Submitter notes:</span> {selectedApproval.notes}
                      </p>
                    </div>
                  )}

                  {selectedApproval.status === 'PENDING' && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          setActionDialog({ 
                            isOpen: true, 
                            requestId: selectedApproval.id,
                            entityId: selectedApproval.entity_id,
                            action: 'reject',
                            comments: ''
                          });
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          setActionDialog({ 
                            isOpen: true, 
                            requestId: selectedApproval.id,
                            entityId: selectedApproval.entity_id,
                            action: 'return',
                            comments: ''
                          });
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                      >
                        Return
                      </button>
                      <button
                        onClick={() => {
                          setActionDialog({ 
                            isOpen: true, 
                            requestId: selectedApproval.id,
                            entityId: selectedApproval.entity_id,
                            action: 'approve',
                            comments: ''
                          });
                          setShowDetails(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Action Dialog */}
        <AnimatePresence>
          {actionDialog.isOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {actionDialog.action === 'approve' && 'Approve Journal Entry'}
                  {actionDialog.action === 'reject' && 'Reject Journal Entry'}
                  {actionDialog.action === 'return' && 'Return for Correction'}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {actionDialog.action === 'approve' && 'This journal entry will be approved and ready for posting.'}
                  {actionDialog.action === 'reject' && 'This journal entry will be rejected. Please provide a reason.'}
                  {actionDialog.action === 'return' && 'This journal entry will be returned for correction. Please provide feedback.'}
                </p>
                
                {(actionDialog.action === 'reject' || actionDialog.action === 'return') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {actionDialog.action === 'reject' ? 'Reason' : 'Feedback'} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={actionDialog.comments}
                      onChange={(e) => setActionDialog({ ...actionDialog, comments: e.target.value })}
                      rows={3}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                      placeholder={actionDialog.action === 'reject' 
                        ? 'Please provide a reason for rejection...' 
                        : 'Please provide feedback for correction...'}
                      required
                      autoFocus
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setActionDialog({ isOpen: false, requestId: null, entityId: null, action: null, comments: '' })}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={actionDialog.action === 'approve' ? handleApprove : actionDialog.action === 'reject' ? handleReject : handleReturn}
                    disabled={submitting || ((actionDialog.action === 'reject' || actionDialog.action === 'return') && !actionDialog.comments.trim())}
                    className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                      actionDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      actionDialog.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    {submitting ? 'Processing...' : actionDialog.action === 'approve' ? 'Approve' : actionDialog.action === 'reject' ? 'Reject' : 'Return'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TransactionApprovals;