// App.jsx - Optimized with Code Splitting
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from "./context/SocketContext";

// Layout Components (keep these synchronous as they're needed immediately)
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Components (keep synchronous for login page)
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleBasedRoute from './components/auth/RoleBasedRoute';

// ========== LAZY LOAD MAIN PAGES ==========
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

// ========== LAZY LOAD INCOME PAGES ==========
const IncomeList = lazy(() => import('./pages/Income/IncomeList'));
const AddIncome = lazy(() => import('./pages/Income/AddIncome'));
const EditIncome = lazy(() => import('./pages/Income/EditIncome'));
const IncomeDetails = lazy(() => import('./pages/Income/IncomeDetails'));

// ========== LAZY LOAD EXPENSE PAGES ==========
const ExpenseList = lazy(() => import('./pages/Expenses/ExpenseList'));
const AddExpense = lazy(() => import('./pages/Expenses/AddExpense'));
const EditExpense = lazy(() => import('./pages/Expenses/EditExpense'));
const ExpenseDetails = lazy(() => import('./pages/Expenses/ExpenseDetails'));

// ========== LAZY LOAD MEMBER PAGES ==========
const MemberList = lazy(() => import('./pages/Members/MemberList'));
const AddMember = lazy(() => import('./pages/Members/AddMember'));
const EditMember = lazy(() => import('./pages/Members/EditMember'));
const MemberDetails = lazy(() => import('./pages/Members/MemberDetails'));
const MemberGiving = lazy(() => import('./pages/Members/MemberGiving'));

// ========== LAZY LOAD DONATION PAGES ==========
const DonationList = lazy(() => import('./pages/Donations/DonationList'));
const AddDonation = lazy(() => import('./pages/Donations/AddDonation'));
const DonationSummary = lazy(() => import('./pages/Donations/DonationSummary'));

// ========== LAZY LOAD REPORT PAGES ==========
const FinancialReports = lazy(() => import('./pages/Reports/FinancialReports'));
const TaxReports = lazy(() => import('./pages/Reports/TaxReports'));
const SavedReports = lazy(() => import('./pages/Reports/SavedReports'));
const ReportViewer = lazy(() => import('./pages/Reports/ReportViewer'));
const PayrollReports = lazy(() => import('./pages/Reports/PayrollReports'));
const TaxSummary = lazy(() => import('./pages/Reports/TaxSummary'));
const EmployeeEarnings = lazy(() => import('./pages/Reports/EmployeeEarnings'));

// ========== LAZY LOAD ACCOUNTANT PAGES ==========
const AccountantDashboard = lazy(() => import('./pages/Accountant/AccountantDashboard'));
const JournalEntries = lazy(() => import('./pages/Accountant/JournalEntries'));
const AddJournalEntry = lazy(() => import('./pages/Accountant/AddJournalEntry'));
const JournalEntryView = lazy(() => import('./pages/Accountant/JournalEntryView'));
const PendingApprovals = lazy(() => import('./pages/Accountant/PendingApprovals'));
const LedgerView = lazy(() => import('./pages/Accountant/LedgerView'));
const TrialBalance = lazy(() => import('./pages/Accountant/TrialBalance'));
const FinancialStatements = lazy(() => import('./pages/Accountant/FinancialStatements'));
const AccountManagement = lazy(() => import('./pages/Accountant/AccountManagement'));
const Reconciliation = lazy(() => import('./pages/Accountant/Reconciliation'));
const TaxReportsAccountant = lazy(() => import('./pages/Accountant/TaxReports'));
const StandardChartOfAccountsView = lazy(() => import('./pages/Accountant/StandardChartOfAccountsView'));
const ChartOfAccounts = lazy(() => import('./pages/Accountant/ChartOfAccounts'));
const ChartOfAccountsForm = lazy(() => import('./pages/Accountant/ChartOfAccountsForm'));

// ========== LAZY LOAD AUDITOR PAGES ==========
const AuditorDashboard = lazy(() => import('./pages/Auditor/AuditorDashboard'));
const AuditReview = lazy(() => import('./pages/Auditor/AuditReview'));
const AuditReports = lazy(() => import('./pages/Auditor/AuditReports'));
const ComplianceCheck = lazy(() => import('./pages/Auditor/ComplianceCheck'));

// ========== LAZY LOAD PASTOR PAGES ==========
const PastorDashboard = lazy(() => import('./pages/Pastor/PastorDashboard'));
const MinistryReports = lazy(() => import('./pages/Pastor/MinistryReports'));
const ExpenseApprovals = lazy(() => import('./pages/Pastor/ExpenseApprovals'));
const MemberGivingPastor = lazy(() => import('./pages/Pastor/MemberGiving'));
const BudgetApprovals = lazy(() => import('./pages/Pastor/BudgetApprovals'));
const ActiveBudgets = lazy(() => import('./pages/Pastor/ActiveBudgets'));
const BudgetDetails = lazy(() => import('./pages/Budgets/BudgetDetails'));

// ========== LAZY LOAD TREASURER PAGES ==========
const TreasurerDashboard = lazy(() => import('./pages/Treasurer/TreasurerDashboard'));
const TransactionApprovals = lazy(() => import('./pages/Treasurer/TransactionApprovals'));
const ExpenseApprovalsTreasurer = lazy(() => import('./pages/Treasurer/ExpenseApprovals'));
const CashFlow = lazy(() => import('./pages/Treasurer/CashFlow'));
const FinancialOverview = lazy(() => import('./pages/Treasurer/FinancialOverview'));
const BudgetList = lazy(() => import('./pages/Treasurer/BudgetList'));
const BudgetForm = lazy(() => import('./pages/Treasurer/BudgetForm'));
const BudgetDetail = lazy(() => import('./pages/Treasurer/BudgetDetail'));
const BudgetVarianceReport = lazy(() => import('./pages/Treasurer/BudgetVarianceReport'));

// ========== LAZY LOAD FINANCE COMMITTEE PAGES ==========
const CommitteeDashboard = lazy(() => import('./pages/FinanceCommittee/CommitteeDashboard'));
const BudgetReview = lazy(() => import('./pages/FinanceCommittee/BudgetReview'));
const FinancialReview = lazy(() => import('./pages/FinanceCommittee/FinancialReview'));
const CommitteeVoting = lazy(() => import('./pages/FinanceCommittee/CommitteeVoting'));

// ========== LAZY LOAD ADMIN PAGES ==========
const UserManagementPage = lazy(() => import('./pages/Admin/UserManagementPage'));
const AuditLogsPage = lazy(() => import('./pages/Admin/AuditLogsPage'));
const SystemSettings = lazy(() => import('./pages/Admin/SystemSettings'));
const RolePermissions = lazy(() => import('./pages/Admin/RolePermissions'));
const ChurchSettings = lazy(() => import('./pages/Admin/ChurchSettings'));
const ChurchManagement = lazy(() => import('./pages/Admin/ChurchManagement'));
const ApprovalWorkflows = lazy(() => import('./pages/Admin/ApprovalWorkflows'));
const EmployeeList = lazy(() => import('./pages/Payroll/EmployeeList'));
const EmployeeForm = lazy(() => import('./pages/Payroll/EmployeeForm'));
const EmployeeDetails = lazy(() => import('./pages/Payroll/EmployeeDetails'));

// ========== LAZY LOAD PAYROLL PAGES ==========
const PayrollDashboard = lazy(() => import('./pages/Payroll/PayrollDashboard'));
const PayrollCalculate = lazy(() => import('./pages/Payroll/PayrollCalculate'));
const PayrollRunList = lazy(() => import('./pages/Payroll/PayrollRunList'));
const PayrollRunDetails = lazy(() => import('./pages/Payroll/PayrollRunDetails'));
const PayslipList = lazy(() => import('./pages/Payroll/PayslipList'));
const PayslipView = lazy(() => import('./pages/Payroll/PayslipView'));
const GeneratePayslips = lazy(() => import('./pages/Payroll/GeneratePayslips'));
const EmailPayslips = lazy(() => import('./pages/Payroll/EmailPayslips'));
const DeductionTypes = lazy(() => import('./pages/Payroll/DeductionTypes'));
const DeductionTypeForm = lazy(() => import('./pages/Payroll/DeductionTypeForm'));
const TaxTables = lazy(() => import('./pages/Payroll/TaxTables'));
const TaxTableForm = lazy(() => import('./pages/Payroll/TaxTableForm'));

// ========== LAZY LOAD LEAVE PAGES ==========
const LeaveManagement = lazy(() => import('./pages/Leave/LeaveManagement'));
const LeaveRequests = lazy(() => import('./pages/Leave/LeaveRequests'));
const LeaveRequestForm = lazy(() => import('./pages/Leave/LeaveRequestForm'));
const LeaveRequestDetails = lazy(() => import('./pages/Leave/LeaveRequestDetails'));
const LeaveBalances = lazy(() => import('./pages/Leave/LeaveBalances'));
const LeaveCalendar = lazy(() => import('./pages/Leave/LeaveCalendar'));

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

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner />
  </div>
);

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
                  {/* Public Routes (keep synchronous for faster initial load) */}
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
                              <Suspense fallback={<PageLoader />}>
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
                                    <Route path="calculate" element={<PayrollCalculate />} />
                                    <Route path="runs">
                                      <Route index element={<PayrollRunList />} />
                                      <Route path=":id" element={<PayrollRunDetails />} />
                                    </Route>
                                    <Route path="pending-approval" element={<PayrollRunList />} />
                                    <Route path="post-journal" element={<PayrollRunList />} />
                                    <Route path="payslips">
                                      <Route index element={<PayslipList />} />
                                      <Route path=":id" element={<PayslipView />} />
                                    </Route>
                                    <Route path="generate-payslips" element={<GeneratePayslips />} />
                                    <Route path="email-payslips" element={<EmailPayslips />} />
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

                                  {/* ========== LEAVE MANAGEMENT ROUTES ========== */}
                                  <Route path="/leave">
                                    <Route index element={<Navigate to="/leave/management" replace />} />
                                    <Route path="management" element={<LeaveManagement />} />
                                    <Route path="requests">
                                      <Route index element={<LeaveRequests />} />
                                      <Route path="new" element={<LeaveRequestForm />} />
                                      <Route path=":id" element={<LeaveRequestDetails />} />
                                    </Route>
                                    <Route path="balances" element={<LeaveBalances />} />
                                    <Route path="calendar" element={<LeaveCalendar />} />
                                  </Route>

                                  {/* ========== ADMIN ROUTES ========== */}
                                  <Route path="/admin">
                                    <Route index element={<Navigate to="/admin/users" replace />} />
                                    <Route path="employees">
                                      <Route index element={<EmployeeList />} />
                                      <Route path="new" element={<EmployeeForm />} />
                                      <Route path=":id" element={<EmployeeDetails />} />
                                      <Route path="edit/:id" element={<EmployeeForm />} />
                                    </Route>
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
                              </Suspense>
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