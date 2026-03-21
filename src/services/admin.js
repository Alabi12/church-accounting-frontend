import api from './api';

// Retry utility for API calls
async function withRetry(apiCall, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Only retry on 429 errors
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        console.log(`Rate limited. Retrying in ${delay}ms... (Attempt ${i + 2}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

export const adminService = {
  // ==================== USER MANAGEMENT ====================

  /**
   * Get users list with filters
   * @param {Object} params - Query parameters
   */
  getUsers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('perPage', params.perPage);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await api.get(`/admin/users?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param {number} id - User ID
   */
  getUser: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  /**
   * Create new user
   * @param {Object} data - User data
   */
  createUser: async (data) => {
    try {
      const response = await api.post('/admin/users', data);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} data - Updated data
   */
  updateUser: async (id, data) => {
    try {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Delete user
   * @param {number} id - User ID
   */
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * Toggle user status
   * @param {number} id - User ID
   * @param {boolean} isActive - New status
   */
  toggleUserStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/admin/users/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  /**
   * Export users
   * @param {Object} filters - Filter parameters
   */
  exportUsers: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await api.get(`/admin/users/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  },

  // ==================== AUDIT LOGS ====================

  /**
   * Get audit logs
   * @param {Object} params - Query parameters
   */
  getAuditLogs: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.perPage) queryParams.append('perPage', params.perPage);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.action) queryParams.append('action', params.action);
      if (params.resource) queryParams.append('resource', params.resource);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await api.get(`/admin/audit-logs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Export audit logs
   * @param {Object} filters - Filter parameters
   */
  exportAuditLogs: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await api.get(`/admin/audit-logs/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  },

  // ==================== SYSTEM SETTINGS ====================

  /**
   * Get system settings
   */
  getSystemSettings: async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  },

  /**
   * Update system settings
   * @param {Object} data - Settings data
   */
  updateSystemSettings: async (data) => {
    try {
      const response = await api.put('/admin/settings', data);
      return response.data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  },

  // ==================== ROLE PERMISSIONS ====================

  /**
   * Get all roles
   */
  getRoles: async () => {
    try {
      const response = await api.get('/admin/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  /**
   * Create new role
   * @param {Object} data - Role data
   */
  createRole: async (data) => {
    try {
      const response = await api.post('/admin/roles', data);
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  /**
   * Update role
   * @param {number} id - Role ID
   * @param {Object} data - Updated data
   */
  updateRole: async (id, data) => {
    try {
      const response = await api.put(`/admin/roles/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  /**
   * Delete role
   * @param {number} id - Role ID
   */
  deleteRole: async (id) => {
    try {
      const response = await api.delete(`/admin/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },

  /**
   * Get all permissions
   */
  getAllPermissions: async () => {
    try {
      const response = await api.get('/admin/permissions');
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  /**
   * Get role permissions
   */
  getRolePermissions: async () => {
    try {
      const response = await api.get('/admin/role-permissions');
      return response.data;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
    }
  },

  /**
   * Update role permissions
   * @param {Object} data - Permissions data
   */
  updateRolePermissions: async (data) => {
    try {
      const response = await api.put('/admin/role-permissions', data);
      return response.data;
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  },

  // ==================== CHURCH MANAGEMENT ====================
  // NEW SECTION ADDED

  /**
   * Get all churches
   */
  getChurches: async () => {
    try {
      console.log('🏢 Fetching churches...');
      const response = await api.get('/churches');
      return response.data;
    } catch (error) {
      console.error('Error fetching churches:', error);
      throw error;
    }
  },

  /**
   * Get church by ID
   * @param {number} id - Church ID
   */
  getChurch: async (id) => {
    try {
      console.log(`🏢 Fetching church ${id}...`);
      const response = await api.get(`/churches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching church:', error);
      throw error;
    }
  },

  /**
   * Create new church
   * @param {Object} data - Church data
   */
  createChurch: async (data) => {
    try {
      console.log('🏢 Creating church...', data);
      const response = await api.post('/churches', data);
      return response.data;
    } catch (error) {
      console.error('Error creating church:', error);
      throw error;
    }
  },

  /**
   * Update church
   * @param {number} id - Church ID
   * @param {Object} data - Updated data
   */
  updateChurch: async (id, data) => {
    try {
      console.log(`🏢 Updating church ${id}...`, data);
      const response = await api.put(`/churches/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating church:', error);
      throw error;
    }
  },

  /**
   * Delete church
   * @param {number} id - Church ID
   */
  deleteChurch: async (id) => {
    try {
      console.log(`🏢 Deleting church ${id}...`);
      const response = await api.delete(`/churches/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting church:', error);
      throw error;
    }
  },

  // ==================== CHURCH SETTINGS ====================

  /**
   * Get church settings
   */
  getChurchSettings: async () => {
    try {
      const response = await api.get('/admin/church');
      return response.data;
    } catch (error) {
      console.error('Error fetching church settings:', error);
      throw error;
    }
  },

  /**
   * Update church settings
   * @param {Object} data - Church data
   */
  updateChurchSettings: async (data) => {
    try {
      const response = await api.put('/admin/church', data);
      return response.data;
    } catch (error) {
      console.error('Error updating church settings:', error);
      throw error;
    }
  },

  // ==================== BACKUP ====================

  /**
   * Create backup
   */
  createBackup: async () => {
    try {
      const response = await api.post('/admin/backup');
      return response.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  },

  /**
   * Restore backup
   * @param {string} backupId - Backup ID
   */
  restoreBackup: async (backupId) => {
    try {
      const response = await api.post(`/admin/backup/${backupId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  },

  /**
   * Get backups list
   */
  getBackups: async () => {
    try {
      const response = await api.get('/admin/backups');
      return response.data;
    } catch (error) {
      console.error('Error fetching backups:', error);
      throw error;
    }
  },

  /**
   * Download backup
   * @param {string} backupId - Backup ID
   */
  downloadBackup: async (backupId) => {
    try {
      const response = await api.get(`/admin/backup/${backupId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backupId}.sql`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  },
};