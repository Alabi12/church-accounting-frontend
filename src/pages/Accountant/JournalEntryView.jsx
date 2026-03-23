// pages/Accountant/JournalEntryView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

function JournalEntryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJournalEntry();
  }, [id]);

  const fetchJournalEntry = async () => {
    try {
      setLoading(true);
      const response = await accountantService.getJournalEntry(id);
      setEntry(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching journal entry:', err);
      setError('Failed to load journal entry');
      toast.error('Failed to load journal entry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-800', icon: <ClockIcon className="h-4 w-4 mr-1" /> },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <ClockIcon className="h-4 w-4 mr-1" /> },
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircleIcon className="h-4 w-4 mr-1" /> },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircleIcon className="h-4 w-4 mr-1" /> },
      'RETURNED': { bg: 'bg-orange-100', text: 'text-orange-800', icon: <ArrowLeftIcon className="h-4 w-4 mr-1" /> },
      'POSTED': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <CheckCircleIcon className="h-4 w-4 mr-1" /> },
      'VOID': { bg: 'bg-gray-100', text: 'text-gray-800', icon: <XCircleIcon className="h-4 w-4 mr-1" /> }
    };
    
    const style = styles[status] || styles['DRAFT'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Account Code', 'Account Name', 'Debit (GHS)', 'Credit (GHS)', 'Description'];
    const rows = entry.lines.map(line => [
      line.account_code || '-',
      line.account_name || '-',
      line.debit > 0 ? line.debit.toFixed(2) : '-',
      line.credit > 0 ? line.credit.toFixed(2) : '-',
      line.description || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_entry_${entry.entry_number}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorAlert message={error || 'Journal entry not found'} />
          <button
            onClick={() => navigate('/accountant/journal-entries')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Journal Entries
          </button>
        </div>
      </div>
    );
  }

  const totalDebit = entry.lines?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0;
  const totalCredit = entry.lines?.reduce((sum, line) => sum + (line.credit || 0), 0) || 0;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0 print:bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
        {/* Header Actions - Hidden when printing */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button
            onClick={() => navigate('/accountant/journal-entries')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Journal Entries
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            {entry.status === 'DRAFT' && (
              <button
                onClick={() => navigate(`/accountant/journal-entries/edit/${id}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[rgb(31,178,86)] hover:bg-[rgb(25,142,69)]"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Entry
              </button>
            )}
          </div>
        </div>

        {/* Journal Entry Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg overflow-hidden print:shadow-none"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 print:bg-white">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Journal Entry #{entry.entry_number}
                  </h1>
                  {getStatusBadge(entry.status)}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(entry.entry_date)}
                  </div>
                  {entry.reference && (
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Ref: {entry.reference}
                    </div>
                  )}
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Created by: {entry.created_by_name || 'System'}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDateTime(entry.created_at)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Entry Status</div>
                <div className="text-sm font-semibold">
                  {isBalanced ? (
                    <span className="text-green-600">✓ Balanced</span>
                  ) : (
                    <span className="text-red-600">✗ Not Balanced</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-gray-900">{entry.description || 'No description'}</p>
            {entry.notes && (
              <>
                <h3 className="text-sm font-medium text-gray-500 mt-3 mb-1">Notes</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{entry.notes}</p>
              </>
            )}
          </div>

          {/* Journal Lines Table */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Journal Lines</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit (GHS)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit (GHS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entry.lines?.map((line, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{line.account_code || '-'}</div>
                        <div className="text-gray-500 text-xs">{line.account_name || 'Unknown Account'}</div>
                       </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{line.description || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-sm text-right">TOTALS</td>
                    <td className="px-4 py-3 text-sm text-right text-green-700">{formatCurrency(totalDebit)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-700">{formatCurrency(totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Balance Check */}
            <div className={`mt-4 p-3 rounded-lg ${isBalanced ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Entry Status</span>
                <span className={`text-sm font-bold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                  {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
                  {!isBalanced && ` (Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))})`}
                </span>
              </div>
            </div>
          </div>

          {/* Approval Information */}
          {(entry.approved_at || entry.posted_at || entry.voided_at) && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 print:bg-white">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Workflow Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {entry.approved_at && (
                  <div>
                    <div className="flex items-center text-green-600">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">Approved</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      By: {entry.approved_by_name || 'System'} on {formatDateTime(entry.approved_at)}
                    </p>
                  </div>
                )}
                {entry.posted_at && (
                  <div>
                    <div className="flex items-center text-purple-600">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">Posted</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      By: {entry.posted_by_name || 'System'} on {formatDateTime(entry.posted_at)}
                    </p>
                  </div>
                )}
                {entry.voided_at && (
                  <div>
                    <div className="flex items-center text-red-600">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">Voided</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      By: {entry.voided_by_name || 'System'} on {formatDateTime(entry.voided_at)}
                    </p>
                    {entry.void_reason && (
                      <p className="text-gray-500 text-xs mt-1">
                        Reason: {entry.void_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 print:hidden">
            <div className="flex justify-between">
              <span>Created: {formatDateTime(entry.created_at)}</span>
              {entry.updated_at && <span>Last Updated: {formatDateTime(entry.updated_at)}</span>}
            </div>
          </div>
        </motion.div>

        {/* Print Footer */}
        <div className="hidden print:block text-center text-xs text-gray-400 mt-8">
          Generated on {new Date().toLocaleString()} | Church Accounting System
        </div>
      </div>
    </div>
  );
}

export default JournalEntryView;