// pages/Accountant/BudgetVariance.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const BudgetVariance = () => {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [varianceData, setVarianceData] = useState([]);
  const [summary, setSummary] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchVarianceData();
  }, [selectedYear]);

  const fetchVarianceData = async () => {
    try {
      setLoading(true);
      const response = await treasurerService.getBudgetVariance({
        year: selectedYear,
        type: 'all'
      });
      
      setVarianceData(response.variance_data || []);
      setSummary(response.summary || {});
    } catch (error) {
      console.error('Error fetching variance data:', error);
      toast.error('Failed to load budget variance data');
    } finally {
      setLoading(false);
    }
  };

  const getVarianceColor = (variance, isRevenue) => {
    if (isRevenue) {
      return variance >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return variance <= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getVarianceIcon = (variance, isRevenue) => {
    if (isRevenue) {
      return variance >= 0 ? 
        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" /> : 
        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    }
    return variance <= 0 ? 
      <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" /> : 
      <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />;
  };

  const years = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget vs Actual Variance Analysis</h1>
            <p className="text-sm text-gray-500 mt-1">
              Compare actual financial performance against approved budgets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
            >
              {years().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={fetchVarianceData}
              className="p-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-400">Budget vs Actual</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Revenue Variance</p>
            <p className={`text-2xl font-bold ${getVarianceColor(summary.total_variance || 0, true)}`}>
              {formatCurrency(summary.total_variance || 0)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Budget:</span>
              <span className="text-xs font-medium">{formatCurrency(summary.total_budget || 0)}</span>
              <span className="text-xs text-gray-500">Actual:</span>
              <span className="text-xs font-medium">{formatCurrency(summary.total_actual || 0)}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-400">Performance</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">Variance Percentage</p>
            <p className={`text-2xl font-bold ${summary.variance_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.variance_percentage?.toFixed(1)}%
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${summary.variance_percentage >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(summary.variance_percentage || 0), 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-400">Items</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">Variance Distribution</p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-green-600">{summary.favorable_count || 0}</span>
                <span className="text-xs text-gray-500 ml-1">Favorable</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-red-600">{summary.unfavorable_count || 0}</span>
                <span className="text-xs text-gray-500 ml-1">Unfavorable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Variance Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Budget vs Actual by Account</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget (GHS)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual (GHS)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance (GHS)</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">%</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {varianceData.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowDetails(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.account_code}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.department || 'General'}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(item.budget_amount)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {formatCurrency(item.actual_amount)}
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium ${getVarianceColor(item.variance, item.budget_type === 'REVENUE')}`}>
                      {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getVarianceIcon(item.variance, item.budget_type === 'REVENUE')}
                        <span className={`text-sm font-medium ${getVarianceColor(item.variance, item.budget_type === 'REVENUE')}`}>
                          {Math.abs(item.variance_percentage).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'favorable' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status === 'favorable' ? 'Favorable' : 'Unfavorable'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Variance Details Modal */}
        {showDetails && selectedItem && (
          <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{selectedItem.name}</h2>
                <button onClick={() => setShowDetails(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Budgeted Amount</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedItem.budget_amount)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Actual Amount</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedItem.actual_amount)}</p>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${selectedItem.status === 'favorable' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-sm font-medium mb-1">Variance Analysis</p>
                    <p className="text-lg font-bold mb-2">
                      {selectedItem.status === 'favorable' ? 'Favorable' : 'Unfavorable'} Variance: 
                      {selectedItem.variance >= 0 ? '+' : ''}{formatCurrency(selectedItem.variance)} 
                      ({Math.abs(selectedItem.variance_percentage).toFixed(1)}%)
                    </p>
                    <p className="text-sm">
                      {selectedItem.budget_type === 'REVENUE' 
                        ? selectedItem.variance >= 0 
                          ? 'Revenue exceeded budget expectations.' 
                          : 'Revenue fell short of budget targets.'
                        : selectedItem.variance <= 0 
                          ? 'Expenses were below budget.' 
                          : 'Expenses exceeded budget limits.'
                      }
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {selectedItem.status === 'favorable' ? (
                        <>
                          <li>✓ Continue current strategies that are working well</li>
                          <li>✓ Consider reallocating surplus to high-priority areas</li>
                          <li>✓ Document best practices for future reference</li>
                        </>
                      ) : (
                        <>
                          <li>⚠️ Investigate reasons for negative variance</li>
                          <li>⚠️ Review actual vs budgeted assumptions</li>
                          <li>⚠️ Consider budget revision if variances persist</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetVariance;