import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { donationService } from '../../services/donations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateRangePicker from '../../components/common/DateRangePicker';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const DonationList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    memberId: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['donations', page, filters],
    queryFn: () => donationService.getDonations({
      page,
      perPage: 20,
      ...filters
    }),
  });

  const queryClient = useQueryClient();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      await donationService.exportDonations(filters);
      toast.success('Donations exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export donations');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      TITHE: 'bg-purple-100 text-purple-800',
      OFFERING: 'bg-green-100 text-green-800',
      SPECIAL_OFFERING: 'bg-blue-100 text-blue-800',
      DONATION: 'bg-red-100 text-red-800',
      PLEDGE: 'bg-orange-100 text-orange-800',
      MISSION: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const donationCategories = [
    { id: 'TITHE', name: 'Tithe' },
    { id: 'OFFERING', name: 'Offering' },
    { id: 'SPECIAL_OFFERING', name: 'Special Offering' },
    { id: 'DONATION', name: 'Donation' },
    { id: 'PLEDGE', name: 'Pledge' },
    { id: 'MISSION', name: 'Mission' },
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
            <h1 className="text-3xl font-bold text-gray-900">Donations</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and manage all church donations and contributions
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
              to="/donations/add"
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Record Donation
            </Link>
            <Link
              to="/donations/summary"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Summary
            </Link>
          </div>
        </div>

        {/* Summary Card */}
        {data?.totalAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] rounded-xl shadow-lg p-6 mb-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">Total Donations</p>
                <p className="text-3xl font-bold">{formatCurrency(data.totalAmount)}</p>
                <p className="text-sm text-green-100 mt-2">{data.total} transactions</p>
              </div>
              <Link
                to="/donations/summary"
                className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                View Summary
              </Link>
            </div>
          </motion.div>
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
                    {donationCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Member ID
                  </label>
                  <input
                    type="text"
                    name="memberId"
                    value={filters.memberId}
                    onChange={handleFilterChange}
                    placeholder="Member ID"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
                <div className="md:col-span-3">
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
                      placeholder="Search by member name, description, or reference..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.donations?.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(donation.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {donation.memberName || 'Anonymous'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(donation.category)}`}>
                        {donation.category?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {donation.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      +{formatCurrency(donation.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donation.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/income/${donation.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {(!data?.donations || data.donations.length === 0) && (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No donations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search ? 'Try adjusting your search' : 'Get started by recording a new donation.'}
              </p>
            </div>
          )}

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
      </div>
    </div>
  );
};

export default DonationList;