import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { incomeService } from '../../services/income';
import { memberService } from '../../services/members';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DateRangePicker from '../../components/common/DateRangePicker';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const IncomeList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    paymentMethod: '',
    status: '',
    memberId: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['income', page, filters],
    queryFn: () => incomeService.getIncome({
      page,
      perPage: 10,
      ...filters
    }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => incomeService.deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['income']);
      queryClient.invalidateQueries(['incomeSummary']);
      toast.success('Income deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete income');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(deleteDialog.id);
    setDeleteDialog({ isOpen: false, id: null });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      await incomeService.exportIncome(filters);
      toast.success('Income data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export income data');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      posted: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      void: 'bg-gray-100 text-gray-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const incomeCategories = [
    { id: 'TITHE', name: 'Tithe' },
    { id: 'OFFERING', name: 'Offering' },
    { id: 'SPECIAL_OFFERING', name: 'Special Offering' },
    { id: 'DONATION', name: 'Donation' },
    { id: 'PLEDGE', name: 'Pledge' },
    { id: 'EVENT_INCOME', name: 'Event Income' },
    { id: 'RENTAL_INCOME', name: 'Rental Income' },
    { id: 'INVESTMENT_INCOME', name: 'Investment' },
    { id: 'MISSION_SUPPORT', name: 'Mission Support' },
    { id: 'BOOKSTORE_SALES', name: 'Bookstore Sales' },
    { id: 'OTHER', name: 'Other' },
  ];

  const paymentMethods = [
    { id: 'CASH', name: 'Cash' },
    { id: 'CHEQUE', name: 'Cheque' },
    { id: 'BANK_TRANSFER', name: 'Bank Transfer' },
    { id: 'CREDIT_CARD', name: 'Credit Card' },
    { id: 'MOBILE_MONEY', name: 'Mobile Money' },
    { id: 'ONLINE', name: 'Online' },
  ];

  const statuses = [
    { id: 'posted', name: 'Posted' },
    { id: 'pending', name: 'Pending' },
    { id: 'rejected', name: 'Rejected' },
    { id: 'void', name: 'Void' },
  ];

  if (isLoading && !data) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and manage all church income and contributions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export
            </button>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
            <Link
              to="/income/add"
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Income
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        {data?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.totalAmount || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-[rgb(31,178,86)]">
                {formatCurrency(data.summary.monthAmount || 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{data.total || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-500">Average per Transaction</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency((data.summary.totalAmount || 0) / (data.total || 1))}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 flex justify-between items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-gray-200 p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Date Range
                  </label>
                  <DateRangePicker
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    onStartDateChange={(date) => setFilters({ ...filters, startDate: date })}
                    onEndDateChange={(date) => setFilters({ ...filters, endDate: date })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">All Categories</option>
                    {incomeCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={filters.paymentMethod}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">All Methods</option>
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>{method.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">All Status</option>
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Search by description or reference..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Income Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.income?.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(income.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {income.description || 'No description'}
                      {income.reference && (
                        <span className="block text-xs text-gray-500">Ref: {income.reference}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {income.category?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {income.memberName || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      +{formatCurrency(income.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {income.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(income.status)}`}>
                        {income.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/income/${income.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/income/edit/${income.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, id: income.id })}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(!data?.income || data.income.length === 0) && (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No income transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {data.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === data.pages}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, id: null })}
          onConfirm={handleDelete}
          title="Delete Income"
          message="Are you sure you want to delete this income transaction? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </div>
    </div>
  );
};

export default IncomeList;