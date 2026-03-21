import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';

// Main Pages
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Income Pages
import IncomeList from './pages/Income/IncomeList';
import AddIncome from './pages/Income/AddIncome';
import EditIncome from './pages/Income/EditIncome';
import IncomeDetails from './pages/Income/IncomeDetails';

// Expense Pages
import ExpenseList from './pages/Expenses/ExpenseList';
import AddExpense from './pages/Expenses/AddExpense';
import EditExpense from './pages/Expenses/EditExpense';
import ExpenseDetails from './pages/Expenses/ExpenseDetails';

// Member Pages
import MemberList from './pages/Members/MemberList';
import AddMember from './pages/Members/AddMember';
import EditMember from './pages/Members/EditMember';
import MemberDetails from './pages/Members/MemberDetails';
import MemberGiving from './pages/Members/MemberGiving';

// Donation Pages
import DonationList from './pages/Donations/DonationList';
import AddDonation from './pages/Donations/AddDonation';
import DonationSummary from './pages/Donations/DonationSummary';

// Report Pages
import FinancialReports from './pages/Reports/FinancialReports';
import TaxReports from './pages/Reports/TaxReports';
import SavedReports from './pages/Reports/SavedReports';
import ReportViewer from './pages/Reports/ReportViewer';

// Accountant Pages
import AccountantDashboard from './pages/Accountant/AccountantDashboard';
import JournalEntries from './pages/Accountant/JournalEntries';
import AddJournalEntry from './pages/Accountant/AddJournalEntry';
import PendingApprovals from './pages/Accountant/PendingApprovals';
import LedgerView from './pages/Accountant/LedgerView';
import TrialBalance from './pages/Accountant/TrialBalance';
import FinancialStatements from './pages/Accountant/FinancialStatements';
import AccountManagement from './pages/Accountant/AccountManagement';
import Reconciliation from './pages/Accountant/Reconciliation';
import TaxReportsAccountant from './pages/Accountant/TaxReports';

// NEW: Chart of Accounts Components
import ChartOfAccounts from './pages/Accountant/ChartOfAccounts';
import ChartOfAccountsForm from './pages/Accountant/ChartOfAccountsForm';
import ChartOfAccountsView from './pages/Accountant/ChartOfAccountsView';

// Auditor Pages
import AuditorDashboard from './pages/Auditor/AuditorDashboard';
import AuditReview from './pages/Auditor/AuditReview';
import AuditReports from './pages/Auditor/AuditReports';
import ComplianceCheck from './pages/Auditor/ComplianceCheck';

// Pastor Pages
import PastorDashboard from './pages/Pastor/PastorDashboard';
import MinistryReports from './pages/Pastor/MinistryReports';
import ExpenseApprovals from './pages/Pastor/ExpenseApprovals';
import MemberGivingPastor from './pages/Pastor/MemberGiving';
import BudgetApprovals from './pages/Pastor/BudgetApprovals';
import ActiveBudgets from './pages/Pastor/ActiveBudgets';
import BudgetDetails from './pages/Budgets/BudgetDetails';

// Treasurer Pages
import TreasurerDashboard from './pages/Treasurer/TreasurerDashboard';
import TransactionApprovals from './pages/Treasurer/TransactionApprovals';
import ExpenseApprovalsTreasurer from './pages/Treasurer/ExpenseApprovals';
import CashFlow from './pages/Treasurer/CashFlow';
import FinancialOverview from './pages/Treasurer/FinancialOverview';

// Budget Management for Treasurer
import BudgetList from './pages/Treasurer/BudgetList';
import BudgetForm from './pages/Treasurer/BudgetForm';
import BudgetDetail from './pages/Treasurer/BudgetDetail';

// Finance Committee Pages
import CommitteeDashboard from './pages/FinanceCommittee/CommitteeDashboard';
import BudgetReview from './pages/FinanceCommittee/BudgetReview';
import FinancialReview from './pages/FinanceCommittee/FinancialReview';
import CommitteeVoting from './pages/FinanceCommittee/CommitteeVoting';

// Admin Pages
import UserManagementPage from './pages/Admin/UserManagementPage';
import AuditLogsPage from './pages/Admin/AuditLogsPage';
import SystemSettings from './pages/Admin/SystemSettings';
import RolePermissions from './pages/Admin/RolePermissions';
import ChurchSettings from './pages/Admin/ChurchSettings';
import ChurchManagement from './pages/Admin/ChurchManagement';
import ApprovalWorkflows from './pages/Admin/ApprovalWorkflows';

// ========== PAYROLL PAGES ==========
import PayrollDashboard from './pages/Payroll/PayrollDashboard';
import EmployeeList from './pages/Payroll/EmployeeList';
import EmployeeForm from './pages/Payroll/EmployeeForm';
import EmployeeDetails from './pages/Payroll/EmployeeDetails';
import PayrollProcess from './pages/Payroll/PayrollProcess';
import PayrollRunList from './pages/Payroll/PayrollRunList';
import PayrollRunDetails from './pages/Payroll/PayrollRunDetails';
import PayslipList from './pages/Payroll/PayslipList';
import PayslipView from './pages/Payroll/PayslipView';
import DeductionTypes from './pages/Payroll/DeductionTypes';
import DeductionTypeForm from './pages/Payroll/DeductionTypeForm';
import TaxTables from './pages/Payroll/TaxTables';
import TaxTableForm from './pages/Payroll/TaxTableForm';

// ========== LEAVE PAGES ==========
import LeaveRequests from './pages/Leave/LeaveRequests';
import LeaveRequestForm from './pages/Leave/LeaveRequestForm';
import LeaveBalances from './pages/Leave/LeaveBalances';
import LeaveCalendar from './pages/Leave/LeaveCalendar';

// ========== PAYROLL REPORTS ==========
import PayrollReports from './pages/Reports/PayrollReports';
import TaxSummary from './pages/Reports/TaxSummary';
import EmployeeEarnings from './pages/Reports/EmployeeEarnings';

// Permission constants
import { ROLES } from './utils/permissions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/*"
                      element={
                        <div className="flex h-screen">
                          <Sidebar />
                          <div className="flex-1 flex flex-col overflow-hidden">
                            <Navbar />
                            <main className="flex-1 overflow-y-auto bg-gray-50">
                              <Routes>
                                {/* Dashboard - accessible to all authenticated users */}
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<Dashboard />} />

                                {/* Income Routes */}
                                <Route path="/income">
                                  <Route index element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <IncomeList />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="add" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <AddIncome />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path=":id" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <IncomeDetails />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="edit/:id" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <EditIncome />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* Expenses Routes */}
                                <Route path="/expenses">
                                  <Route index element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <ExpenseList />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="add" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <AddExpense />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path=":id" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <ExpenseDetails />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="edit/:id" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <EditExpense />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* Members Routes */}
                                <Route path="/members">
                                  <Route index element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.PASTOR]}>
                                      <MemberList />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="add" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                      <AddMember />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path=":id" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.PASTOR]}>
                                      <MemberDetails />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="edit/:id" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                      <EditMember />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path=":id/giving" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.PASTOR]}>
                                      <MemberGiving />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* Donations Routes */}
                                <Route path="/donations">
                                  <Route index element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <DonationList />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="add" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <AddDonation />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="summary" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <DonationSummary />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* Reports Routes */}
                                <Route path="/reports">
                                  <Route index element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <FinancialReports />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="financial" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <FinancialReports />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="tax" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <TaxReports />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="saved" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <SavedReports />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="view/:id" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <ReportViewer />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* Payroll Reports */}
                                  <Route path="payroll" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <PayrollReports />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="tax-summary" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <TaxSummary />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="employee-earnings" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <EmployeeEarnings />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* ========== PAYROLL ROUTES ========== */}
                                <Route path="/payroll">
                                  <Route index element={<Navigate to="/payroll/dashboard" replace />} />
                                  <Route path="dashboard" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <PayrollDashboard />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* Employee Management */}
                                  <Route path="employees">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <EmployeeList />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="new" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <EmployeeForm />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path=":id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <EmployeeDetails />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="edit/:id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <EmployeeForm />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                  
                                  {/* Payroll Processing */}
                                  <Route path="process" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                      <PayrollProcess />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* Payroll Runs */}
                                  <Route path="runs">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <PayrollRunList />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path=":id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <PayrollRunDetails />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                  
                                  {/* Payslips */}
                                  <Route path="payslips">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT, ROLES.PASTOR]}>
                                        <PayslipList />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path=":id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT, ROLES.PASTOR]}>
                                        <PayslipView />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                  
                                  {/* Deduction Types */}
                                  <Route path="deduction-types">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <DeductionTypes />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="new" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <DeductionTypeForm />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="edit/:id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <DeductionTypeForm />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                  
                                  {/* Tax Tables */}
                                  <Route path="tax-tables">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <TaxTables />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="new" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <TaxTableForm />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="edit/:id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.ACCOUNTANT]}>
                                        <TaxTableForm />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                </Route>

                                {/* ========== LEAVE ROUTES ========== */}
                                <Route path="/leave">
                                  <Route index element={<Navigate to="/leave/requests" replace />} />
                                  <Route path="requests">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.PASTOR]}>
                                        <LeaveRequests />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="new" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.PASTOR]}>
                                        <LeaveRequestForm />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                  <Route path="balances" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.PASTOR]}>
                                      <LeaveBalances />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="calendar" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER, ROLES.PASTOR]}>
                                      <LeaveCalendar />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* Profile Route - always accessible */}
                                <Route path="/profile" element={<ProfilePage />} />

                                {/* Settings Routes */}
                                <Route path="/settings">
                                  <Route index element={<SystemSettings />} />
                                  <Route path="notifications" element={<div>Notifications Settings</div>} />
                                  <Route path="security" element={<div>Security Settings</div>} />
                                </Route>

                                {/* ========== ACCOUNTANT ROUTES (UPDATED) ========== */}
                                <Route path="/accountant">
                                  <Route index element={<Navigate to="/accountant/dashboard" replace />} />
                                  <Route path="dashboard" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                      <AccountantDashboard />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* ===== CHART OF ACCOUNTS WITH FULL CRUD ===== */}
                                  <Route path="chart-of-accounts">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                        <ChartOfAccounts />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="new" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                        <ChartOfAccountsForm />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path=":id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                        <ChartOfAccountsView />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="edit/:id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                        <ChartOfAccountsForm />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                  
                                  {/* JOURNAL ENTRIES */}
                                  <Route path="journal-entries">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                        <JournalEntries />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="add" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                        <AddJournalEntry />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="edit/:id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                        <AddJournalEntry />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                  
                                  {/* PENDING APPROVALS */}
                                  <Route path="pending-approvals" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                      <PendingApprovals />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* LEDGER */}
                                  <Route path="ledger" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                      <LedgerView />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* TRIAL BALANCE */}
                                  <Route path="trial-balance" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                      <TrialBalance />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* FINANCIAL STATEMENTS */}
                                  <Route path="financial-statements" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                      <FinancialStatements />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* ACCOUNT MANAGEMENT */}
                                  <Route path="account-management" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                      <AccountManagement />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* RECONCILIATION */}
                                  <Route path="reconciliation" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                      <Reconciliation />
                                    </RoleBasedRoute>
                                  } />
                                  
                                  {/* TAX REPORTS */}
                                  <Route path="tax-reports" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]}>
                                      <TaxReportsAccountant />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* ========== TREASURER ROUTES ========== */}
                                <Route path="/treasurer">
                                  <Route index element={<Navigate to="/treasurer/dashboard" replace />} />
                                  <Route path="dashboard" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                      <TreasurerDashboard />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="budgets">
                                    <Route index element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                        <BudgetList />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="create" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                        <BudgetForm />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path=":id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                        <BudgetDetail />
                                      </RoleBasedRoute>
                                    } />
                                    <Route path="edit/:id" element={
                                      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                        <BudgetForm />
                                      </RoleBasedRoute>
                                    } />
                                  </Route>
                                  <Route path="transaction-approvals" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                      <TransactionApprovals />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="expense-approvals" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                      <ExpenseApprovalsTreasurer />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="cash-flow" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                      <CashFlow />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="financial-overview" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TREASURER]}>
                                      <FinancialOverview />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* ========== AUDITOR ROUTES ========== */}
                                <Route path="/auditor">
                                  <Route index element={<Navigate to="/auditor/dashboard" replace />} />
                                  <Route path="dashboard" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AUDITOR]}>
                                      <AuditorDashboard />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="review" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AUDITOR]}>
                                      <AuditReview />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="reports" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AUDITOR]}>
                                      <AuditReports />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="compliance" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AUDITOR]}>
                                      <ComplianceCheck />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* ========== PASTOR ROUTES ========== */}
                                <Route path="/pastor">
                                  <Route index element={<Navigate to="/pastor/dashboard" replace />} />
                                  <Route path="dashboard" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PASTOR]}>
                                      <PastorDashboard />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="budget-approvals" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PASTOR]}>
                                      <BudgetApprovals />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="budgets/:id" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PASTOR]}>
                                      <BudgetDetails />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="active-budgets" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PASTOR]}>
                                      <ActiveBudgets />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="expense-approvals" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PASTOR]}>
                                      <ExpenseApprovals />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="member-giving" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PASTOR]}>
                                      <MemberGivingPastor />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="ministry-reports" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PASTOR]}>
                                      <MinistryReports />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* ========== FINANCE COMMITTEE ROUTES ========== */}
                                <Route path="/committee">
                                  <Route index element={<Navigate to="/committee/dashboard" replace />} />
                                  <Route path="dashboard" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_COMMITTEE]}>
                                      <CommitteeDashboard />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="budget-review" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_COMMITTEE]}>
                                      <BudgetReview />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="financial-review" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_COMMITTEE]}>
                                      <FinancialReview />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="voting" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_COMMITTEE]}>
                                      <CommitteeVoting />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* ========== ADMIN ROUTES ========== */}
                                <Route path="/admin">
                                  <Route index element={<Navigate to="/admin/users" replace />} />
                                  <Route path="users" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                                      <UserManagementPage />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="churches" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                                      <ChurchManagement />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="audit-logs" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AUDITOR]}>
                                      <AuditLogsPage />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="role-permissions" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                                      <RolePermissions />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="system-settings" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                                      <SystemSettings />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="church-settings" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                                      <ChurchSettings />
                                    </RoleBasedRoute>
                                  } />
                                  <Route path="approval-workflows" element={
                                    <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                                      <ApprovalWorkflows />
                                    </RoleBasedRoute>
                                  } />
                                </Route>

                                {/* 404 Route */}
                                <Route path="*" element={
                                  <div className="min-h-screen flex items-center justify-center px-4">
                                    <div className="text-center">
                                      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                                      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
                                      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                                      <button
                                        onClick={() => window.history.back()}
                                        className="px-6 py-3 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] transition-colors"
                                      >
                                        Go Back
                                      </button>
                                    </div>
                                  </div>
                                } />
                              </Routes>
                            </main>
                            <Footer />
                          </div>
                        </div>
                      }
                    />
                  </Route>
                </Routes>
              </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;