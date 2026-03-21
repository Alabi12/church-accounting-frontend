import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const RoleBasedRoute = ({ children, allowedRoles = [], requiredPermissions = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super admin has access to everything
  if (user.role === 'super_admin') {
    return children;
  }

  // Check if user has required role
  if (allowedRoles.length > 0) {
    // Convert both to strings for comparison
    const userRole = String(user.role).toLowerCase();
    const allowed = allowedRoles.map(r => String(r).toLowerCase());
    
    if (!allowed.includes(userRole)) {
      console.log(`Access denied: User role "${userRole}" not in allowed roles:`, allowed);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check if user has required permissions (if implemented)
  if (requiredPermissions.length > 0) {
    const userPermissions = user.permissions || [];
    const hasAllPermissions = requiredPermissions.every(perm => 
      userPermissions.includes(perm)
    );
    
    if (!hasAllPermissions) {
      console.log('Access denied: Missing required permissions');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default RoleBasedRoute;