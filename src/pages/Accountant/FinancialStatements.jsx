// pages/Accountant/FinancialStatements.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CreditCardIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const FinancialStatements = () => {
  const [loading, setLoading] = useState(false);
  const [activeStatement, setActiveStatement] = useState('trialBalance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    asAt: new Date().toISOString().split('T')[0]
  });
  const [statementData, setStatementData] = useState(null);
  const [error, setError] = useState(null);

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

  const handleExport = () => {
    // Implement CSV export
    toast.info('Export feature coming soon');
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
    
    // Group accounts by type
    const grouped = accounts.reduce((acc, account) => {
      const type = account.type || 'OTHER';
      if (!acc[type]) acc[type] = [];
      acc[type].push(account);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
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

        {/* Trial Balance Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Account Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Account Name</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Debit (GHS)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Credit (GHS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(grouped).map(([type, accounts]) => (
                <React.Fragment key={type}>
                  {/* Type Header */}
                  <tr className="bg-gray-100">
                    <td colSpan="4" className="px-4 py-2 text-sm font-semibold text-gray-700">
                      <div className="flex items-center">
                        {getTypeIcon(type)}
                        <span className="ml-2">{type} ACCOUNTS</span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Accounts */}
                  {accounts.map((account, idx) => (
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
              
              {/* Grand Total */}
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
    
    const { revenue, expenses, net_income } = statementData;
    
    return (
      <div className="space-y-6">
        {/* Income Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-200">
            <h3 className="text-lg font-semibold text-green-700">INCOME</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-200">
                {Object.entries(revenue?.categories || {}).map(([category, data]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-gray-50">
                      <td colSpan="2" className="px-4 py-2 text-sm font-semibold text-gray-700">
                        {category}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(data.total)}
                      </td>
                    </tr>
                    {data.accounts?.map((account, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-1 text-xs font-mono text-gray-500">{account.code}</td>
                        <td className="px-4 py-1 text-sm text-gray-600">{account.name}</td>
                        <td className="px-4 py-1 text-sm text-right text-green-600">
                          {formatCurrency(account.amount)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                <tr className="bg-green-100 font-bold">
                  <td colSpan="2" className="px-4 py-3 text-sm">TOTAL INCOME</td>
                  <td className="px-4 py-3 text-sm text-right text-green-700">
                    {formatCurrency(revenue?.total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-700">EXPENDITURE</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <tbody className="divide-y divide-gray-200">
                {Object.entries(expenses?.categories || {}).map(([category, data]) => (
                  <React.Fragment key={category}>
                    <tr className="bg-gray-50">
                      <td colSpan="2" className="px-4 py-2 text-sm font-semibold text-gray-700">
                        {category}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-red-600">
                        {formatCurrency(data.total)}
                      </td>
                    </tr>
                    {data.accounts?.map((account, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-1 text-xs font-mono text-gray-500">{account.code}</td>
                        <td className="px-4 py-1 text-sm text-gray-600">{account.name}</td>
                        <td className="px-4 py-1 text-sm text-right text-red-600">
                          {formatCurrency(account.amount)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                <tr className="bg-red-100 font-bold">
                  <td colSpan="2" className="px-4 py-3 text-sm">TOTAL EXPENDITURE</td>
                  <td className="px-4 py-3 text-sm text-right text-red-700">
                    {formatCurrency(expenses?.total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Income */}
        <div className={`bg-white rounded-lg p-4 border ${net_income >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">NET {net_income >= 0 ? 'SURPLUS' : 'DEFICIT'}</span>
            <span className={`text-2xl font-bold ${net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(net_income))}
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
    
    return (
      <div className="space-y-6">
        {/* Assets */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-700">ASSETS</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <tbody>
                {/* Current Assets */}
                {assets?.current?.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td colSpan="2" className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Current Assets
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-blue-600">
                        {formatCurrency(assets.current.reduce((sum, a) => sum + a.amount, 0))}
                      </td>
                    </tr>
                    {assets.current.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-1 text-xs font-mono text-gray-500">{item.code}</td>
                        <td className="px-4 py-1 text-sm text-gray-600">{item.name}</td>
                        <td className="px-4 py-1 text-sm text-right text-blue-600">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Fixed Assets */}
                {assets?.fixed?.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td colSpan="2" className="px-4 py-2 text-sm font-semibold text-gray-700">
                        Fixed Assets
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-blue-600">
                        {formatCurrency(assets.fixed.reduce((sum, a) => sum + a.amount, 0))}
                      </td>
                    </tr>
                    {assets.fixed.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-1 text-xs font-mono text-gray-500">{item.code}</td>
                        <td className="px-4 py-1 text-sm text-gray-600">{item.name}</td>
                        <td className="px-4 py-1 text-sm text-right text-blue-600">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                <tr className="bg-blue-100 font-bold">
                  <td colSpan="2" className="px-4 py-3 text-sm">TOTAL ASSETS</td>
                  <td className="px-4 py-3 text-sm text-right text-blue-700">
                    {formatCurrency(assets?.total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
            <h3 className="text-lg font-semibold text-orange-700">LIABILITIES</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <tbody>
                {liabilities?.current?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs font-mono text-gray-500">{item.code}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-orange-600">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                {liabilities?.longTerm?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs font-mono text-gray-500">{item.code}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-orange-600">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-orange-100 font-bold">
                  <td colSpan="2" className="px-4 py-3 text-sm">TOTAL LIABILITIES</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-700">
                    {formatCurrency(liabilities?.total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Equity */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
            <h3 className="text-lg font-semibold text-purple-700">EQUITY</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <tbody>
                {equity?.accounts?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs font-mono text-gray-500">{item.code}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-purple-600">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-purple-100 font-bold">
                  <td colSpan="2" className="px-4 py-3 text-sm">TOTAL EQUITY</td>
                  <td className="px-4 py-3 text-sm text-right text-purple-700">
                    {formatCurrency(equity?.total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Verification */}
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
        <div className="p-4">
          <table className="min-w-full">
            <tbody>
              {openingBalances?.cashAccounts?.map((acc, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {acc.code} - Cash: {acc.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">
                    {formatCurrency(acc.openingBalance)}
                  </td>
                </tr>
              ))}
              {openingBalances?.bankAccounts?.map((acc, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {acc.code} - Bank: {acc.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-900">
                    {formatCurrency(acc.openingBalance)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className="px-4 py-3 text-sm">TOTAL OPENING BALANCE</td>
                <td className="px-4 py-3 text-sm text-right">
                  {formatCurrency(openingBalances?.total || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipts by Account */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-green-50 border-b border-green-200">
          <h3 className="text-lg font-semibold text-green-700">RECEIPTS</h3>
        </div>
        <div className="p-4">
          {Object.entries(receipts?.byAccount || {}).map(([accountKey, data]) => (
            <div key={accountKey} className="mb-4">
              <div className="flex justify-between items-center bg-green-100 p-2 rounded">
                <span className="font-semibold text-green-800">
                  {data.code} - {data.name}
                </span>
                <span className="font-bold text-green-600">
                  {formatCurrency(data.total)}
                </span>
              </div>
              <table className="min-w-full mt-2">
                <tbody>
                  {data.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-1 text-xs text-gray-500">{item.date}</td>
                      <td className="px-4 py-1 text-sm text-gray-600">
                        {item.description}
                      </td>
                      <td className="px-4 py-1 text-sm text-right text-green-600">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div className="bg-green-100 p-3 rounded font-bold flex justify-between mt-4">
            <span>TOTAL RECEIPTS</span>
            <span className="text-green-700">{formatCurrency(receipts?.total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Payments by Account */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <h3 className="text-lg font-semibold text-red-700">PAYMENTS</h3>
        </div>
        <div className="p-4">
          {Object.entries(payments?.byAccount || {}).map(([accountKey, data]) => (
            <div key={accountKey} className="mb-4">
              <div className="flex justify-between items-center bg-red-100 p-2 rounded">
                <span className="font-semibold text-red-800">
                  {data.code} - {data.name}
                </span>
                <span className="font-bold text-red-600">
                  {formatCurrency(data.total)}
                </span>
              </div>
              <table className="min-w-full mt-2">
                <tbody>
                  {data.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-1 text-xs text-gray-500">{item.date}</td>
                      <td className="px-4 py-1 text-sm text-gray-600">
                        {item.description}
                      </td>
                      <td className="px-4 py-1 text-sm text-right text-red-600">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div className="bg-red-100 p-3 rounded font-bold flex justify-between mt-4">
            <span>TOTAL PAYMENTS</span>
            <span className="text-red-700">{formatCurrency(payments?.total || 0)}</span>
          </div>
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

// Add to FinancialStatements.jsx - Budget Comparison Section

const BudgetComparisonSection = ({ incomeStatement, budgetComparison }) => {
  if (!budgetComparison) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actual Comparison</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Revenue</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Budget:</span>
              <span className="font-medium">{formatCurrency(budgetComparison.revenue.budget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Actual:</span>
              <span className="font-medium">{formatCurrency(budgetComparison.revenue.actual)}</span>
            </div>
            <div className={`flex justify-between text-sm font-medium pt-1 border-t ${budgetComparison.revenue.favorable ? 'text-green-600' : 'text-red-600'}`}>
              <span>Variance:</span>
              <span>{budgetComparison.revenue.variance >= 0 ? '+' : ''}{formatCurrency(budgetComparison.revenue.variance)} ({budgetComparison.revenue.variance_percentage}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Expenses</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Budget:</span>
              <span className="font-medium">{formatCurrency(budgetComparison.expenses.budget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Actual:</span>
              <span className="font-medium">{formatCurrency(budgetComparison.expenses.actual)}</span>
            </div>
            <div className={`flex justify-between text-sm font-medium pt-1 border-t ${budgetComparison.expenses.favorable ? 'text-green-600' : 'text-red-600'}`}>
              <span>Variance:</span>
              <span>{budgetComparison.expenses.variance >= 0 ? '+' : ''}{formatCurrency(budgetComparison.expenses.variance)} ({budgetComparison.expenses.variance_percentage}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Net Surplus/(Deficit)</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Budget:</span>
              <span className="font-medium">{formatCurrency(budgetComparison.net.budget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Actual:</span>
              <span className="font-medium">{formatCurrency(budgetComparison.net.actual)}</span>
            </div>
            <div className={`flex justify-between text-sm font-medium pt-1 border-t ${budgetComparison.net.favorable ? 'text-green-600' : 'text-red-600'}`}>
              <span>Variance:</span>
              <span>{budgetComparison.net.variance >= 0 ? '+' : ''}{formatCurrency(budgetComparison.net.variance)}</span>
            </div>
          </div>
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
            <table className="min-w-full">
              <tbody>
                {operating?.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-100 font-bold">
                  <td className="px-4 py-3 text-sm">Net Cash from Operating Activities</td>
                  <td className="px-4 py-3 text-sm text-right text-blue-700">
                    {formatCurrency(operating?.net || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Investing Activities */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
            <h3 className="text-lg font-semibold text-purple-700">CASH FLOW FROM INVESTING ACTIVITIES</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <tbody>
                {investing?.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-purple-100 font-bold">
                  <td className="px-4 py-3 text-sm">Net Cash from Investing Activities</td>
                  <td className="px-4 py-3 text-sm text-right text-purple-700">
                    {formatCurrency(investing?.net || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financing Activities */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
            <h3 className="text-lg font-semibold text-orange-700">CASH FLOW FROM FINANCING ACTIVITIES</h3>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <tbody>
                {financing?.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-orange-100 font-bold">
                  <td className="px-4 py-3 text-sm">Net Cash from Financing Activities</td>
                  <td className="px-4 py-3 text-sm text-right text-orange-700">
                    {formatCurrency(financing?.net || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Statements</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and analyze your church's financial position
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleExport}
              disabled={!statementData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export CSV
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

        {/* Statement Selector */}
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

        {/* Date Range Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeStatement !== 'trialBalance' && activeStatement !== 'balanceSheet' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  As at Date
                </label>
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

        {/* Statement Content */}
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
            {/* Statement Header */}
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

            {/* Statement Body */}
            {renderStatement()}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default FinancialStatements;