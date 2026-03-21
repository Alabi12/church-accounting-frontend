// src/pages/Payroll/PayslipList.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { format } from 'date-fns';

function PayslipList() {
 const [employeeFilter, setEmployeeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch payslips - if no employee selected, fetch all
  const { data, isLoading, error } = useQuery({
    queryKey: ['payslips', employeeFilter],
    queryFn: () => {
      if (employeeFilter) {
        return payrollService.getPayslips(employeeFilter);
      } else {
        // You need to implement this in your service
        return payrollService.getAllPayslips?.() || Promise.resolve({ data: { payslips: [] } });
      }
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const handleDownload = async (payslipId) => {
    try {
      const response = await payrollService.downloadPayslip(payslipId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip-${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading payslip:', error);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payslips" />;

  const payslips = data?.data?.payslips || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Payslips</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and download employee payslips.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <div className="relative max-w-lg">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by employee name or payslip number..."
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
          />
        </div>
      </div>

      {/* Payslips Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Employee
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Payslip Number
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Pay Period
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Net Pay
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Emailed
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Viewed
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">
                      Signed
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {payslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{payslip.employee_name}</div>
                        <div className="text-gray-500">{payslip.employee_code}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {payslip.payslip_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {payslip.payroll_period ? (
                          <>
                            <div>{formatDate(payslip.payroll_period.start)}</div>
                            <div className="text-xs">to {formatDate(payslip.payroll_period.end)}</div>
                          </>
                        ) : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-[rgb(31,178,86)]">
                        {formatCurrency(payslip.net_pay)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        {payslip.pdf_generated_at ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            Generated
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        {payslip.emailed_at ? (
                          <div className="flex items-center justify-center">
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            <span className="ml-1 text-xs">{formatDate(payslip.emailed_at)}</span>
                          </div>
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        {payslip.viewed_by_employee ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                        {payslip.signed_at ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/payroll/payslips/${payslip.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View payslip"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {payslip.pdf_generated_at && (
                            <button
                              onClick={() => handleDownload(payslip.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Download PDF"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payslips.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-12 text-gray-500">
                        No payslips found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayslipList;