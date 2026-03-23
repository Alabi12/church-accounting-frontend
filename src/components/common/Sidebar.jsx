// Sidebar.jsx - Corrected imports
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import logo from '../../assets/pcg-logo.jpg';
import {
  // Navigation Icons
  HomeIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  DocumentTextIcon,
  CalculatorIcon,
  MagnifyingGlassIcon,
  HandRaisedIcon,
  CalendarIcon,
  HeartIcon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  
  // Additional Icons
  ScaleIcon,
  PresentationChartBarIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  TableCellsIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ReceiptPercentIcon,
  WalletIcon,
  CreditCardIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BellIcon,
  PlusIcon,
  
  // Approval Flow Icons
  PencilSquareIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  
  // Payroll & Leave Icons
  BanknotesIcon as PayrollIcon,  // Use BanknotesIcon as PayrollIcon
  DocumentTextIcon as PayslipIcon,
  UserGroupIcon as EmployeeIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  ReceiptPercentIcon as DeductionIcon,
  CalculatorIcon as TaxIcon,
  ClockIcon as LeaveIcon,
  CalendarIcon as LeaveCalendarIcon,
  ChartBarIcon as LeaveBalanceIcon,
  DocumentCheckIcon,
  DocumentArrowDownIcon,
  
  // Accounting & Chart of Accounts Icons
  BookOpenIcon as LedgerIcon,
  ScaleIcon as TrialBalanceIcon,
  PresentationChartBarIcon as FinancialStatementsIcon,
  DocumentDuplicateIcon as JournalIcon,
  FolderIcon as ChartOfAccountsIcon,
  BuildingOfficeIcon as AccountsIcon,  // Use BuildingOfficeIcon instead
  BanknotesIcon as CashIcon,
  CreditCardIcon as BankIcon,
  ArrowPathIcon as ReconciliationIcon,
  ReceiptPercentIcon as TaxReportIcon,
} from '@heroicons/react/24/outline';
import { PERMISSIONS } from '../../utils/permissions';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { can, isSuperAdmin, isAdmin, isTreasurer, isAccountant, isAuditor, isPastor, isFinanceCommittee } = usePermissions();
  const location = useLocation();
  
  const [expandedSections, setExpandedSections] = useState({
    dashboard: false,
    financial: false,
    management: false,
    reports: false,
    accountant: true,
    treasurer: false,
    auditor: false,
    pastor: false,
    committee: false,
    admin: false,
    settings: false,
    payroll: false,
    leave: false
  });
  
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const path = location.pathname;
    const newExpanded = { ...expandedSections };
    
    if (path.includes('/dashboard')) newExpanded.dashboard = true;
    if (path.includes('/income') || path.includes('/expenses') || path.includes('/donations')) newExpanded.financial = true;
    if (path.includes('/members') || path.includes('/budgets')) newExpanded.management = true;
    if (path.includes('/reports')) newExpanded.reports = true;
    if (path.includes('/accountant')) newExpanded.accountant = true;
    if (path.includes('/treasurer')) newExpanded.treasurer = true;
    if (path.includes('/auditor')) newExpanded.auditor = true;
    if (path.includes('/pastor')) newExpanded.pastor = true;
    if (path.includes('/committee')) newExpanded.committee = true;
    if (path.includes('/admin')) newExpanded.admin = true;
    if (path.includes('/profile') || path.includes('/settings')) newExpanded.settings = true;
    if (path.includes('/payroll')) newExpanded.payroll = true;
    if (path.includes('/leave')) newExpanded.leave = true;
    
    setExpandedSections(prev => ({ ...prev, ...newExpanded }));
  }, [location.pathname]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.firstName && user?.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserRoleDisplay = () => {
    const roleMap = {
      super_admin: 'Super Admin',
      admin: 'Administrator',
      treasurer: 'Treasurer',
      accountant: 'Accountant',
      auditor: 'Auditor',
      pastor: 'Pastor',
      finance_committee: 'Finance Committee',
      user: 'User'
    };
    return roleMap[user?.role] || user?.role?.replace(/_/g, ' ') || 'User';
  };

  // ==================== ACCOUNTING SECTION ====================
  const accountingSection = {
    id: 'accountant',
    title: 'Accounting',
    icon: CalculatorIcon,
    color: 'green',
    isCollapsible: true,
    isExpanded: expandedSections.accountant,
    onToggle: () => toggleSection('accountant'),
    items: [
      { name: 'Dashboard', to: '/accountant/dashboard', icon: HomeIcon, description: 'Accounting overview' },
      { name: 'Chart of Accounts', to: '/accountant/chart-of-accounts', icon: ChartOfAccountsIcon, description: 'Manage accounts structure', badge: 'New' },
      { name: 'Journal Entries', to: '/accountant/journal-entries', icon: JournalIcon, description: 'Create and manage entries' },
      { name: 'Pending Approvals', to: '/accountant/pending-approvals', icon: ClockIcon, description: 'Awaiting approval' },
      { name: 'General Ledger', to: '/accountant/ledger', icon: LedgerIcon, description: 'View ledger details' },
      { name: 'Trial Balance', to: '/accountant/trial-balance', icon: TrialBalanceIcon, description: 'Check account balances' },
      { name: 'Financial Statements', to: '/accountant/financial-statements', icon: FinancialStatementsIcon, description: 'Income Statement, Balance Sheet', badge: 'Updated' },
      { name: 'Account Management', to: '/accountant/account-management', icon: BuildingOfficeIcon, description: 'Manage accounts' },
      { name: 'Reconciliation', to: '/accountant/reconciliation', icon: ReconciliationIcon, description: 'Bank & cash reconciliation' },
      { name: 'Tax Reports', to: '/accountant/tax-reports', icon: TaxReportIcon, description: 'PAYE, SSNIT, Withholding' },
    ],
    access: ['super_admin', 'admin', 'accountant']
  };

  const payrollSection = {
    id: 'payroll',
    title: 'Payroll',
    icon: PayrollIcon,
    color: 'blue',
    isCollapsible: true,
    isExpanded: expandedSections.payroll,
    onToggle: () => toggleSection('payroll'),
    items: [
      { name: 'Dashboard', to: '/payroll/dashboard', icon: HomeIcon, description: 'Payroll overview' },
      { name: 'Employees', to: '/payroll/employees', icon: EmployeeIcon, description: 'Manage employees' },
      { name: 'Add Employee', to: '/payroll/employees/new', icon: PlusIcon, description: 'Create new employee' },
      { name: 'Process Payroll', to: '/payroll/process', icon: CalculatorIcon, description: 'Run payroll calculation', badge: 'New' },
      { name: 'Payroll Runs', to: '/payroll/runs', icon: DocumentDuplicateIcon, description: 'View payroll history' },
      { name: 'Payslips', to: '/payroll/payslips', icon: PayslipIcon, description: 'View and download payslips' },
      { name: 'Deduction Types', to: '/payroll/deduction-types', icon: DeductionIcon, description: 'Manage deductions' },
      { name: 'Tax Tables', to: '/payroll/tax-tables', icon: TaxIcon, description: 'Configure tax brackets' },
    ],
    access: ['super_admin', 'admin', 'treasurer', 'accountant']
  };

  const leaveSection = {
    id: 'leave',
    title: 'Leave Management',
    icon: LeaveIcon,
    color: 'purple',
    isCollapsible: true,
    isExpanded: expandedSections.leave,
    onToggle: () => toggleSection('leave'),
    items: [
      { name: 'Leave Requests', to: '/leave/requests', icon: DocumentCheckIcon, description: 'View all requests' },
      { name: 'New Request', to: '/leave/requests/new', icon: PlusIcon, description: 'Create leave request' },
      { name: 'Leave Balances', to: '/leave/balances', icon: LeaveBalanceIcon, description: 'Employee balances' },
      { name: 'Leave Calendar', to: '/leave/calendar', icon: LeaveCalendarIcon, description: 'Calendar view' },
    ],
    access: ['super_admin', 'admin', 'treasurer', 'accountant', 'pastor']
  };

  const reportsSection = {
    id: 'reports',
    title: 'Reports',
    icon: DocumentTextIcon,
    color: 'orange',
    isCollapsible: true,
    isExpanded: expandedSections.reports,
    onToggle: () => toggleSection('reports'),
    items: [
      { name: 'Financial Reports', to: '/reports/financial', icon: PresentationChartBarIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Income Statement', to: '/reports/financial?type=income-statement', icon: ArrowTrendingUpIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Balance Sheet', to: '/reports/financial?type=balance-sheet', icon: ScaleIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Cash Flow', to: '/reports/financial?type=cash-flow', icon: CurrencyDollarIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Receipt & Payment', to: '/reports/financial?type=receipt-payment', icon: BanknotesIcon, permission: PERMISSIONS.VIEW_REPORTS, badge: 'New' },
      { name: 'Trial Balance', to: '/reports/financial?type=trial-balance', icon: ScaleIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Tax Reports', to: '/reports/tax', icon: ReceiptPercentIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Payroll Summary', to: '/reports/payroll', icon: ChartBarIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Tax Summary', to: '/reports/tax-summary', icon: ReceiptPercentIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Employee Earnings', to: '/reports/employee-earnings', icon: DocumentArrowDownIcon, permission: PERMISSIONS.VIEW_REPORTS },
      { name: 'Saved Reports', to: '/reports/saved', icon: BookOpenIcon, permission: PERMISSIONS.VIEW_REPORTS },
    ],
    access: ['super_admin', 'admin', 'treasurer', 'accountant', 'auditor', 'finance_committee']
  };

  const navigationSections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: HomeIcon,
      color: 'gray',
      items: [{ name: 'Main Dashboard', to: '/dashboard', icon: HomeIcon, show: true }],
      access: ['super_admin', 'admin', 'treasurer', 'accountant', 'auditor', 'pastor', 'finance_committee', 'user']
    },
    accountingSection,
    payrollSection,
    leaveSection,
    {
      id: 'financial',
      title: 'Financial',
      icon: CurrencyDollarIcon,
      color: 'green',
      isCollapsible: true,
      isExpanded: expandedSections.financial,
      onToggle: () => toggleSection('financial'),
      items: [
        { name: 'Income', to: '/income', icon: ArrowTrendingUpIcon, permission: PERMISSIONS.VIEW_INCOME },
        { name: 'Add Income', to: '/income/add', icon: PlusIcon, permission: PERMISSIONS.CREATE_INCOME },
        { name: 'Expenses', to: '/expenses', icon: ArrowTrendingDownIcon, permission: PERMISSIONS.VIEW_EXPENSES },
        { name: 'Add Expense', to: '/expenses/add', icon: PlusIcon, permission: PERMISSIONS.CREATE_EXPENSE },
        { name: 'Donations', to: '/donations', icon: HeartIcon, permission: PERMISSIONS.VIEW_INCOME },
        { name: 'Donation Summary', to: '/donations/summary', icon: ChartBarIcon, permission: PERMISSIONS.VIEW_REPORTS },
      ],
      access: ['super_admin', 'admin', 'treasurer', 'accountant', 'finance_committee']
    },
    {
      id: 'management',
      title: 'Management',
      icon: UsersIcon,
      color: 'blue',
      isCollapsible: true,
      isExpanded: expandedSections.management,
      onToggle: () => toggleSection('management'),
      items: [
        { name: 'Members', to: '/members', icon: UserGroupIcon, permission: PERMISSIONS.VIEW_MEMBERS },
        { name: 'Add Member', to: '/members/add', icon: PlusIcon, permission: PERMISSIONS.CREATE_MEMBER },
        { name: 'Member Giving', to: '/members/giving', icon: HeartIcon, permission: PERMISSIONS.VIEW_MEMBERS },
        { name: 'Budgets', to: '/budgets', icon: ChartBarIcon, permission: PERMISSIONS.VIEW_BUDGET },
        { name: 'Create Budget', to: '/budgets/add', icon: PlusIcon, permission: PERMISSIONS.CREATE_BUDGET },
      ],
      access: ['super_admin', 'admin', 'treasurer', 'finance_committee', 'pastor']
    },
    reportsSection,
    {
  id: 'treasurer',
  title: 'Treasurer',
  icon: ShieldCheckIcon,
  color: 'yellow',
  isCollapsible: true,
  isExpanded: expandedSections.treasurer,
  onToggle: () => toggleSection('treasurer'),
  items: [
    { 
      name: 'Dashboard', 
      to: '/treasurer/dashboard', 
      icon: HomeIcon, 
      description: 'Overview of treasury activities' 
    },
    { 
      name: 'Payroll Dashboard', 
      to: '/payroll/dashboard', 
      icon: PayrollIcon, 
      description: 'Payroll overview and management' 
    },
    { 
      name: 'Transaction Approvals', 
      to: '/treasurer/transaction-approvals', 
      icon: CheckBadgeIcon, 
      description: 'Review and approve transactions' 
    },
    { 
      name: 'Budget Management', 
      to: '/treasurer/budgets', 
      icon: ChartBarIcon, 
      description: 'View and manage all budgets' 
    },
    { 
      name: 'Create Budget', 
      to: '/treasurer/budgets/create', 
      icon: PlusIcon, 
      description: 'Create new revenue or expense budget' 
    },
    { 
      name: 'Budget Variance Report', 
      to: '/treasurer/budget-variance', 
      icon: PresentationChartBarIcon, 
      description: 'Analyze budget vs actual performance',
      badge: 'New' 
    },
    { 
      name: 'Financial Statements', 
      to: '/accountant/financial-statements', 
      icon: FinancialStatementsIcon, 
      description: 'View income statement and balance sheet' 
    },
  ],
  access: ['super_admin', 'admin', 'treasurer']
    },
    {
      id: 'auditor',
      title: 'Audit',
      icon: ShieldCheckIcon,
      color: 'red',
      isCollapsible: true,
      isExpanded: expandedSections.auditor,
      onToggle: () => toggleSection('auditor'),
      items: [
        { name: 'Dashboard', to: '/auditor/dashboard', icon: HomeIcon },
        { name: 'Audit Review', to: '/auditor/review', icon: MagnifyingGlassIcon },
        { name: 'Payroll Audit', to: '/payroll/runs', icon: PayrollIcon },
        { name: 'Journal Audit', to: '/accountant/journal-entries', icon: JournalIcon },
        { name: 'Audit Reports', to: '/auditor/reports', icon: DocumentTextIcon },
        { name: 'Compliance Check', to: '/auditor/compliance', icon: CheckCircleIcon },
      ],
      access: ['super_admin', 'admin', 'auditor']
    },
    {
      id: 'pastor',
      title: 'Pastoral',
      icon: HeartIcon,
      color: 'pink',
      isCollapsible: true,
      isExpanded: expandedSections.pastor,
      onToggle: () => toggleSection('pastor'),
      items: [
        { name: 'Dashboard', to: '/pastor/dashboard', icon: HomeIcon },
        { name: 'Leave Requests', to: '/leave/requests', icon: DocumentCheckIcon },
        { name: 'Budget Approvals', to: '/pastor/budget-approvals', icon: ClipboardDocumentListIcon },
        { name: 'Active Budgets', to: '/pastor/active-budgets', icon: ChartBarIcon },
        { name: 'Financial Summary', to: '/reports/financial', icon: PresentationChartBarIcon },
        { name: 'Ministry Reports', to: '/pastor/ministry-reports', icon: ChartBarIcon },
        { name: 'Expense Approvals', to: '/pastor/expense-approvals', icon: ClipboardDocumentListIcon },
        { name: 'Member Giving', to: '/pastor/member-giving', icon: HeartIcon },
      ],
      access: ['super_admin', 'admin', 'pastor']
    },
    {
      id: 'committee',
      title: 'Finance Committee',
      icon: UserGroupIcon,
      color: 'indigo',
      isCollapsible: true,
      isExpanded: expandedSections.committee,
      onToggle: () => toggleSection('committee'),
      items: [
        { name: 'Dashboard', to: '/committee/dashboard', icon: HomeIcon },
        { name: 'Budget Review', to: '/committee/budget-review', icon: ChartBarIcon },
        { name: 'Payroll Overview', to: '/payroll/dashboard', icon: PayrollIcon },
        { name: 'Financial Statements', to: '/accountant/financial-statements', icon: FinancialStatementsIcon },
        { name: 'Financial Review', to: '/committee/financial-review', icon: DocumentTextIcon },
        { name: 'Committee Voting', to: '/committee/voting', icon: HandRaisedIcon },
      ],
      access: ['super_admin', 'admin', 'finance_committee']
    },
    {
      id: 'admin',
      title: 'Administration',
      icon: Cog6ToothIcon,
      color: 'gray',
      isCollapsible: true,
      isExpanded: expandedSections.admin,
      onToggle: () => toggleSection('admin'),
      items: [
        { name: 'User Management', to: '/admin/users', icon: UserGroupIcon },
        { name: 'Church Management', to: '/admin/churches', icon: BuildingLibraryIcon },
        { name: 'Payroll Settings', to: '/payroll/tax-tables', icon: Cog6ToothIcon },
        { name: 'Chart of Accounts', to: '/accountant/chart-of-accounts', icon: ChartOfAccountsIcon },
        { name: 'Audit Logs', to: '/admin/audit-logs', icon: ShieldCheckIcon },
        { name: 'Role Permissions', to: '/admin/role-permissions', icon: ShieldCheckIcon },
        { name: 'System Settings', to: '/admin/system-settings', icon: Cog6ToothIcon },
        { name: 'Church Settings', to: '/admin/church-settings', icon: BuildingOfficeIcon },
        { name: 'Approval Workflows', to: '/admin/approval-workflows', icon: ArrowPathIcon },
      ],
      access: ['super_admin', 'admin']
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Cog6ToothIcon,
      color: 'gray',
      isCollapsible: true,
      isExpanded: expandedSections.settings,
      onToggle: () => toggleSection('settings'),
      items: [
        { name: 'Profile', to: '/profile', icon: UserGroupIcon, show: true },
        { name: 'Account Settings', to: '/settings', icon: Cog6ToothIcon, show: true },
        { name: 'Notifications', to: '/settings/notifications', icon: BellIcon, show: true },
      ],
      access: ['super_admin', 'admin', 'treasurer', 'accountant', 'auditor', 'pastor', 'finance_committee', 'user']
    },
  ];

  const visibleSections = navigationSections.filter(section => {
    if (!user) return false;
    return section.access.includes(user.role);
  });

  const shouldShowItem = (item) => {
    if (item.show) return true;
    if (item.permission) return can(item.permission);
    return true;
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gradient-to-b from-gray-900 to-gray-800">
          {/* Logo Area */}
          <div className="flex items-center h-16 flex-shrink-0 px-6 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] flex items-center justify-center">
                <img 
                  src={logo}
                  alt="Logo" 
                  className="h-6 w-auto object-contain"
                />
              </div>
              <span className="text-white text-lg font-bold tracking-tight">Zimm Finance</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <nav className="flex-1 px-3 py-4 space-y-6">
              {visibleSections.map((section) => {
                const visibleItems = section.items.filter(shouldShowItem);
                if (visibleItems.length === 0) return null;

                return (
                  <div key={section.id} className="space-y-2">
                    {/* Section Header */}
                    <button
                      onClick={section.isCollapsible ? section.onToggle : null}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-1.5 rounded-lg bg-gray-700/50 group-hover:bg-gray-600 transition-colors`}>
                          <section.icon className={`h-4 w-4 text-${section.color || 'gray'}-400`} />
                        </div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {section.title}
                        </span>
                      </div>
                      {section.isCollapsible && (
                        <motion.div
                          animate={{ rotate: section.isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDownIcon className="h-3.5 w-3.5 text-gray-500" />
                        </motion.div>
                      )}
                    </button>

                    {/* Section Items */}
                    {section.isCollapsible ? (
                      <AnimatePresence initial={false}>
                        {section.isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-1 pl-4">
                              {visibleItems.map((item) => (
                                <NavLink
                                  key={item.name}
                                  to={item.to}
                                  onMouseEnter={() => setHoveredItem(item.name)}
                                  onMouseLeave={() => setHoveredItem(null)}
                                  className={({ isActive }) =>
                                    `relative group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                                      isActive
                                        ? 'bg-gradient-to-r from-[rgb(31,178,86)]/20 to-[rgb(25,142,69)]/20 text-[rgb(31,178,86)] border-l-4 border-[rgb(31,178,86)]'
                                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                    }`
                                  }
                                >
                                  <item.icon
                                    className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                                      location.pathname === item.to ? 'text-[rgb(31,178,86)]' : 'text-gray-400 group-hover:text-gray-300'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span className="flex-1 truncate">{item.name}</span>
                                  {item.badge && (
                                    <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-[rgb(31,178,86)] text-white rounded-full animate-pulse">
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.description && hoveredItem === item.name && (
                                    <motion.div
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg"
                                    >
                                      {item.description}
                                    </motion.div>
                                  )}
                                </NavLink>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ) : (
                      <div className="space-y-1 pl-4">
                        {visibleItems.map((item) => (
                          <NavLink
                            key={item.name}
                            to={item.to}
                            className={({ isActive }) =>
                              `group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                                isActive
                                  ? 'bg-gradient-to-r from-[rgb(31,178,86)]/20 to-[rgb(25,142,69)]/20 text-[rgb(31,178,86)] border-l-4 border-[rgb(31,178,86)]'
                                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                              }`
                            }
                          >
                            <item.icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                            <span className="flex-1 truncate">{item.name}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* User Profile */}
          <div className="flex-shrink-0 p-4 bg-gray-800/50 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] flex items-center justify-center text-white font-bold shadow-lg">
                  {getUserInitials()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.fullName || user?.firstName || user?.email}
                </p>
                <p className="text-xs font-medium text-gray-400 truncate capitalize">
                  {getUserRoleDisplay()}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}