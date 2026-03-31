// pages/Payroll/PayslipView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  PrinterIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function PayslipView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payslip, setPayslip] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayslip();
  }, [id]);

  const fetchPayslip = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await payrollService.getPayslip(id);
      console.log('Payslip data:', response);
      setPayslip(response);
    } catch (error) {
      console.error('Error fetching payslip:', error);
      setError(error.response?.data?.error || 'Failed to load payslip');
      toast.error('Failed to load payslip');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await payrollService.downloadPayslip(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payslip.payslip_number || id}.pdf`);
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

  const handleEmail = async () => {
    if (!window.confirm('Email this payslip to the employee?')) return;
    try {
      await payrollService.emailPayslip(id);
      toast.success('Payslip emailed successfully');
    } catch (error) {
      toast.error('Failed to email payslip');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Payslip</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/payroll/payslips')}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              Back to Payslips
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payslip Not Found</h2>
            <p className="text-gray-600 mb-4">The requested payslip could not be found.</p>
            <button
              onClick={() => navigate('/payroll/payslips')}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              Back to Payslips
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/payroll/payslips')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                Payslip: {payslip.payslip_number}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleEmail}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Payslip Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8" id="payslip-print-area">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">PAYSLIP</h2>
              <p className="text-sm text-gray-500">{payslip.payslip_number}</p>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">Employee Name</p>
                <p className="text-sm font-medium text-gray-900">{payslip.employee_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Employee Code</p>
                <p className="text-sm font-medium text-gray-900">{payslip.employee_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Position</p>
                <p className="text-sm text-gray-900">{payslip.position || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm text-gray-900">{payslip.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pay Period</p>
                <p className="text-sm text-gray-900">
                  {formatDate(payslip.period_start)} - {formatDate(payslip.period_end)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Date</p>
                <p className="text-sm text-gray-900">{formatDate(payslip.payment_date)}</p>
              </div>
            </div>

            {/* Earnings */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Earnings</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">Basic Salary</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(payslip.basic_salary)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">Allowances</td>
                      <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(payslip.allowances)}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-4 py-2 text-sm text-gray-900">GROSS PAY</td>
                      <td className="px-4 py-2 text-sm text-right text-green-600">{formatCurrency(payslip.gross_pay)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deductions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Deductions</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">SSNIT</td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">{formatCurrency(payslip.deductions?.ssnit)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">Provident Fund</td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">{formatCurrency(payslip.deductions?.provident_fund)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">PAYE Tax</td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">{formatCurrency(payslip.deductions?.paye_tax)}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-4 py-2 text-sm text-gray-900">TOTAL DEDUCTIONS</td>
                      <td className="px-4 py-2 text-sm text-right text-red-600">{formatCurrency(payslip.deductions?.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Pay */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">NET PAY</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(payslip.net_pay)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
              <p>This is a computer-generated document. No signature is required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayslipView;