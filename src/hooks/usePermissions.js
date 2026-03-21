import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, ROLES } from '../utils/permissions';

export const usePermissions = () => {
  const { user, can, hasRole, hasAnyRole } = useAuth();

  const canManageUsers = can(PERMISSIONS.VIEW_USERS) || can(PERMISSIONS.CREATE_USER);
  const canManageFinances = can(PERMISSIONS.VIEW_INCOME) || can(PERMISSIONS.VIEW_EXPENSES);
  const canApproveTransactions = can(PERMISSIONS.APPROVE_INCOME) || can(PERMISSIONS.APPROVE_EXPENSE);
  const canViewReports = can(PERMISSIONS.VIEW_REPORTS);
  const canGenerateReports = can(PERMISSIONS.GENERATE_REPORTS);
  const canExportData = can(PERMISSIONS.EXPORT_DATA);
  const canViewAuditLogs = can(PERMISSIONS.VIEW_AUDIT_LOGS);
  const canManageMembers = can(PERMISSIONS.VIEW_MEMBERS) || can(PERMISSIONS.CREATE_MEMBER);

  return {
    can,
    hasRole,
    hasAnyRole,
    user,
    canManageUsers,
    canManageFinances,
    canApproveTransactions,
    canViewReports,
    canGenerateReports,
    canExportData,
    canViewAuditLogs,
    canManageMembers,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
    isTreasurer: user?.role === ROLES.TREASURER,
    isAccountant: user?.role === ROLES.ACCOUNTANT,
    isPastor: user?.role === ROLES.PASTOR,
    isAuditor: user?.role === ROLES.AUDITOR,
    isFinanceCommittee: user?.role === ROLES.FINANCE_COMMITTEE,
  };
};