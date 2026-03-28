import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  EyeIcon,
  MagnifyingGlassIcon as SearchIcon,  // Import as SearchIcon
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,  // Add this import
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PayslipList = () => {
  const navigate = useNavigate();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRun, setSelectedRun] = useState('all');
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    fetchPayslips();
    fetchRuns();
  }, [selectedRun]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      let response;
      if (selectedRun !== 'all') {
        response = await payrollService.getPayslipsByRun(selectedRun);
        setPayslips(response.payslips || []);
      } else {
        response = await payrollService.getPayslips();
        setPayslips(response.payslips || []);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const response = await payrollService.getPayrollRuns({ status: 'POSTED' });
      setRuns(response.runs || []);
    } catch (error) {
      console.error('Error fetching runs:', error);
    }
  };

  const handleDownload = async (id, payslipNumber) => {
    try {
      const response = await payrollService.downloadPayslip(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payslipNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Payslip downloaded');
    } catch (error) {
      console.error('Error downloading payslip:', error);
      toast.error('Failed to download payslip');
    }
  };

  const handleEmail = async (id) => {
    if (!window.confirm('Email this payslip to the employee?')) return;
    try {
      await payrollService.bulkEmailPayslips(id);
      toast.success('Payslip emailed successfully');
    } catch (error) {
      toast.error('Failed to email payslip');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredPayslips = payslips.filter(p => 
    p.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.payslip_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payslips</h1>
            <p className="text-sm text-gray-500 mt-1">
              View, download, and email employee payslips
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee or payslip..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-64"
              />
            </div>
            <select
              value={selectedRun}
              onChange={(e) => setSelectedRun(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Runs</option>
              {runs.map(run => (
                <option key={run.id} value={run.id}>{run.run_number}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Total Payslips</p>
            <p className="text-2xl font-bold text-gray-900">{filteredPayslips.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Total Gross Pay</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(filteredPayslips.reduce((sum, p) => sum + (p.gross_pay || 0), 0))}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Total Net Pay</p>
            <p className="text-2xl font-bold text-[rgb(31,178,86)]">
              {formatCurrency(filteredPayslips.reduce((sum, p) => sum + (p.net_pay || 0), 0))}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500">Employees</p>
            <p className="text-2xl font-bold text-blue-600">
              {new Set(filteredPayslips.map(p => p.employee_id)).size}
            </p>
          </div>
        </div>

        {/* Payslips Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payslip #</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No payslips found</p>
                      <p className="text-sm text-gray-400 mt-1">Generate payslips from approved payroll runs.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayslips.map((payslip, index) => (
                    <motion.tr
                      key={payslip.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{payslip.payslip_number}</p>
                        <p className="text-xs text-gray-500">Created: {formatDate(payslip.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{payslip.employee?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">ID: {payslip.employee?.code || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payslip.period_start && payslip.period_end 
                          ? `${formatDate(payslip.period_start)} - ${formatDate(payslip.period_end)}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        {formatCurrency(payslip.gross_pay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[rgb(31,178,86)]">
                        {formatCurrency(payslip.net_pay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${payslip.has_pdf ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {payslip.has_pdf ? <CheckCircleIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />}
                          {payslip.has_pdf ? 'Generated' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/payroll/payslips/${payslip.id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {payslip.has_pdf && (
                            <>
                              <button
                                onClick={() => handleDownload(payslip.id, payslip.payslip_number)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Download PDF"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEmail(payslip.id)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Email Payslip"
                              >
                                <EnvelopeIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipList;