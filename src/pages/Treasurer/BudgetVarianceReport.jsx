// pages/Treasurer/BudgetVarianceReport.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { treasurerService } from '../../services/treasurer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

// Get API URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BudgetVarianceReport = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [varianceData, setVarianceData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: null,
    type: 'all',
    department: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState([]);

  const fiscalYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  };

  const months = [
    { value: null, label: 'Full Year' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const budgetTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'EXPENSE', label: 'Expense' },
  ];

  useEffect(() => {
    fetchVarianceData();
  }, [filters]);

  const fetchVarianceData = async () => {
    try {
      setLoading(true);
      const params = {
        year: filters.year,
        month: filters.month,
        type: filters.type,
        department: filters.department !== 'all' ? filters.department : undefined,
      };
      
      const response = await treasurerService.getBudgetVariance(params);
      setVarianceData(response.variance_data || []);
      setSummary(response.summary || {});
      
      // Extract unique departments for filter
      if (response.variance_data) {
        const depts = [...new Set(response.variance_data.map(item => item.department).filter(Boolean))];
        setDepartments(depts);
      }
      
    } catch (error) {
      console.error('Error fetching variance data:', error);
      toast.error('Failed to load budget variance report');
    } finally {
      setLoading(false);
    }
  };

// pages/Treasurer/BudgetVarianceReport.jsx
const handleExport = async (format = 'csv') => {
  try {
    setExporting(true);
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Please log in first');
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    const params = new URLSearchParams({
      year: filters.year,
      month: filters.month || '',
      type: filters.type,
      department: filters.department !== 'all' ? filters.department : '',
      format: format,
    });
    
    const url = `${API_BASE_URL}/treasurer/budget-variance/export?${params}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      toast.error('Session expired. Please log in again.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `budget_variance_${filters.year}_${filters.month || 'full'}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    toast.success(`Exported as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export report');
  } finally {
    setExporting(false);
  }
};

  const getVarianceBadge = (variance, isFavorable) => {
    if (variance === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          On Target
        </span>
      );
    }
    
    if (isFavorable) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Favorable
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircleIcon className="h-3 w-3 mr-1" />
        Unfavorable
      </span>
    );
  };

  const getBudgetTypeIcon = (type) => {
    switch(type) {
      case 'REVENUE':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'EXPENSE':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ChartBarIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderSummaryCards = () => {
    if (!summary) return null;
    
    const isFavorable = summary.total_variance > 0;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Budget</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_budget)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Actual</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_actual)}</p>
        </div>
        
        <div className={`bg-white rounded-xl shadow-sm p-4 border ${isFavorable ? 'border-green-200' : 'border-red-200'}`}>
          <p className="text-sm text-gray-500 mb-1">Total Variance</p>
          <p className={`text-2xl font-bold ${isFavorable ? 'text-green-600' : 'text-red-600'}`}>
            {summary.total_variance >= 0 ? '+' : ''}{formatCurrency(summary.total_variance)}
          </p>
          <p className={`text-xs mt-1 ${isFavorable ? 'text-green-500' : 'text-red-500'}`}>
            ({summary.variance_percentage}%)
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Performance</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{summary.favorable_count} Favorable</span>
            </div>
            <div className="flex items-center space-x-1">
              <XCircleIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">{summary.unfavorable_count} Unfavorable</span>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${(summary.favorable_count / (summary.favorable_count + summary.unfavorable_count)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderVarianceTable = () => {
    if (!varianceData || varianceData.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Variance Data</h3>
          <p className="text-gray-500">
            {filters.year === new Date().getFullYear() 
              ? 'No budget data available for the selected period. Create budgets to see variance analysis.'
              : `No budget data found for ${filters.year}. Try selecting a different year.`}
          </p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  %
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {varianceData.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.department || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      {getBudgetTypeIcon(item.budget_type)}
                      <span className={`ml-1 ${
                        item.budget_type === 'REVENUE' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.budget_type === 'REVENUE' ? 'Revenue' : 'Expense'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {formatCurrency(item.budget_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {formatCurrency(item.actual_amount)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-mono font-medium ${
                    item.variance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-mono font-medium ${
                    item.variance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.variance_percentage >= 0 ? '+' : ''}{item.variance_percentage}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getVarianceBadge(item.variance, item.status === 'favorable')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="font-bold">
                <td colSpan="3" className="px-4 py-3 text-sm text-right">TOTAL</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(summary.total_budget)}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(summary.total_actual)}</td>
                <td className={`px-4 py-3 text-sm text-right font-mono ${
                  summary.total_variance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.total_variance >= 0 ? '+' : ''}{formatCurrency(summary.total_variance)}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-mono ${
                  summary.total_variance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.variance_percentage >= 0 ? '+' : ''}{summary.variance_percentage}%
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Variance Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              Compare actual performance against budgeted amounts
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting || !varianceData?.length}
              className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={fetchVarianceData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-xl hover:bg-[rgb(27,158,76)] transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-3"
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiscal Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                >
                  {fiscalYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={filters.month || ''}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month.value || 'all'} value={month.value || ''}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                >
                  {budgetTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-transparent"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Variance Table */}
            {renderVarianceTable()}
            
            {/* Report Period Info */}
            {varianceData && varianceData.length > 0 && (
              <div className="mt-6 text-center text-xs text-gray-400">
                <p>Report generated on {new Date().toLocaleString()}</p>
                <p>Based on approved budgets and posted transactions for {filters.year}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BudgetVarianceReport;