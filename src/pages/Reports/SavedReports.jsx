import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  StarIcon as StarIconOutline,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  ShareIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { reportService } from '../../services/reports';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const SavedReports = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    tag: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['savedReports', page, filters],
    queryFn: () => reportService.getSavedReports({ 
      page, 
      perPage: 12,
      ...filters 
    }),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => reportService.deleteSavedReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['savedReports']);
      toast.success('Report deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete report');
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id) => reportService.toggleFavorite(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries(['savedReports']);
      toast.success(data.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: (error) => {
      console.error('Toggle favorite error:', error);
      toast.error('Failed to update favorite status');
    }
  });

  const runReportMutation = useMutation({
    mutationFn: (id) => reportService.runSavedReport(id),
    onSuccess: (data, id) => {
      navigate(`/reports/view/${id}`);
    },
    onError: (error) => {
      console.error('Run report error:', error);
      toast.error('Failed to run report');
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate(deleteDialog.id);
    setDeleteDialog({ isOpen: false, id: null });
  };

  const handleToggleFavorite = (id, isFavorite) => {
    toggleFavoriteMutation.mutate(id);
  };

  const handleRunReport = (id) => {
    runReportMutation.mutate(id);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'financial':
        return '💰';
      case 'tax':
        return '📊';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'tax':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading && !data) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Reports
          </button>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your saved financial and tax reports
          </p>
        </div>

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
            <button
              onClick={() => refetch()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
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
                    Report Type
                  </label>
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="financial">Financial Reports</option>
                    <option value="tax">Tax Reports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Tag
                  </label>
                  <input
                    type="text"
                    name="tag"
                    value={filters.tag}
                    onChange={handleFilterChange}
                    placeholder="Filter by tag..."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
                <div>
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
                      placeholder="Search reports..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Reports Grid */}
        {data?.reports && data.reports.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.reports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{getTypeIcon(report.type)}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{report.name}</h3>
                          <p className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getTypeColor(report.type)}`}>
                            {report.type?.charAt(0).toUpperCase() + report.type?.slice(1)} Report
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleFavorite(report.id, report.isFavorite)}
                        className="text-yellow-400 hover:text-yellow-500 transition-colors"
                      >
                        {report.isFavorite ? (
                          <StarIconSolid className="h-6 w-6" />
                        ) : (
                          <StarIconOutline className="h-6 w-6" />
                        )}
                      </button>
                    </div>

                    {report.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {report.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>Created: {formatDate(report.createdAt)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <UserIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>By: {report.createdBy}</span>
                      </div>
                      {report.tags && report.tags.length > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <TagIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {report.tags.map((tag, idx) => (
                              <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {report.lastRun && (
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Last run: {formatDate(report.lastRun)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        {report.subtype}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRunReport(report.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Report"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Share"
                        >
                          <ShareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, id: report.id })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {data.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pages}
                  className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved reports</h3>
            <p className="text-gray-500 mb-6">
              Generate a report and save it to see it here.
            </p>
            <Link
              to="/reports/financial"
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              Create Report
            </Link>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, id: null })}
          onConfirm={handleDelete}
          title="Delete Report"
          message="Are you sure you want to delete this saved report? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </div>
    </div>
  );
};

export default SavedReports;