import React from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Wrapper component for conditional rendering based on permissions
 * 
 * Usage:
 * <PermissionWrapper permission="view_income">
 *   <IncomeList />
 * </PermissionWrapper>
 * 
 * <PermissionWrapper requireAll={true} permissions={['view_income', 'edit_income']}>
 *   <IncomeEditor />
 * </PermissionWrapper>
 */
const PermissionWrapper = ({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback = null,
  roles = []
}) => {
  const { can, canAll, hasAnyRole } = useAuth();

  // Check roles first if specified
  if (roles.length > 0 && !hasAnyRole(roles)) {
    return fallback;
  }

  // Check single permission
  if (permission && !can(permission)) {
    return fallback;
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    if (requireAll) {
      if (!canAll(permissions)) {
        return fallback;
      }
    } else {
      if (!permissions.some(p => can(p))) {
        return fallback;
      }
    }
  }

  return children;
};

export default PermissionWrapper;