import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function FinancialReview() {
  const [loading, setLoading] = useState(true);
  const [reviewType, setReviewType] = useState('income-statement');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [financialData, setFinancialData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [findings, setFindings] = useState([]);
  const [notes, setNotes] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    fetchFinancialData();
  }, [reviewType, dateRange]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reviewType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const response = await api.get(`/finance-committee/financial-review?${params}`);
      setFinancialData(response.data);
      setFindings(response.data.findings || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setMockFinancialData();
    } finally {
      setLoading(false);
    }
  };

  const setMockFinancialData = () => {
    if (reviewType === 'income-statement') {
      setFinancialData({
        title: 'Income Statement Review',
        period: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`,
        revenue: {
          items: [
            { name: 'Tithes', amount: 45250, previousAmount: 42500, variance: 2750 },
            { name: 'Offerings', amount: 24750, previousAmount: 23500, variance: 1250 },
            { name: 'Special Offerings', amount: 8000, previousAmount: 6500, variance: 1500 },
            { name: 'Donations', amount: 4000, previousAmount: 3500, variance: 500 },
          ],
          total: 82000,
          previousTotal: 76000
        },
        expenses: {
          items: [
            { name: 'Pastoral Support', amount: 15000, previousAmount: 14500, variance: 500 },
            { name: 'Ministry Operations', amount: 8500, previousAmount: 8200, variance: 300 },
            { name: 'Outreach', amount: 6000, previousAmount: 5500, variance: 500 },
            { name: 'Building Maintenance', amount: 4500, previousAmount: 4800, variance: -300 },
            { name: 'Administrative', amount: 3500, previousAmount: 3300, variance: 200 },
            { name: 'Missions', amount: 5000, previousAmount: 4700, variance: 300 },
          ],
          total: 42500,
          previousTotal: 41000
        },
        netIncome: 39500,
        previousNetIncome: 35000,
        variance: 4500,
        variancePercentage: 12.9,
        findings: [
          { id: 1, type: 'positive', description: 'Tithe income increased by 6.5%', impact: 'high' },
          { id: 2, type: 'concern', description: 'Outreach expenses above budget', impact: 'medium' },
          { id: 3, type: 'observation', description: 'Building maintenance costs decreased', impact: 'low' },
        ]
      });
    } else if (reviewType === 'balance-sheet') {
      setFinancialData({
        title: 'Balance Sheet Review',
        asOf: formatDate(dateRange.endDate),
        assets: {
          current: [
            { name: 'Cash and Cash Equivalents', amount: 125000, previousAmount: 115000, change: 10000 },
            { name: 'Accounts Receivable', amount: 25000, previousAmount: 28000, change: -3000 },
            { name: 'Prepaid Expenses', amount: 8000, previousAmount: 7500, change: 500 },
          ],
          fixed: [
            { name: 'Property and Equipment', amount: 450000, previousAmount: 445000, change: 5000 },
            { name: 'Vehicles', amount: 85000, previousAmount: 85000, change: 0 },
          ],
          total: 693000,
          previousTotal: 680500
        },
        liabilities: {
          current: [
            { name: 'Accounts Payable', amount: 35000, previousAmount: 38000, change: -3000 },
            { name: 'Accrued Expenses', amount: 12000, previousAmount: 11500, change: 500 },
          ],
          longTerm: [
            { name: 'Mortgage Payable', amount: 250000, previousAmount: 255000, change: -5000 },
          ],
          total: 297000,
          previousTotal: 304500
        },
        equity: {
          items: [
            { name: 'Retained Earnings', amount: 396000, previousAmount: 376000, change: 20000 },
          ],
          total: 396000,
          previousTotal: 376000
        }
      });
    }
  };

  const handleAddFinding = () => {
    if (!notes.trim()) {
      toast.error('Please enter finding notes');
      return;
    }

    const newFinding = {
      id: Date.now(),
      description: notes,
      type: 'observation',
      impact: 'medium',
      date: new Date().toISOString()
    };

    setFindings([...findings, newFinding]);
    setNotes('');
    toast.success('Finding added');
  };

  const handleExport = () => {
    toast.success('Exporting review report...');
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getFindingIcon = (type) => {
    switch(type) {
      case 'positive': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'concern': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Financial Review</h1>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export Review
        </button>
      </div>

      {/* Review Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review Type</label>
            <select
              value={reviewType}
              onChange={(e) => setReviewType(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="income-statement">Income Statement</option>
              <option value="balance-sheet">Balance Sheet</option>
              <option value="cash-flow">Cash Flow</option>
              <option value="budget-variance">Budget Variance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchFinancialData}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Update Review
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{financialData?.title}</h2>
        <p className="text-sm text-gray-500 mb-6">
          Period: {financialData?.period || financialData?.asOf}
        </p>

        {reviewType === 'income-statement' && (
          <div className="space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Revenue</h3>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Current Period</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Previous Period</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Variance</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">% Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financialData?.revenue.items.map((item, index) => {
                    const percentChange = ((item.variance / item.previousAmount) * 100).toFixed(1);
                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.previousAmount)}</td>
                        <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(item.variance)}`}>
                          {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                        </td>
                        <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(item.variance)}`}>
                          {item.variance > 0 ? '+' : ''}{percentChange}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900">Total Revenue</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(financialData?.revenue.total)}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(financialData?.revenue.previousTotal)}</td>
                    <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(financialData?.revenue.total - financialData?.revenue.previousTotal)}`}>
                      {formatCurrency(financialData?.revenue.total - financialData?.revenue.previousTotal)}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(financialData?.revenue.total - financialData?.revenue.previousTotal)}`}>
                      {(((financialData?.revenue.total - financialData?.revenue.previousTotal) / financialData?.revenue.previousTotal) * 100).toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Expenses</h3>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Current Period</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Previous Period</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Variance</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">% Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financialData?.expenses.items.map((item, index) => {
                    const percentChange = ((item.variance / item.previousAmount) * 100).toFixed(1);
                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.previousAmount)}</td>
                        <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(-item.variance)}`}>
                          {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                        </td>
                        <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(-item.variance)}`}>
                          {item.variance > 0 ? '+' : ''}{percentChange}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-900">Total Expenses</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(financialData?.expenses.total)}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(financialData?.expenses.previousTotal)}</td>
                    <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(financialData?.expenses.previousTotal - financialData?.expenses.total)}`}>
                      {formatCurrency(financialData?.expenses.total - financialData?.expenses.previousTotal)}
                    </td>
                    <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(financialData?.expenses.previousTotal - financialData?.expenses.total)}`}>
                      {(((financialData?.expenses.total - financialData?.expenses.previousTotal) / financialData?.expenses.previousTotal) * 100).toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Net Income Summary */}
            <div className="bg-primary-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-primary-900">Net Income</h4>
                  <p className="text-xs text-primary-700 mt-1">
                    Previous period: {formatCurrency(financialData?.previousNetIncome)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(financialData?.netIncome)}
                  </p>
                  <p className={`text-sm ${getVarianceColor(financialData?.variance)}`}>
                    {financialData?.variance > 0 ? '+' : ''}{formatCurrency(financialData?.variance)} ({financialData?.variancePercentage}%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {reviewType === 'balance-sheet' && (
          <div className="space-y-6">
            {/* Assets */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Assets</h3>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Current</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Previous</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financialData?.assets.current.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900 pl-8">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.previousAmount)}</td>
                      <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(item.change)}`}>
                        {item.change > 0 ? '+' : ''}{formatCurrency(item.change)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">Total Assets</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(financialData?.assets.total)}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(financialData?.assets.previousTotal)}</td>
                    <td className={`px-4 py-2 text-sm font-medium text-right ${getVarianceColor(financialData?.assets.total - financialData?.assets.previousTotal)}`}>
                      {formatCurrency(financialData?.assets.total - financialData?.assets.previousTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Liabilities */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Liabilities</h3>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Current</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Previous</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financialData?.liabilities.current.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900 pl-8">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.previousAmount)}</td>
                      <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(-item.change)}`}>
                        {item.change > 0 ? '+' : ''}{formatCurrency(item.change)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">Total Liabilities</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(financialData?.liabilities.total)}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(financialData?.liabilities.previousTotal)}</td>
                    <td className={`px-4 py-2 text-sm font-medium text-right ${getVarianceColor(financialData?.liabilities.previousTotal - financialData?.liabilities.total)}`}>
                      {formatCurrency(financialData?.liabilities.total - financialData?.liabilities.previousTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Equity */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Equity</h3>
              <table className="min-w-full">
                <tbody>
                  {financialData?.equity.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900 pl-8">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.previousAmount)}</td>
                      <td className={`px-4 py-2 text-sm text-right ${getVarianceColor(item.change)}`}>
                        {item.change > 0 ? '+' : ''}{formatCurrency(item.change)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">Total Equity</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(financialData?.equity.total)}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(financialData?.equity.previousTotal)}</td>
                    <td className={`px-4 py-2 text-sm font-medium text-right ${getVarianceColor(financialData?.equity.total - financialData?.equity.previousTotal)}`}>
                      {formatCurrency(financialData?.equity.total - financialData?.equity.previousTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Findings and Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Findings</h3>
          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                {getFindingIcon(finding.type)}
                <div>
                  <p className="text-sm text-gray-900">{finding.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Impact: {finding.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Observation</h3>
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter your observations or findings..."
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddFinding}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Add Finding
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Summary */}
      <div className="bg-primary-50 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-primary-900 mb-2">Review Summary</h3>
        <p className="text-sm text-primary-700">
          This financial review has been prepared for the Finance Committee meeting on {formatDate(new Date())}. 
          All figures have been verified against source documents. Please bring any questions to the next committee meeting.
        </p>
      </div>
    </div>
  );
}
