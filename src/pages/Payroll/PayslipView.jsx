// src/pages/Payroll/PayslipView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SignaturePad from '../../components/common/SignaturePad';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function PayslipView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signature, setSignature] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // details, breakdown, signature
  const printRef = useRef();

  // Fetch payslip details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => payrollService.getPayslip(id),
  });

  // Mark as viewed mutation
  const viewMutation = useMutation({
    mutationFn: () => payrollService.markPayslipViewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payslip', id]);
    },
  });

  // Sign payslip mutation
  const signMutation = useMutation({
    mutationFn: (signatureData) => payrollService.signPayslip(id, signatureData),
    onSuccess: () => {
      queryClient.invalidateQueries(['payslip', id]);
      toast.success('Payslip signed successfully');
      setShowSignDialog(false);
      setSignature(null);
    },
    onError: (error) => {
      toast.error('Failed to sign payslip');
    },
  });

  // Mark as viewed when component mounts
  useEffect(() => {
    if (data?.data && !data.data.viewed_by_employee) {
      viewMutation.mutate();
    }
  }, [data]);

  const handleDownload = async () => {
    try {
      const response = await payrollService.downloadPayslip(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${data?.data?.payslip_number || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const originalTitle = document.title;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${data?.data?.payslip_number || id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; background-color: #f0f0f0; }
            .signature { margin-top: 40px; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleEmail = async () => {
    try {
      await payrollService.bulkEmailPayslips?.(data?.data?.payroll_run_id);
      toast.success('Payslip emailed successfully');
    } catch (error) {
      toast.error('Failed to email payslip');
    }
  };

  const handleSign = () => {
    if (signature) {
      signMutation.mutate({ signature });
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payslip" />;

  const payslip = data?.data;
  if (!payslip) return <ErrorAlert message="Payslip not found" />;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy HH:mm');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
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
            {payslip.emailed_to ? (
              <button
                onClick={handleEmail}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Resend Email
              </button>
            ) : (
              <button
                onClick={handleEmail}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Email
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                  <dd className="mt-1">
                    {payslip.pdf_generated_at ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                        Generated
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Emailed</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {payslip.emailed_at ? formatDateTime(payslip.emailed_at) : 'Not sent'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Viewed</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {payslip.viewed_at ? formatDateTime(payslip.viewed_at) : 'Not viewed'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PencilSquareIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Signed</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {payslip.signed_at ? formatDateTime(payslip.signed_at) : 'Not signed'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`${
              activeTab === 'details'
                ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`${
              activeTab === 'breakdown'
                ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Breakdown
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`${
              activeTab === 'signature'
                ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Signature {payslip.signed_at && '(Signed)'}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div ref={printRef}>
        {activeTab === 'details' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Payslip Details
              </h3>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employee Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payslip.employee_name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employee Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payslip.employee_code || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payslip Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payslip.payslip_number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Pay Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {payslip.payroll_period ? (
                      <>
                        {formatDate(payslip.payroll_period.start)} to {formatDate(payslip.payroll_period.end)}
                      </>
                    ) : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payslip.payment_date || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Department</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payslip.department || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Position</dt>
                  <dd className="mt-1 text-sm text-gray-900">{payslip.position || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{payslip.employment_type || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Earnings Breakdown
              </h3>
              
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg mb-6">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Description
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Amount (GHS)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        Regular Pay
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(payslip.earnings?.regular_pay || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        Overtime Pay
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(payslip.earnings?.overtime_pay || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        Bonus Pay
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(payslip.earnings?.bonus_pay || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        Allowance Pay
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(payslip.earnings?.allowance_pay || 0)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900">
                        GROSS PAY
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-gray-900">
                        {formatCurrency(payslip.earnings?.gross_pay || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Deductions Breakdown
              </h3>
              
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Description
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Amount (GHS)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        PAYE Tax
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(payslip.tax?.paye || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        SSNIT (Employee)
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(payslip.deductions?.ssnit || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        Provident Fund
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                        {formatCurrency(payslip.deductions?.provident_fund || 0)}
                      </td>
                    </tr>
                    {payslip.deductions?.other?.map((deduction, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {deduction.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-red-600">
                          {formatCurrency(deduction.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-bold text-gray-900">
                        TOTAL DEDUCTIONS
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-red-600">
                        {formatCurrency(payslip.total_deductions || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">NET PAY</span>
                  <span className="text-2xl font-bold text-[rgb(31,178,86)]">
                    {formatCurrency(payslip.net_pay || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signature' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Employee Signature
              </h3>
              
              {payslip.signed_at ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Signed by employee on:</p>
                    <p className="text-base font-medium text-gray-900">{formatDateTime(payslip.signed_at)}</p>
                  </div>
                  
                  {payslip.employee_signature && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Signature:</p>
                      <img 
                        src={payslip.employee_signature} 
                        alt="Employee Signature"
                        className="max-h-32 border border-gray-200 rounded"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    This payslip has not been signed by the employee yet.
                  </p>
                  <button
                    onClick={() => setShowSignDialog(true)}
                    className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)]"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-2" />
                    Sign Payslip
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sign Dialog */}
      <ConfirmDialog
        isOpen={showSignDialog}
        onClose={() => {
          setShowSignDialog(false);
          setSignature(null);
        }}
        onConfirm={handleSign}
        title="Sign Payslip"
        message={
          <div>
            <p className="mb-4">Please provide your signature below:</p>
            <SignaturePad onChange={setSignature} />
          </div>
        }
        confirmText="Sign"
        cancelText="Cancel"
        type="success"
        disabled={!signature}
      />
    </div>
  );
}

export default PayslipView;