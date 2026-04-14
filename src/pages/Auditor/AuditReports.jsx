// pages/Auditor/AuditReports.jsx
import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PrinterIcon,
  ArrowPathIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AuditReports() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'all',
    status: 'all'
  });
  const [reportStats, setReportStats] = useState({
    total: 0,
    thisMonth: 0,
    byType: {}
  });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'summary',
    dateRange: {
      startDate: filters.startDate,
      endDate: filters.endDate
    },
    format: 'pdf'
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchReportTypes();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/reports', { 
        params: { 
          start_date: filters.startDate,
          end_date: filters.endDate,
          type: filters.reportType !== 'all' ? filters.reportType : undefined,
          status: filters.status !== 'all' ? filters.status : undefined
        } 
      });
      
      const reportsData = response.data.reports || [];
      setReports(reportsData);
      
      // Calculate stats
      const total = reportsData.length;
      const thisMonth = reportsData.filter(r => {
        const reportDate = new Date(r.generated_date);
        const now = new Date();
        return reportDate.getMonth() === now.getMonth() && 
               reportDate.getFullYear() === now.getFullYear();
      }).length;
      
      const byType = {};
      reportsData.forEach(r => {
        byType[r.type] = (byType[r.type] || 0) + 1;
      });
      
      setReportStats({ total, thisMonth, byType });
      
    } catch (error) {
      console.error('Error fetching audit reports:', error);
      setMockReports();
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportTypes = async () => {
    try {
      const response = await api.get('/audit/report-types');
      setReportTypes(response.data.types || [
        { id: 'summary', name: 'Summary Report', description: 'High-level overview of audit activities' },
        { id: 'detailed', name: 'Detailed Report', description: 'Comprehensive audit findings and details' },
        { id: 'compliance', name: 'Compliance Report', description: 'Regulatory compliance assessment' },
        { id: 'risk', name: 'Risk Assessment', description: 'Risk analysis and mitigation recommendations' },
        { id: 'financial', name: 'Financial Audit', description: 'Detailed financial transaction review' },
        { id: 'operational', name: 'Operational Audit', description: 'Operational efficiency and controls' }
      ]);
    } catch (error) {
      console.error('Error fetching report types:', error);
    }
  };

  const setMockReports = () => {
    setReports([
      {
        id: 1,
        name: 'Monthly Audit Summary - March 2024',
        type: 'summary',
        generated_date: '2024-03-15',
        generated_by: 'Auditor System',
        size: '2.4 MB',
        status: 'completed',
        findings_count: 12,
        high_risk_findings: 2,
        resolved_findings: 8
      },
      {
        id: 2,
        name: 'Transaction Review Report - Q1 2024',
        type: 'detailed',
        generated_date: '2024-03-14',
        generated_by: 'John Auditor',
        size: '5.1 MB',
        status: 'completed',
        findings_count: 24,
        high_risk_findings: 5,
        resolved_findings: 15
      },
      {
        id: 3,
        name: 'Compliance Check Report - February 2024',
        type: 'compliance',
        generated_date: '2024-03-10',
        generated_by: 'Sarah Auditor',
        size: '3.2 MB',
        status: 'completed',
        findings_count: 8,
        high_risk_findings: 1,
        resolved_findings: 7
      },
    ]);
  };

  const handleGenerateReport = async () => {
    if (!newReport.name) {
      toast.error('Please enter a report name');
      return;
    }
    
    setGenerating(true);
    try {
      const response = await api.post('/audit/reports/generate', {
        name: newReport.name,
        type: newReport.type,
        start_date: newReport.dateRange.startDate,
        end_date: newReport.dateRange.endDate,
        format: newReport.format
      });
      
      toast.success('Report generated successfully');
      setShowGenerateModal(false);
      setNewReport({
        name: '',
        type: 'summary',
        dateRange: { startDate: filters.startDate, endDate: filters.endDate },
        format: 'pdf'
      });
      fetchReports();
      
      // If report was generated, trigger download
      if (response.data.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report, format = 'csv') => {
  try {
    // Show loading toast
    toast.loading(`Downloading ${report.name}...`, { id: 'download' });
    
    const response = await api.get(`/audit/reports/${report.id}/download`, {
      params: { format: format },
      responseType: 'blob'
    });
    
    // Determine file extension and MIME type
    const fileExt = format === 'pdf' ? 'pdf' : 'csv';
    const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';
    
    // Create blob and download
    const blob = new Blob([response.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${report.name.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${report.name}`, { id: 'download' });
  } catch (error) {
    console.error('Error downloading report:', error);
    toast.error('Failed to download report. Try CSV format instead.', { id: 'download' });
  }
};

  const handleView = async (report) => {
    setSelectedReport(report);
    setShowPreviewModal(true);
  };

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await api.delete(`/audit/reports/${reportId}`);
        toast.success('Report deleted');
        fetchReports();
      } catch (error) {
        console.error('Error deleting report:', error);
        toast.error('Failed to delete report');
      }
    }
  };

  const getReportTypeColor = (type) => {
    switch(type) {
      case 'summary': return 'bg-blue-100 text-blue-800';
      case 'detailed': return 'bg-purple-100 text-purple-800';
      case 'compliance': return 'bg-green-100 text-green-800';
      case 'risk': return 'bg-red-100 text-red-800';
      case 'financial': return 'bg-yellow-100 text-yellow-800';
      case 'operational': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeIcon = (type) => {
    switch(type) {
      case 'summary': return <ChartBarIcon className="h-4 w-4" />;
      case 'detailed': return <DocumentTextIcon className="h-4 w-4" />;
      case 'compliance': return <CheckCircleIcon className="h-4 w-4" />;
      case 'risk': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const resetFilters = () => {
    setFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reportType: 'all',
      status: 'all'
    });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Reports</h1>
            <p className="text-sm text-gray-500 mt-1">
              Generate and manage audit reports with comprehensive analysis
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchReports()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[rgb(31,178,86)] rounded-xl hover:bg-[rgb(25,142,69)] transition-colors shadow-sm"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Generate New Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{reportStats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{reportStats.thisMonth}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Report Types</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(reportStats.byType).length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Formats</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">PDF, CSV</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <ArrowDownTrayIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Filters</span>
            {showFilters ? <ChevronUpIcon className="h-4 w-4 ml-auto" /> : <ChevronDownIcon className="h-4 w-4 ml-auto" />}
          </button>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={filters.reportType}
                  onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                >
                  <option value="all">All Types</option>
                  {reportTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fetchReports()}
                  className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
                >
                  Apply
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
          </div>
          {reports.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reports found for the selected criteria</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="mt-4 text-[rgb(31,178,86)] hover:underline"
              >
                Generate your first report
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getReportTypeIcon(report.type)}
                        <h3 className="text-sm font-medium text-gray-900">{report.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getReportTypeColor(report.type)}`}>
                          {report.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Generated: {formatDate(report.generated_date)}</span>
                        <span>By: {report.generated_by}</span>
                        <span>Size: {report.size}</span>
                        {report.findings_count !== undefined && (
                          <>
                            <span>Findings: {report.findings_count}</span>
                            <span className="text-red-600">High Risk: {report.high_risk_findings}</span>
                            <span className="text-green-600">Resolved: {report.resolved_findings}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                    <button
                      onClick={() => handleView(report)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 inline mr-1" />
                      View
                    </button>
                    <div className="relative group">
                      <button
                        className="px-3 py-1.5 text-sm text-[rgb(31,178,86)] hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                        Download
                      </button>
                      <div className="absolute hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                        <button
                          onClick={() => handleDownload(report, 'csv')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                        >
                          CSV Format
                        </button>
                        <button
                          onClick={() => handleDownload(report, 'pdf')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
                        >
                          PDF Format
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Generate New Report</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="e.g., Quarterly Audit Report - Q1 2024"
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select
                    value={newReport.type}
                    onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  >
                    {reportTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name} - {type.description}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newReport.dateRange.startDate}
                      onChange={(e) => setNewReport({
                        ...newReport,
                        dateRange: { ...newReport.dateRange, startDate: e.target.value }
                      })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newReport.dateRange.endDate}
                      onChange={(e) => setNewReport({
                        ...newReport,
                        dateRange: { ...newReport.dateRange, endDate: e.target.value }
                      })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select
                    value={newReport.format}
                    onChange={(e) => setNewReport({ ...newReport, format: e.target.value })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="csv">CSV Spreadsheet</option>
                  </select>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Preview:</strong> This report will include all audit findings and transactions from{' '}
                    {formatDate(newReport.dateRange.startDate)} to {formatDate(newReport.dateRange.endDate)}.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedReport.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">Generated: {formatDate(selectedReport.generated_date)}</p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Report Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Findings</p>
                      <p className="text-lg font-bold text-gray-900">{selectedReport.findings_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">High Risk</p>
                      <p className="text-lg font-bold text-red-600">{selectedReport.high_risk_findings || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Resolved</p>
                      <p className="text-lg font-bold text-green-600">{selectedReport.resolved_findings || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Compliance Rate</p>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedReport.resolved_findings && selectedReport.findings_count ? 
                          Math.round((selectedReport.resolved_findings / selectedReport.findings_count) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => handleDownload(selectedReport)}
                    className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                    Download Full Report
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <PrinterIcon className="h-4 w-4 inline mr-1" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}