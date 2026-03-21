import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';
import api from '../services/api';
import { ROLES } from '../utils/permissions';

// Create context
const AuthContext = createContext(null);

// Custom hook - MUST be named useAuth and exported separately
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component - MUST be a default export or named export
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const userData = JSON.parse(storedUser);
          
          try {
            const profile = await authService.getProfile();
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          } catch (profileError) {
            setUser(userData);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.tokens.access_token}`;
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  const can = (permission) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    can,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
    isPastor: user?.role === ROLES.PASTOR,
    isTreasurer: user?.role === ROLES.TREASURER,
    isAccountant: user?.role === ROLES.ACCOUNTANT,
    isFinanceCommittee: user?.role === ROLES.FINANCE_COMMITTEE,
    isAuditor: user?.role === ROLES.AUDITOR,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Default export for the provider (optional, but can help with Fast Refresh)
export default AuthProvider;