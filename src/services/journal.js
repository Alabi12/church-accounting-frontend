import api from './api';

export const journalService = {
  // Get journal entries with filters
  // In journalService.js
getJournalEntries: async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.perPage) queryParams.append('per_page', params.perPage);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const url = `/journal_entries?${queryParams.toString()}`;
    console.log('📤 Fetching journal entries from:', url);
    
    const response = await api.get(url);
    console.log('📥 Journal entries response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return { entries: [], total: 0 };
  }
},

 // In journal.js
getJournalEntry: async (id) => {
  try {
    console.log(`📥 Fetching journal entry ${id} from journalService...`);
    
    // Clean the ID if it has a prefix
    const cleanId = id.toString().replace('je-', '');
    
    const response = await api.get(`/journal_entries/${cleanId}`);
    console.log('📦 Journal entry response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching journal entry:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    throw error;
  }
},

  // Create journal entry
  createJournalEntry: async (data) => {
    try {
      const response = await api.post('/journal-entries', data);
      return response.data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  },

  // Update journal entry
  updateJournalEntry: async (id, data) => {
    try {
      const response = await api.put(`/journal-entries/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  },

  // Post journal entry
  postJournalEntry: async (id) => {
    try {
      const response = await api.post(`/journal-entries/${id}/post`);
      return response.data;
    } catch (error) {
      console.error('Error posting journal entry:', error);
      throw error;
    }
  },

  // Void journal entry
  voidJournalEntry: async (id, reason = '') => {
    try {
      const response = await api.post(`/journal-entries/${id}/void`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error voiding journal entry:', error);
      throw error;
    }
  },

  // Delete journal entry
  deleteJournalEntry: async (id) => {
    try {
      const response = await api.delete(`/journal-entries/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }
};