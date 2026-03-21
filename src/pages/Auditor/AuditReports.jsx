import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AuditReports() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('all');

  useEffect(() => {
    fetchReports();
  }, [dateRange, reportType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/reports', { params: { ...dateRange, type: reportType } });
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching audit reports:', error);
      setMockReports();
    } finally {
      setLoading(false);
    }
  };

  const setMockReports = () => {
    setReports([
      {
        id: 1,
        name: 'Monthly Audit Summary - March 2024',
        type: 'summary',
        generatedDate: '2024-03-15',
        generatedBy: 'Auditor System',
        size: '2.4 MB',
        status: 'completed'
      },
      {
        id: 2,
        name: 'Transaction Review Report - Q1 2024',
        type: 'detailed',
        generatedDate: '2024-03-14',
        generatedBy: 'John Auditor',
        size: '5.1 MB',
        status: 'completed'
      },
      {
        id: 3,
        name: 'Compliance Check Report - February 2024',
        type: 'compliance',
        generatedDate: '2024-03-10',
        generatedBy: 'Sarah Auditor',
        size: '3.2 MB',
        status: 'completed'
      },
    ]);
  };

  const handleGenerateReport = () => {
    toast.success('Generating new audit report...');
    // Implement report generation
  };

  const handleDownload = (report) => {
    toast.success(`Downloading ${report.name}`);
    // Implement download
  };

  const handleView = (report) => {
    toast.success(`Viewing ${report.name}`);
    // Implement view
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Audit Reports</h1>
        <button
          onClick={handleGenerateReport}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Generate New Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All Reports</option>
              <option value="summary">Summary Reports</option>
              <option value="detailed">Detailed Reports</option>
              <option value="compliance">Compliance Reports</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Generated Reports</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {reports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Generated: {formatDate(report.generatedDate)}</span>
                    <span>By: {report.generatedBy}</span>
                    <span>Size: {report.size}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {report.status}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(report)}
                    className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(report)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}