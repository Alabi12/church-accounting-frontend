import api from './api';

export const authService = {
  async login(email, password) {
    try {
      console.log('📡 Sending login request to backend...');
      console.log('🔧 API URL:', api.defaults.baseURL);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('📥 Login response received:', response.data);
      
      if (response.data.tokens) {
        const { access_token, refresh_token } = response.data.tokens;
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        console.log('✅ Tokens stored successfully');
        
        // Fetch full user details with permissions
        try {
          const userDetails = await authService.getUserDetails(response.data.user.id);
          const fullUser = {
            ...response.data.user,
            ...userDetails,
            permissions: userDetails.permissions || []
          };
          localStorage.setItem('user', JSON.stringify(fullUser));
          console.log('✅ User permissions loaded');
          return { ...response.data, user: fullUser };
        } catch (permError) {
          console.warn('⚠️ Could not fetch user permissions:', permError);
          return response.data;
        }
      }
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async getProfile() {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Getting profile with token:', token ? 'Present' : 'Missing');
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  async getUserDetails(userId) {
    try {
      console.log(`🔍 Fetching user details for ID: ${userId}`);
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return {};
    }
  },

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      
      console.log('🔄 Attempting token refresh...');
      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken
      });
      
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        console.log('✅ Token refreshed successfully');
        
        const currentUser = authService.getCurrentUser();
        if (currentUser?.id) {
          const userDetails = await authService.getUserDetails(currentUser.id);
          const updatedUser = {
            ...currentUser,
            ...userDetails,
            permissions: userDetails.permissions || []
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      return response.data;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  },

  logout() {
    console.log('🚪 Logging out, clearing storage');
    localStorage.clear();
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  getToken() {
    return localStorage.getItem('access_token');
  },

  hasPermission(permission) {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions?.includes(permission) || false;
  },

  hasAnyPermission(permissions) {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return permissions.some(perm => user.permissions?.includes(perm));
  },

  hasAllPermissions(permissions) {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return permissions.every(perm => user.permissions?.includes(perm));
  },

  hasRole(roles) {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  },

  getUserPermissions() {
    const user = authService.getCurrentUser();
    return user?.permissions || [];
  },

  canAccess(module) {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    
    const modulePermissions = {
      'dashboard': [],
      'users': ['view_users', 'manage_users'],
      'roles': ['view_roles', 'manage_roles'],
      'permissions': ['manage_permissions'],
      'audit-logs': ['view_audit_logs'],
      'settings': ['view_settings', 'manage_settings'],
      'chart-of-accounts': ['view_accounts', 'manage_accounts'],
      'journal-entries': ['view_journal_entries', 'create_journal_entry'],
      'financial-reports': ['view_financial_reports'],
      'treasurer-approvals': ['approve_journal_entries'],
      'backup': ['manage_backup']
    };
    
    const requiredPerms = modulePermissions[module];
    if (!requiredPerms || requiredPerms.length === 0) return true;
    
    return authService.hasAnyPermission(requiredPerms);
  }
};

// Add default export at the end
export default authService;