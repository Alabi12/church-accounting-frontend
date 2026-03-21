// services/approval.js
import api from './api';

export const approvalService = {
  getPendingApprovals: async (entityType = null) => {
    try {
      const params = entityType ? { entity_type: entityType } : {};
      const response = await api.get('/accounting/approvals/pending', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return { approvals: [] };
    }
  },

  submitForApproval: async (entityType, entityId, notes = '') => {
    try {
      console.log('📤 Submitting for approval:', { entityType, entityId, notes });
      const response = await api.post('/accounting/approvals/submit', {
        entity_type: entityType,
        entity_id: entityId,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting for approval:', error);
      throw error;
    }
  },

 // In approval.js

// Update approveRequest to work with journal entries
approveRequest: async (journalEntryId, comments) => {
  try {
    console.log(`📡 Approving journal entry ${journalEntryId} with comments:`, comments);
    
    // Ensure ID is a number
    const numericId = parseInt(journalEntryId, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid journal entry ID');
    }
    
    // Call the journal entry approve endpoint
    const response = await api.post(`/journal_entries/${numericId}/approve`, { 
      comments: comments || 'Approved by Treasurer' 
    });
    
    console.log('📦 Approve response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error approving journal entry:', error);
    throw error;
  }
},

// Update rejectRequest to work with journal entries
rejectRequest: async (journalEntryId, reason) => {
  try {
    console.log(`📡 Rejecting journal entry ${journalEntryId} with reason:`, reason);
    
    const numericId = parseInt(journalEntryId, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid journal entry ID');
    }
    
    // Call the journal entry reject endpoint
    const response = await api.post(`/journal_entries/${numericId}/reject`, { 
      reason: reason || 'Rejected by Treasurer' 
    });
    
    console.log('📦 Reject response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error rejecting journal entry:', error);
    throw error;
  }
},

// Update returnForCorrection to work with journal entries
returnForCorrection: async (journalEntryId, feedback) => {
  try {
    console.log(`📡 Returning journal entry ${journalEntryId} with feedback:`, feedback);
    
    const numericId = parseInt(journalEntryId, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid journal entry ID');
    }
    
    // Call the journal entry return endpoint
    const response = await api.post(`/journal_entries/${numericId}/return`, { 
      feedback: feedback || 'Please correct and resubmit' 
    });
    
    console.log('📦 Return response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error returning journal entry:', error);
    throw error;
  }
},

// Keep getPendingApprovals as is, or update to fetch journal entries directly
getPendingApprovals: async (entityType = null) => {
  try {
    console.log('📡 Fetching pending journal entries...');
    
    // Fetch journal entries with PENDING status
    const response = await api.get('/journal_entries?status=PENDING&perPage=100');
    console.log('📦 Pending journal entries:', response.data);
    
    // Transform journal entries to match the approval format expected by the UI
    const entries = response.data.entries || [];
    const transformedEntries = entries.map(entry => ({
      id: `je-${entry.id}`,
      entity_id: entry.id,
      entity_type: 'journal_entry',
      status: entry.status,
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
      workflow_name: 'Journal Entry Approval'
    }));
    
    return { approvals: transformedEntries };
  } catch (error) {
    console.error('❌ Error fetching pending journal entries:', error);
    return { approvals: [] };
  }
},

  getApprovalHistory: async (entityType, entityId) => {
    try {
      const response = await api.get('/accounting/approvals/history', {
        params: { entity_type: entityType, entity_id: entityId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching approval history:', error);
      return { history: [] };
    }
  }
};