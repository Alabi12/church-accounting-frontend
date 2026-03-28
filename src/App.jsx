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
import JournalEntryView from './pages/Accountant/JournalEntryView';
import PendingApprovals from './pages/Accountant/PendingApprovals';
import LedgerView from './pages/Accountant/LedgerView';
import TrialBalance from './pages/Accountant/TrialBalance';
import FinancialStatements from './pages/Accountant/FinancialStatements';
import AccountManagement from './pages/Accountant/AccountManagement';
import Reconciliation from './pages/Accountant/Reconciliation';
import TaxReportsAccountant from './pages/Accountant/TaxReports';
import StandardChartOfAccountsView from './pages/Accountant/StandardChartOfAccountsView';

// Chart of Accounts Components
import ChartOfAccounts from './pages/Accountant/ChartOfAccounts';
import ChartOfAccountsForm from './pages/Accountant/ChartOfAccountsForm';

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
import BudgetVarianceReport from './pages/Treasurer/BudgetVarianceReport';

// Finance Committee Pages
import CommitteeDashboard from './pages/FinanceCommittee/CommitteeDashboard';
import BudgetReview from './pages/FinanceCommittee/BudgetReview';
import FinancialReview from './pages/FinanceCommittee/FinancialReview';
import CommitteeVoting from './pages/FinanceCommittee/CommitteeVoting';

// ========== ADMIN PAGES ==========
import UserManagementPage from './pages/Admin/UserManagementPage';
import AuditLogsPage from './pages/Admin/AuditLogsPage';
import SystemSettings from './pages/Admin/SystemSettings';
import RolePermissions from './pages/Admin/RolePermissions';
import ChurchSettings from './pages/Admin/ChurchSettings';
import ChurchManagement from './pages/Admin/ChurchManagement';
import ApprovalWorkflows from './pages/Admin/ApprovalWorkflows';
import EmployeeList from './pages/Payroll/EmployeeList';
import EmployeeForm from './pages/Payroll/EmployeeForm';
import EmployeeDetails from './pages/Payroll/EmployeeDetails';

// ========== PAYROLL PAGES (Streamlined Workflow) ==========
import PayrollDashboard from './pages/Payroll/PayrollDashboard';
import PayrollCalculate from './pages/Payroll/PayrollCalculate';
import PayrollRunList from './pages/Payroll/PayrollRunList';
import PayrollRunDetails from './pages/Payroll/PayrollRunDetails';
import PayslipList from './pages/Payroll/PayslipList';
import PayslipView from './pages/Payroll/PayslipView';
import GeneratePayslips from './pages/Payroll/GeneratePayslips';
import EmailPayslips from './pages/Payroll/EmailPayslips';
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
      staleTime: 5 * 60 * 1000,
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
                                {/* Dashboard */}
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<Dashboard />} />

                                {/* Income Routes */}
                                <Route path="/income">
                                  <Route index element={<IncomeList />} />
                                  <Route path="add" element={<AddIncome />} />
                                  <Route path=":id" element={<IncomeDetails />} />
                                  <Route path="edit/:id" element={<EditIncome />} />
                                </Route>

                                {/* Expenses Routes */}
                                <Route path="/expenses">
                                  <Route index element={<ExpenseList />} />
                                  <Route path="add" element={<AddExpense />} />
                                  <Route path=":id" element={<ExpenseDetails />} />
                                  <Route path="edit/:id" element={<EditExpense />} />
                                </Route>

                                {/* Members Routes */}
                                <Route path="/members">
                                  <Route index element={<MemberList />} />
                                  <Route path="add" element={<AddMember />} />
                                  <Route path=":id" element={<MemberDetails />} />
                                  <Route path="edit/:id" element={<EditMember />} />
                                  <Route path=":id/giving" element={<MemberGiving />} />
                                </Route>

                                {/* Donations Routes */}
                                <Route path="/donations">
                                  <Route index element={<DonationList />} />
                                  <Route path="add" element={<AddDonation />} />
                                  <Route path="summary" element={<DonationSummary />} />
                                </Route>

                                {/* Reports Routes */}
                                <Route path="/reports">
                                  <Route index element={<FinancialReports />} />
                                  <Route path="financial" element={<FinancialReports />} />
                                  <Route path="tax" element={<TaxReports />} />
                                  <Route path="saved" element={<SavedReports />} />
                                  <Route path="view/:id" element={<ReportViewer />} />
                                  <Route path="payroll" element={<PayrollReports />} />
                                  <Route path="tax-summary" element={<TaxSummary />} />
                                  <Route path="employee-earnings" element={<EmployeeEarnings />} />
                                </Route>

                                {/* ========== ACCOUNTANT ROUTES ========== */}
                                <Route path="/accountant">
                                  <Route index element={<Navigate to="/accountant/dashboard" replace />} />
                                  <Route path="dashboard" element={<AccountantDashboard />} />
                                  <Route path="standard-chart-of-accounts" element={<StandardChartOfAccountsView />} />
                                  <Route path="chart-of-accounts">
                                    <Route index element={<ChartOfAccounts />} />
                                    <Route path="new" element={<ChartOfAccountsForm />} />
                                    <Route path="edit/:id" element={<ChartOfAccountsForm />} />
                                  </Route>
                                  <Route path="journal-entries">
                                    <Route index element={<JournalEntries />} />
                                    <Route path="add" element={<AddJournalEntry />} />
                                    <Route path="view/:id" element={<JournalEntryView />} />
                                  </Route>
                                  <Route path="pending-approvals" element={<PendingApprovals />} />
                                  <Route path="ledger" element={<LedgerView />} />
                                  <Route path="trial-balance" element={<TrialBalance />} />
                                  <Route path="financial-statements" element={<FinancialStatements />} />
                                  <Route path="account-management" element={<AccountManagement />} />
                                  <Route path="reconciliation" element={<Reconciliation />} />
                                  <Route path="tax-reports" element={<TaxReportsAccountant />} />
                                </Route>

                                {/* ========== PAYROLL ROUTES ========== */}
                                <Route path="/payroll">
                                  <Route index element={<Navigate to="/payroll/dashboard" replace />} />
                                  <Route path="dashboard" element={<PayrollDashboard />} />
                                  
                                  {/* STEP 1: Accountant calculates payroll */}
                                  <Route path="calculate" element={<PayrollCalculate />} />
                                  
                                  {/* Payroll Runs */}
                                  <Route path="runs">
                                    <Route index element={<PayrollRunList />} />
                                    <Route path=":id" element={<PayrollRunDetails />} />
                                  </Route>
                                  
                                  {/* STEP 2: Treasurer approval (same as pending-approval) */}
                                  <Route path="pending-approval" element={<PayrollRunList />} />
                                  
                                  {/* STEP 3: Accountant posts to ledger */}
                                  <Route path="post-journal" element={<PayrollRunList />} />
                                  
                                  {/* Payslip Management */}
                                  <Route path="payslips">
                                    <Route index element={<PayslipList />} />
                                    <Route path=":id" element={<PayslipView />} />
                                  </Route>
                                  <Route path="generate-payslips" element={<GeneratePayslips />} />
                                  <Route path="email-payslips" element={<EmailPayslips />} />
                                  
                                  {/* Settings */}
                                  <Route path="deduction-types">
                                    <Route index element={<DeductionTypes />} />
                                    <Route path="new" element={<DeductionTypeForm />} />
                                    <Route path="edit/:id" element={<DeductionTypeForm />} />
                                  </Route>
                                  <Route path="tax-tables">
                                    <Route index element={<TaxTables />} />
                                    <Route path="new" element={<TaxTableForm />} />
                                    <Route path="edit/:id" element={<TaxTableForm />} />
                                  </Route>
                                </Route>

                                {/* ========== ADMIN ROUTES (Employee Management moved here) ========== */}
                                <Route path="/admin">
                                  <Route index element={<Navigate to="/admin/users" replace />} />
                                  
                                  {/* Employee Management - Moved from Payroll */}
                                  <Route path="employees">
                                    <Route index element={<EmployeeList />} />
                                    <Route path="new" element={<EmployeeForm />} />
                                    <Route path=":id" element={<EmployeeDetails />} />
                                    <Route path="edit/:id" element={<EmployeeForm />} />
                                  </Route>
                                  
                                  {/* User Management */}
                                  <Route path="users" element={<UserManagementPage />} />
                                  <Route path="churches" element={<ChurchManagement />} />
                                  <Route path="audit-logs" element={<AuditLogsPage />} />
                                  <Route path="role-permissions" element={<RolePermissions />} />
                                  <Route path="system-settings" element={<SystemSettings />} />
                                  <Route path="church-settings" element={<ChurchSettings />} />
                                  <Route path="approval-workflows" element={<ApprovalWorkflows />} />
                                </Route>

                                {/* ========== TREASURER ROUTES ========== */}
                                <Route path="/treasurer">
                                  <Route index element={<Navigate to="/treasurer/dashboard" replace />} />
                                  <Route path="dashboard" element={<TreasurerDashboard />} />
                                  <Route path="budgets">
                                    <Route index element={<BudgetList />} />
                                    <Route path="create" element={<BudgetForm />} />
                                    <Route path=":id" element={<BudgetDetail />} />
                                    <Route path="edit/:id" element={<BudgetForm />} />
                                  </Route>
                                  <Route path="budget-variance" element={<BudgetVarianceReport />} />
                                  <Route path="transaction-approvals" element={<TransactionApprovals />} />
                                  <Route path="expense-approvals" element={<ExpenseApprovalsTreasurer />} />
                                  <Route path="cash-flow" element={<CashFlow />} />
                                  <Route path="financial-overview" element={<FinancialOverview />} />
                                </Route>

                                {/* ========== AUDITOR ROUTES ========== */}
                                <Route path="/auditor">
                                  <Route index element={<Navigate to="/auditor/dashboard" replace />} />
                                  <Route path="dashboard" element={<AuditorDashboard />} />
                                  <Route path="review" element={<AuditReview />} />
                                  <Route path="reports" element={<AuditReports />} />
                                  <Route path="compliance" element={<ComplianceCheck />} />
                                </Route>

                                {/* ========== PASTOR ROUTES ========== */}
                                <Route path="/pastor">
                                  <Route index element={<Navigate to="/pastor/dashboard" replace />} />
                                  <Route path="dashboard" element={<PastorDashboard />} />
                                  <Route path="budget-approvals" element={<BudgetApprovals />} />
                                  <Route path="budgets/:id" element={<BudgetDetails />} />
                                  <Route path="active-budgets" element={<ActiveBudgets />} />
                                  <Route path="expense-approvals" element={<ExpenseApprovals />} />
                                  <Route path="member-giving" element={<MemberGivingPastor />} />
                                  <Route path="ministry-reports" element={<MinistryReports />} />
                                </Route>

                                {/* ========== FINANCE COMMITTEE ROUTES ========== */}
                                <Route path="/committee">
                                  <Route index element={<Navigate to="/committee/dashboard" replace />} />
                                  <Route path="dashboard" element={<CommitteeDashboard />} />
                                  <Route path="budget-review" element={<BudgetReview />} />
                                  <Route path="financial-review" element={<FinancialReview />} />
                                  <Route path="voting" element={<CommitteeVoting />} />
                                </Route>

                                {/* ========== LEAVE ROUTES ========== */}
                                <Route path="/leave">
                                  <Route index element={<Navigate to="/leave/requests" replace />} />
                                  <Route path="requests">
                                    <Route index element={<LeaveRequests />} />
                                    <Route path="new" element={<LeaveRequestForm />} />
                                  </Route>
                                  <Route path="balances" element={<LeaveBalances />} />
                                  <Route path="calendar" element={<LeaveCalendar />} />
                                </Route>

                                {/* Profile & Settings */}
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/settings">
                                  <Route index element={<SystemSettings />} />
                                  <Route path="notifications" element={<div>Notifications Settings</div>} />
                                  <Route path="security" element={<div>Security Settings</div>} />
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