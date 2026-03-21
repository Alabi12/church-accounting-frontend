// src/pages/Payroll/EmployeeDetails.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  BanknotesIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => payrollService.getEmployee(id),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load employee details" />;

  const employee = data?.data;

  if (!employee) return <ErrorAlert message="Employee not found" />;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/payroll/employees')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Employee Details
          </h1>
        </div>
        <button
          onClick={() => navigate(`/payroll/employees/edit/${id}`)}
          className="inline-flex items-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)]"
        >
          <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" />
          Edit Employee
        </button>
      </div>

      {/* Employee Header */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {employee.full_name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {employee.employee_code} • {employee.position || 'No Position'} • {employee.department || 'No Department'}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(employee.status)}`}>
                  {employee.status}
                </span>
                <span className="text-sm text-gray-500">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Hired: {formatDate(employee.hire_date)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[rgb(31,178,86)]">
                GHS {employee.pay_rate?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                per {employee.pay_frequency} ({employee.pay_type})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Personal Information
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {employee.first_name} {employee.middle_name} {employee.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {employee.email || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {employee.phone || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-start">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-400 mt-0.5" />
                  {employee.address ? (
                    <>
                      {employee.address}<br />
                      {employee.city}, {employee.state} {employee.postal_code}
                    </>
                  ) : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Employment Details
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.department || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Position</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.position || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{employee.employment_type?.replace('-', ' ')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(employee.hire_date)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Identification */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Identification
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <IdentificationIcon className="h-4 w-4 mr-1 text-gray-400" />
                  National ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.national_id || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tax ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.tax_id || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">SSNIT Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.social_security_number || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Bank Details
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" />
                  Bank Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.bank_name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.bank_account_name || employee.full_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.bank_account_number || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Branch</dt>
                <dd className="mt-1 text-sm text-gray-900">{employee.bank_branch || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Employee Deductions */}
      <div className="mt-6">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Employee Deductions
            </h3>
            {employee.deductions && employee.deductions.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Deduction Type</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount/Rate</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Effective From</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Effective To</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {employee.deductions.map((deduction) => (
                      <tr key={deduction.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                          {deduction.deduction_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {deduction.amount ? `GHS ${deduction.amount}` : `${deduction.rate}%`}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {deduction.effective_from ? formatDate(deduction.effective_from) : 'Immediate'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {deduction.effective_to ? formatDate(deduction.effective_to) : 'Ongoing'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            deduction.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {deduction.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No deductions configured for this employee.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetails;