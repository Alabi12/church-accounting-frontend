import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  StarIcon as StarIconOutline,
  PencilIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { reportService } from '../../services/reports';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FinancialReports from './FinancialReports';
import TaxReports from './TaxReports';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const ReportViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [showEditTags, setShowEditTags] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getSavedReport(id);
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
      navigate('/reports/saved');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await reportService.toggleFavorite(id);
      setReport({ ...report, isFavorite: !report.isFavorite });
      toast.success(report.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleExport = async (format) => {
    try {
      let blob;
      if (report.type === 'financial') {
        blob = await reportService.exportFinancialReport({
          type: report.subtype,
          startDate: report.parameters?.startDate,
          endDate: report.parameters?.endDate,
          format
        });
      } else {
        blob = await reportService.exportTaxReport({
          year: report.parameters?.year,
          type: report.subtype,
          format
        });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      const updatedTags = [...(report.tags || []), newTag.trim()];
      await reportService.updateSavedReport(id, { tags: updatedTags });
      setReport({ ...report, tags: updatedTags });
      setNewTag('');
      toast.success('Tag added');
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      const updatedTags = (report.tags || []).filter(t => t !== tagToRemove);
      await reportService.updateSavedReport(id, { tags: updatedTags });
      setReport({ ...report, tags: updatedTags });
      toast.success('Tag removed');
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
        {/* Header - Hidden when printing */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate('/reports/saved')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Saved Reports
          </button>
          <div className="flex space-x-2">
            <button
              onClick={handleToggleFavorite}
              className="inline-flex items-center px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            >
              {report.isFavorite ? (
                <>
                  <StarIconSolid className="h-4 w-4 mr-2" />
                  Favorited
                </>
              ) : (
                <>
                  <StarIconOutline className="h-4 w-4 mr-2" />
                  Add to Favorites
                </>
              )}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              PDF
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
        </div>

        {/* Report Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 print:shadow-none print:border-none">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.name}</h1>
              {report.description && (
                <p className="text-gray-600 mb-4">{report.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 font-medium capitalize">{report.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Subtype:</span>
                  <span className="ml-2 font-medium">{report.subtype?.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(report.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created by:</span>
                  <span className="ml-2 font-medium">{report.createdBy}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 flex items-start space-x-4">
                <div className="flex items-center text-gray-500">
                  <TagIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">Tags:</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {report.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-gray-500 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {showEditTags ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="New tag..."
                          className="border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        />
                        <button
                          onClick={handleAddTag}
                          className="px-3 py-1 bg-[rgb(31,178,86)] text-white rounded-md text-sm hover:bg-[rgb(25,142,69)]"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowEditTags(false)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowEditTags(true)}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit Tags
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="print:mt-0"
        >
          {report.type === 'financial' && (
            <FinancialReports
              initialType={report.subtype}
              initialDateRange={report.parameters}
              readOnly
            />
          )}
          {report.type === 'tax' && (
            <TaxReports
              initialType={report.subtype}
              initialYear={report.parameters?.year}
              readOnly
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ReportViewer;