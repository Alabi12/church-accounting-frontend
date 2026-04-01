// pages/Accountant/FinancialStatements.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CreditCardIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const FinancialStatements = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeStatement, setActiveStatement] = useState('incomeStatement');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    asAt: new Date().toISOString().split('T')[0]
  });
  const [statementData, setStatementData] = useState(null);
  const [budgetComparison, setBudgetComparison] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  const statements = [
    { id: 'trialBalance', name: 'Trial Balance', icon: ScaleIcon, color: 'purple' },
    { id: 'incomeStatement', name: 'Income & Expenditure', icon: ArrowTrendingUpIcon, color: 'green' },
    { id: 'balanceSheet', name: 'Balance Sheet', icon: BanknotesIcon, color: 'blue' },
    { id: 'receiptPayment', name: 'Receipt & Payment', icon: CreditCardIcon, color: 'orange' },
    { id: 'cashFlow', name: 'Cash Flow Statement', icon: CurrencyDollarIcon, color: 'cyan' },
  ];

  useEffect(() => {
    fetchStatementData();
  }, [activeStatement, dateRange]);

  const fetchStatementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      switch (activeStatement) {
        case 'trialBalance':
          data = await accountantService.getTrialBalance(dateRange.asAt);
          break;
        case 'incomeStatement':
          data = await accountantService.getIncomeStatement(dateRange.startDate, dateRange.endDate);
          await fetchBudgetComparison();
          break;
        case 'balanceSheet':
          data = await accountantService.getBalanceSheet(dateRange.asAt);
          break;
        case 'receiptPayment':
          data = await accountantService.getReceiptPaymentAccount(dateRange.startDate, dateRange.endDate);
          break;
        case 'cashFlow':
          data = await accountantService.getCashFlowStatement(dateRange.startDate, dateRange.endDate);
          break;
        default:
          return;
      }
      
      console.log(`📊 ${activeStatement} data:`, data);
      setStatementData(data);
    } catch (error) {
      console.error('Error fetching statement:', error);
      setError('Failed to load financial statement');
      toast.error('Failed to load financial statement');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetComparison = async () => {
    try {
      setBudgetLoading(true);
      const data = await accountantService.getFinancialStatementsWithBudget(
        dateRange.startDate, 
        dateRange.endDate
      );
      setBudgetComparison(data.budget_comparison);
    } catch (error) {
      console.warn('Could not fetch budget comparison:', error);
      setBudgetComparison(null);
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    if (!statementData) {
      toast.error('No data to export');
      return;
    }
    
    try {
      setExporting(true);
      
      let response;
      let fileName;
      
      switch (activeStatement) {
        case 'incomeStatement':
          response = await accountantService.exportIncomeStatement(
            dateRange.startDate, 
            dateRange.endDate, 
            format
          );
          fileName = `income_statement_${dateRange.startDate}_to_${dateRange.endDate}.${format}`;
          break;
        case 'balanceSheet':
          response = await accountantService.exportBalanceSheet(
            dateRange.asAt, 
            format
          );
          fileName = `balance_sheet_as_at_${dateRange.asAt}.${format}`;
          break;
        case 'trialBalance':
          response = await accountantService.exportTrialBalance(
            dateRange.asAt, 
            format
          );
          fileName = `trial_balance_as_at_${dateRange.asAt}.${format}`;
          break;
        case 'receiptPayment':
          response = await accountantService.exportReceiptPayment(
            dateRange.startDate, 
            dateRange.endDate, 
            format
          );
          fileName = `receipt_payment_${dateRange.startDate}_to_${dateRange.endDate}.${format}`;
          break;
        case 'cashFlow':
          response = await accountantService.exportCashFlow(
            dateRange.startDate, 
            dateRange.endDate, 
            format
          );
          fileName = `cash_flow_${dateRange.startDate}_to_${dateRange.endDate}.${format}`;
          break;
        default:
          toast('Export not available for this statement');
          setExporting(false);
          return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export statement');
    } finally {
      setExporting(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const BudgetVarianceCard = () => {
    if (!budgetComparison) {
      return (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center mb-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No budget data available for this period</p>
          <p className="text-xs text-gray-400 mt-1">Please ensure budgets are created and approved</p>
        </div>
      );
    }

    const { revenue, expenses, net } = budgetComparison;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget vs Actual Variance Analysis</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Favorable ↑</span>
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Unfavorable ↓</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-gray-700">Revenue</h4>
              </div>
              {revenue.favorable ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Budgeted</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(revenue.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Actual</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(revenue.actual)}</p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-600">Variance</p>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${revenue.favorable ? 'text-green-600' : 'text-red-600'}`}>
                      {revenue.variance >= 0 ? '+' : ''}{formatCurrency(revenue.variance)}
                    </p>
                    <p className={`text-xs ${revenue.favorable ? 'text-green-500' : 'text-red-500'}`}>
                      ({revenue.variance_percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-gray-700">Expenses</h4>
              </div>
              {expenses.favorable ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Budgeted</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(expenses.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Actual</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(expenses.actual)}</p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-600">Variance</p>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${expenses.favorable ? 'text-green-600' : 'text-red-600'}`}>
                      {expenses.variance >= 0 ? '+' : ''}{formatCurrency(expenses.variance)}
                    </p>
                    <p className={`text-xs ${expenses.favorable ? 'text-green-500' : 'text-red-500'}`}>
                      ({expenses.variance_percentage}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow ${
            net.favorable ? 'border-green-200' : 'border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-gray-700">Net Surplus/(Deficit)</h4>
              </div>
              {net.favorable ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Budgeted</p>
                <p className={`text-xl font-bold ${net.budget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(net.budget)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Actual</p>
                <p className={`text-xl font-bold ${net.actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(net.actual)}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-600">Variance</p>
                  <p className={`text-lg font-bold ${net.favorable ? 'text-green-600' : 'text-red-600'}`}>
                    {net.variance >= 0 ? '+' : ''}{formatCurrency(net.variance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getTypeIcon = (type) => {
    switch(type?.toUpperCase()) {
      case 'ASSET': return <BanknotesIcon className="h-4 w-4 text-blue-600" />;
      case 'LIABILITY': return <BriefcaseIcon className="h-4 w-4 text-orange-600" />;
      case 'EQUITY': return <ScaleIcon className="h-4 w-4 text-purple-600" />;
      case 'REVENUE': return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'EXPENSE': return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
      default: return <DocumentTextIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const renderTrialBalance = () => {
    if (!statementData?.accounts) return null;
    
    const { accounts, totalDebits, totalCredits, isBalanced } = statementData;
    
    const grouped = accounts.reduce((acc, account) => {
      const type = account.type || 'OTHER';
      if (!acc[type]) acc[type] = [];
      acc[type].push(account);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Debits</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDebits)}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Credits</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCredits)}</p>
          </div>
          <div className={`bg-white rounded-lg p-4 border ${isBalanced ? 'border-green-200' : 'border-red-200'}`}>
            <p className="text-sm text-gray-500">Status</p>
            <p className={`text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit (GHS)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit (GHS)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(grouped).map(([type, accountsList]) => (
                <React.Fragment key={type}>
                  <tr className="bg-gray-100">
                    <td colSpan="4" className="px-4 py-2 text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        {getTypeIcon(type)}
                        <span className="ml-2">{type} ACCOUNTS</span>
                      </div>
                    </td>
                  </tr>
                  {accountsList.map((account, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-mono text-gray-600">{account.code}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{account.name}</td>
                      <td className="px-4 py-2 text-sm text-right text-green-600">
                        {account.debit ? formatCurrency(account.debit) : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">
                        {account.credit ? formatCurrency(account.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr className="bg-gray-200 font-bold">
                <td colSpan="2" className="px-4 py-3 text-sm text-right">GRAND TOTAL</td>
                <td className="px-4 py-3 text-sm text-right text-green-700">{formatCurrency(totalDebits)}</td>
                <td className="px-4 py-3 text-sm text-right text-red-700">{formatCurrency(totalCredits)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!statementData) return null;
    
    // Group revenue items by category
    const revenueByCategory = {};
    const revenueItems = statementData.revenue?.items || [];
    
    revenueItems.forEach(item => {
      const category = item.category || 'Other Revenue';
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = {
          total: 0,
          items: []
        };
      }
      revenueByCategory[category].total += item.amount;
      revenueByCategory[category].items.push(item);
    });
    
    // Enhanced expense grouping with staff cost breakdown
    const expenseByCategory = {};
    const expenseItems = statementData.expenses?.items || [];
    
    // Separate staff-related expenses
    let staffCosts = {
      salaries_wages: { total: 0, items: [] },
      ssnit_employer: { total: 0, items: [] },
      tier2_pension: { total: 0, items: [] },
      tier3_pension: { total: 0, items: [] },
      staff_benefits: { total: 0, items: [] },
      training: { total: 0, items: [] },
      other_staff: { total: 0, items: [] }
    };
    
    expenseItems.forEach(item => {
      // Check if this is a staff-related expense
      const isStaffExpense = item.name?.toLowerCase().includes('salary') ||
                            item.name?.toLowerCase().includes('wage') ||
                            item.name?.toLowerCase().includes('ssnit') ||
                            item.name?.toLowerCase().includes('pension') ||
                            item.name?.toLowerCase().includes('staff') ||
                            item.name?.toLowerCase().includes('employee') ||
                            item.name?.toLowerCase().includes('benefit') ||
                            item.name?.toLowerCase().includes('training') ||
                            item.name?.toLowerCase().includes('allowance');
      
      let category = item.category || 'Other Expenses';
      
      // Special handling for staff costs
      if (isStaffExpense) {
        const name = item.name.toLowerCase();
        
        if (name.includes('salary') || name.includes('wage') || name.includes('gross pay')) {
          staffCosts.salaries_wages.total += item.amount;
          staffCosts.salaries_wages.items.push(item);
          category = 'STAFF COSTS - Salaries & Wages';
        } 
        else if (name.includes('ssnit') || name.includes('social security')) {
          staffCosts.ssnit_employer.total += item.amount;
          staffCosts.ssnit_employer.items.push(item);
          category = 'STAFF COSTS - SSNIT (Employer)';
        }
        else if (name.includes('tier 2') || name.includes('tier2')) {
          staffCosts.tier2_pension.total += item.amount;
          staffCosts.tier2_pension.items.push(item);
          category = 'STAFF COSTS - Tier 2 Pension';
        }
        else if (name.includes('tier 3') || name.includes('tier3')) {
          staffCosts.tier3_pension.total += item.amount;
          staffCosts.tier3_pension.items.push(item);
          category = 'STAFF COSTS - Tier 3 Pension';
        }
        else if (name.includes('benefit') || name.includes('allowance') || name.includes('housing') || name.includes('transport')) {
          staffCosts.staff_benefits.total += item.amount;
          staffCosts.staff_benefits.items.push(item);
          category = 'STAFF COSTS - Benefits & Allowances';
        }
        else if (name.includes('training') || name.includes('development')) {
          staffCosts.training.total += item.amount;
          staffCosts.training.items.push(item);
          category = 'STAFF COSTS - Training & Development';
        }
        else {
          staffCosts.other_staff.total += item.amount;
          staffCosts.other_staff.items.push(item);
          category = 'STAFF COSTS - Other Staff Costs';
        }
      }
      
      // Group by category
      if (!expenseByCategory[category]) {
        expenseByCategory[category] = {
          total: 0,
          items: []
        };
      }
      expenseByCategory[category].total += item.amount;
      expenseByCategory[category].items.push(item);
    });
    
    // Calculate total staff costs
    const totalStaffCosts = staffCosts.salaries_wages.total + 
                            staffCosts.ssnit_employer.total + 
                            staffCosts.tier2_pension.total +
                            staffCosts.tier3_pension.total +
                            staffCosts.staff_benefits.total +
                            staffCosts.training.total +
                            staffCosts.other_staff.total;
    
    const totalRevenue = statementData.revenue?.total || 0;
    const totalExpenses = statementData.expenses?.total || 0;
    const netIncome = statementData.net_income || 0;
    
    // Calculate staff cost percentage of total expenses and revenue
    const staffCostPercentageOfExpenses = totalExpenses > 0 ? (totalStaffCosts / totalExpenses * 100).toFixed(1) : 0;
    const staffCostPercentageOfRevenue = totalRevenue > 0 ? (totalStaffCosts / totalRevenue * 100).toFixed(1) : 0;
    
    return (
      <div className="space-y-6">
        {budgetLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="small" />
          </div>
        ) : (
          <BudgetVarianceCard />
        )}
        
        {/* Staff Cost Summary Card */}
        {totalStaffCosts > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Staff Cost Summary</h3>
              </div>
              <span className="text-2xl font-bold text-blue-700">{formatCurrency(totalStaffCosts)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-blue-200">
              <div>
                <p className="text-xs text-gray-600">% of Total Expenses</p>
                <p className="text-lg font-semibold text-blue-600">{staffCostPercentageOfExpenses}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">% of Total Income</p>
                <p className="text-lg font-semibold text-blue-600">{staffCostPercentageOfRevenue}%</p>
              </div>
            </div>
          </div>
        )}
        
        {/* INCOME SECTION */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-green-700">INCOME</h3>
              <span className="text-sm text-green-600">Total: {formatCurrency(totalRevenue)}</span>
            </div>
          </div>
          <div className="p-4">
            {Object.keys(revenueByCategory).length > 0 ? (
              Object.entries(revenueByCategory).map(([category, categoryData]) => (
                <div key={category} className="mb-4">
                  <button
                    onClick={() => toggleCategory(`revenue_${category}`)}
                    className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      {expandedCategories[`revenue_${category}`] ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                      )}
                      <span className="font-semibold text-gray-700">{category}</span>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(categoryData.total)}</span>
                  </button>
                  
                  {expandedCategories[`revenue_${category}`] && (
                    <div className="mt-2 ml-6 space-y-1">
                      {categoryData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100">
                          <div className="flex items-center">
                            <span className="text-xs font-mono text-gray-500 w-16">{item.account_code}</span>
                            <span className="text-sm text-gray-600 ml-2">{item.name}</span>
                          </div>
                          <span className="text-sm text-green-600">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No income transactions for this period</p>
            )}
          </div>
        </div>

        {/* EXPENDITURE SECTION with enhanced staff cost breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-red-700">EXPENDITURE</h3>
              <span className="text-sm text-red-600">Total: {formatCurrency(totalExpenses)}</span>
            </div>
          </div>
          <div className="p-4">
            {/* Staff Costs Section - Always show if there are any staff costs */}
            {totalStaffCosts > 0 && (
              <div className="mb-6 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-bold text-gray-800">STAFF COSTS</h4>
                  </div>
                  <span className="text-lg font-bold text-blue-700">{formatCurrency(totalStaffCosts)}</span>
                </div>
                
                <div className="space-y-2">
                  {/* Salaries & Wages */}
                  {staffCosts.salaries_wages.total > 0 && (
                    <div>
                      <button
                        onClick={() => toggleCategory('staff_salaries')}
                        className="w-full flex items-center justify-between py-2 px-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <div className="flex items-center">
                          {expandedCategories['staff_salaries'] ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700">Salaries & Wages (Gross Pay)</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(staffCosts.salaries_wages.total)}</span>
                      </button>
                      {expandedCategories['staff_salaries'] && (
                        <div className="ml-8 mt-1 space-y-1">
                          {staffCosts.salaries_wages.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 text-sm">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-blue-600">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* SSNIT Employer */}
                  {staffCosts.ssnit_employer.total > 0 && (
                    <div>
                      <button
                        onClick={() => toggleCategory('staff_ssnit')}
                        className="w-full flex items-center justify-between py-2 px-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <div className="flex items-center">
                          {expandedCategories['staff_ssnit'] ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700">SSNIT (Employer Contribution - 13%)</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(staffCosts.ssnit_employer.total)}</span>
                      </button>
                      {expandedCategories['staff_ssnit'] && (
                        <div className="ml-8 mt-1 space-y-1">
                          {staffCosts.ssnit_employer.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 text-sm">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-blue-600">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Tier 2 Pension */}
                  {staffCosts.tier2_pension.total > 0 && (
                    <div>
                      <button
                        onClick={() => toggleCategory('staff_tier2')}
                        className="w-full flex items-center justify-between py-2 px-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <div className="flex items-center">
                          {expandedCategories['staff_tier2'] ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700">Tier 2 Pension (5.5%)</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(staffCosts.tier2_pension.total)}</span>
                      </button>
                      {expandedCategories['staff_tier2'] && (
                        <div className="ml-8 mt-1 space-y-1">
                          {staffCosts.tier2_pension.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 text-sm">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-blue-600">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Tier 3 Pension */}
                  {staffCosts.tier3_pension.total > 0 && (
                    <div>
                      <button
                        onClick={() => toggleCategory('staff_tier3')}
                        className="w-full flex items-center justify-between py-2 px-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <div className="flex items-center">
                          {expandedCategories['staff_tier3'] ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700">Tier 3 Pension (Voluntary)</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(staffCosts.tier3_pension.total)}</span>
                      </button>
                      {expandedCategories['staff_tier3'] && (
                        <div className="ml-8 mt-1 space-y-1">
                          {staffCosts.tier3_pension.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 text-sm">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-blue-600">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Staff Benefits */}
                  {staffCosts.staff_benefits.total > 0 && (
                    <div>
                      <button
                        onClick={() => toggleCategory('staff_benefits')}
                        className="w-full flex items-center justify-between py-2 px-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <div className="flex items-center">
                          {expandedCategories['staff_benefits'] ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700">Benefits & Allowances</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(staffCosts.staff_benefits.total)}</span>
                      </button>
                      {expandedCategories['staff_benefits'] && (
                        <div className="ml-8 mt-1 space-y-1">
                          {staffCosts.staff_benefits.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 text-sm">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-blue-600">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Training & Development */}
                  {staffCosts.training.total > 0 && (
                    <div>
                      <button
                        onClick={() => toggleCategory('staff_training')}
                        className="w-full flex items-center justify-between py-2 px-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <div className="flex items-center">
                          {expandedCategories['staff_training'] ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700">Training & Development</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(staffCosts.training.total)}</span>
                      </button>
                      {expandedCategories['staff_training'] && (
                        <div className="ml-8 mt-1 space-y-1">
                          {staffCosts.training.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 text-sm">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-blue-600">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Other Staff Costs */}
                  {staffCosts.other_staff.total > 0 && (
                    <div>
                      <button
                        onClick={() => toggleCategory('staff_other')}
                        className="w-full flex items-center justify-between py-2 px-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <div className="flex items-center">
                          {expandedCategories['staff_other'] ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                          )}
                          <span className="text-sm font-medium text-gray-700">Other Staff Costs</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(staffCosts.other_staff.total)}</span>
                      </button>
                      {expandedCategories['staff_other'] && (
                        <div className="ml-8 mt-1 space-y-1">
                          {staffCosts.other_staff.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 text-sm">
                              <span className="text-gray-600">{item.name}</span>
                              <span className="text-blue-600">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Other Expenses */}
            {Object.entries(expenseByCategory).map(([category, categoryData]) => {
              // Skip if this is a staff category (already shown above)
              if (category.startsWith('STAFF COSTS')) return null;
              
              return (
                <div key={category} className="mb-4">
                  <button
                    onClick={() => toggleCategory(`expense_${category}`)}
                    className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      {expandedCategories[`expense_${category}`] ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                      )}
                      <span className="font-semibold text-gray-700">{category}</span>
                    </div>
                    <span className="font-bold text-red-600">{formatCurrency(categoryData.total)}</span>
                  </button>
                  
                  {expandedCategories[`expense_${category}`] && (
                    <div className="mt-2 ml-6 space-y-1">
                      {categoryData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100">
                          <div className="flex items-center">
                            <span className="text-xs font-mono text-gray-500 w-16">{item.account_code}</span>
                            <span className="text-sm text-gray-600 ml-2">{item.name}</span>
                          </div>
                          <span className="text-sm text-red-600">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {Object.keys(expenseByCategory).length === 0 && totalStaffCosts === 0 && (
              <p className="text-gray-500 text-center py-4">No expense transactions for this period</p>
            )}
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">TOTAL EXPENDITURE</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NET RESULT */}
        <div className={`bg-white rounded-lg p-4 border ${netIncome >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">NET {netIncome >= 0 ? 'SURPLUS' : 'DEFICIT'}</span>
            <span className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netIncome))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!statementData) return null;
    
    const { assets, liabilities, equity } = statementData;
    const totalLiabilitiesEquity = (liabilities?.total || 0) + (equity?.total || 0);
    
    // Group assets by category
    const assetsByCategory = {};
    const allAssets = [...(assets?.current || []), ...(assets?.fixed || [])];
    allAssets.forEach(asset => {
      const category = asset.category || (asset.is_current ? 'Current Assets' : 'Fixed Assets');
      if (!assetsByCategory[category]) {
        assetsByCategory[category] = {
          total: 0,
          items: []
        };
      }
      assetsByCategory[category].total += asset.amount;
      assetsByCategory[category].items.push(asset);
    });
    
    return (
      <div className="space-y-6">
        {/* ASSETS SECTION */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-700">ASSETS</h3>
          </div>
          <div className="p-4">
            {Object.keys(assetsByCategory).length > 0 ? (
              Object.entries(assetsByCategory).map(([category, categoryData]) => (
                <div key={category} className="mb-4">
                  <button
                    onClick={() => toggleCategory(`asset_${category}`)}
                    className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      {expandedCategories[`asset_${category}`] ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-500 mr-2" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-500 mr-2" />
                      )}
                      <span className="font-semibold text-gray-700">{category}</span>
                    </div>
                    <span className="font-bold text-blue-600">{formatCurrency(categoryData.total)}</span>
                  </button>
                  
                  {expandedCategories[`asset_${category}`] && (
                    <div className="mt-2 ml-6 space-y-1">
                      {categoryData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100">
                          <div className="flex items-center">
                            <span className="text-xs font-mono text-gray-500 w-16">{item.code}</span>
                            <span className="text-sm text-gray-600 ml-2">{item.name}</span>
                          </div>
                          <span className="text-sm text-blue-600">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No assets found</p>
            )}
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">TOTAL ASSETS</span>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(assets?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* LIABILITIES SECTION */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
            <h3 className="text-lg font-semibold text-orange-700">LIABILITIES</h3>
          </div>
          <div className="p-4">
            {liabilities?.items && liabilities.items.length > 0 ? (
              liabilities.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="text-xs font-mono text-gray-500 w-16">{item.code}</span>
                    <span className="text-sm text-gray-600 ml-2">{item.name}</span>
                  </div>
                  <span className="text-sm text-orange-600">{formatCurrency(item.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No liabilities found</p>
            )}
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">TOTAL LIABILITIES</span>
                <span className="text-xl font-bold text-orange-700">{formatCurrency(liabilities?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* EQUITY SECTION */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
            <h3 className="text-lg font-semibold text-purple-700">EQUITY</h3>
          </div>
          <div className="p-4">
            {equity?.items && equity.items.length > 0 ? (
              equity.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="text-xs font-mono text-gray-500 w-16">{item.code}</span>
                    <span className="text-sm text-gray-600 ml-2">{item.name}</span>
                  </div>
                  <span className="text-sm text-purple-600">{formatCurrency(item.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No equity found</p>
            )}
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">TOTAL EQUITY</span>
                <span className="text-xl font-bold text-purple-700">{formatCurrency(equity?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Assets = Liabilities + Equity</span>
            <span className={`text-lg font-bold ${Math.abs(assets?.total - totalLiabilitiesEquity) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(assets?.total || 0)} = {formatCurrency(totalLiabilitiesEquity)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderReceiptPayment = () => {
    if (!statementData) return null;
    
    const { openingBalances, receipts, payments, closingBalances } = statementData;
    
    return (
      <div className="space-y-6">
        {/* Opening Balances */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">OPENING BALANCES</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full">
              <tbody>
                {openingBalances?.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.account_code} - {item.name} (Cash)</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="px-4 py-3 text-sm">TOTAL OPENING BALANCE</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(openingBalances?.total || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipts */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-200">
            <h3 className="text-lg font-semibold text-green-700">RECEIPTS</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Account</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {receipts?.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{item.category || 'General'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.account_code} - {item.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-green-600">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-green-100 font-bold">
                  <td colSpan="2" className="px-4 py-3 text-sm">TOTAL RECEIPTS</td>
                  <td className="px-4 py-3 text-sm text-right text-green-700">{formatCurrency(receipts?.total || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-700">PAYMENTS</h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Account</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {payments?.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{item.category || 'General'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.account_code} - {item.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-red-100 font-bold">
                  <td colSpan="2" className="px-4 py-3 text-sm">TOTAL PAYMENTS</td>
                  <td className="px-4 py-3 text-sm text-right text-red-700">{formatCurrency(payments?.total || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Net Cash Flow</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency((receipts?.total || 0) - (payments?.total || 0))}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-600 mb-1">Closing Balance</p>
            <p className="text-2xl font-bold text-purple-700">
              {formatCurrency(closingBalances?.total || 0)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!statementData) return null;
    
    const { operating, investing, financing, netIncrease, beginningCash, endingCash } = statementData;
    
    return (
      <div className="space-y-6">
        {/* Operating Activities */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-700">CASH FLOW FROM OPERATING ACTIVITIES</h3>
          </div>
          <div className="p-4">
            {operating?.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.description}</span>
                <span className="text-sm text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">Net Cash from Operating Activities</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(operating?.net || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investing Activities */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
            <h3 className="text-lg font-semibold text-purple-700">CASH FLOW FROM INVESTING ACTIVITIES</h3>
          </div>
          <div className="p-4">
            {investing?.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.description}</span>
                <span className="text-sm text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">Net Cash from Investing Activities</span>
                <span className="text-lg font-bold text-purple-600">{formatCurrency(investing?.net || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financing Activities */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
            <h3 className="text-lg font-semibold text-orange-700">CASH FLOW FROM FINANCING ACTIVITIES</h3>
          </div>
          <div className="p-4">
            {financing?.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.description}</span>
                <span className="text-sm text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">Net Cash from Financing Activities</span>
                <span className="text-lg font-bold text-orange-600">{formatCurrency(financing?.net || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Beginning Cash</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(beginningCash || 0)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-600 mb-1">Net Increase/(Decrease)</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(netIncrease || 0)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Ending Cash</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(endingCash || 0)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderStatement = () => {
    switch (activeStatement) {
      case 'trialBalance':
        return renderTrialBalance();
      case 'incomeStatement':
        return renderIncomeStatement();
      case 'balanceSheet':
        return renderBalanceSheet();
      case 'receiptPayment':
        return renderReceiptPayment();
      case 'cashFlow':
        return renderCashFlow();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Statements</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and analyze your church's financial position with detailed staff cost breakdown
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting || !statementData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={fetchStatementData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {statements.map((stmt) => {
              const Icon = stmt.icon;
              return (
                <button
                  key={stmt.id}
                  onClick={() => setActiveStatement(stmt.id)}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    activeStatement === stmt.id
                      ? `bg-${stmt.color}-100 border-2 border-${stmt.color}-300`
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-1 text-${stmt.color}-600`} />
                  <span className={`text-xs font-medium text-${stmt.color}-700`}>
                    {stmt.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeStatement !== 'trialBalance' && activeStatement !== 'balanceSheet' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">As at Date</label>
                <input
                  type="date"
                  value={dateRange.asAt}
                  onChange={(e) => setDateRange({ ...dateRange, asAt: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            )}
            <div className="flex items-end">
              <button
                onClick={fetchStatementData}
                className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] text-sm font-medium"
              >
                Generate Statement
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : statementData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {statements.find(s => s.id === activeStatement)?.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeStatement === 'trialBalance' && `As at ${formatDate(dateRange.asAt)}`}
                {activeStatement === 'balanceSheet' && `As at ${formatDate(dateRange.asAt)}`}
                {(activeStatement === 'incomeStatement' || activeStatement === 'receiptPayment' || activeStatement === 'cashFlow') && 
                  `For the period ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`}
              </p>
            </div>
            {renderStatement()}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default FinancialStatements;