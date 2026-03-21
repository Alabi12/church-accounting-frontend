// User roles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PASTOR: 'PASTOR',
  TREASURER: 'TREASURER',
  ACCOUNTANT: 'ACCOUNTANT',
  FINANCE_COMMITTEE: 'FINANCE_COMMITTEE',
  AUDITOR: 'AUDITOR',
  USER: 'USER',
};

// Permission constants
export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  
  // Church management
  VIEW_CHURCH: 'view_church',
  EDIT_CHURCH: 'edit_church',
  
  // Financial permissions
  VIEW_INCOME: 'view_income',
  CREATE_INCOME: 'create_income',
  EDIT_INCOME: 'edit_income',
  DELETE_INCOME: 'delete_income',
  APPROVE_INCOME: 'approve_income',
  
  VIEW_EXPENSES: 'view_expenses',
  CREATE_EXPENSE: 'create_expense',
  EDIT_EXPENSE: 'edit_expense',
  DELETE_EXPENSE: 'delete_expense',
  APPROVE_EXPENSE: 'approve_expense',
  
  // Budget permissions
  VIEW_BUDGET: 'view_budget',
  CREATE_BUDGET: 'create_budget',
  EDIT_BUDGET: 'edit_budget',
  APPROVE_BUDGET: 'approve_budget',
  
  // Report permissions
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  EXPORT_DATA: 'export_data',
  
  // Payroll permissions
  VIEW_PAYROLL: 'view_payroll',
  PROCESS_PAYROLL: 'process_payroll',
  APPROVE_PAYROLL: 'approve_payroll',
  
  // Audit permissions
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  EXPORT_AUDIT_LOGS: 'export_audit_logs',
  
  // Member management
  VIEW_MEMBERS: 'view_members',
  CREATE_MEMBER: 'create_member',
  EDIT_MEMBER: 'edit_member',
  DELETE_MEMBER: 'delete_member',
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.PASTOR]: 'Pastor',
  [ROLES.TREASURER]: 'Treasurer',
  [ROLES.ACCOUNTANT]: 'Accountant',
  [ROLES.FINANCE_COMMITTEE]: 'Finance Committee',
  [ROLES.AUDITOR]: 'Auditor',
  [ROLES.USER]: 'User',
};

// Helper function to check permissions
export const hasPermission = (userRole, userPermissions, requiredPermission) => {
  if (userRole === ROLES.SUPER_ADMIN) {
    return true;
  }
  return userPermissions?.includes(requiredPermission) || false;
};

// Helper to check role
export const hasRole = (userRole, requiredRole) => {
  return userRole === requiredRole;
};

// Helper to check any role from list
export const hasAnyRole = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};