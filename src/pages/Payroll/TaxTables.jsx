// src/pages/Payroll/TaxTables.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

function TaxTables() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    id: null 
  });

  // Generate year options (current year - 5 to current year + 2)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    yearOptions.push(i);
  }

  // Fetch tax tables
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['taxTables', yearFilter],
    queryFn: () => payrollService.getTaxTables({ year: yearFilter }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => payrollService.deleteTaxTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['taxTables']);
      toast.success('Tax bracket deleted successfully');
      setDeleteDialog({ isOpen: false, id: null });
    },
    onError: (error) => {
      toast.error('Failed to delete tax bracket');
    },
  });

  const handleDelete = (id) => {
    setDeleteDialog({ 
      isOpen: true, 
      id
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.id) {
      deleteMutation.mutate(deleteDialog.id);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const taxTables = data?.data?.tax_tables || [];
  
  // Get SSNIT rates from the first tax table (they should be consistent)
  const ssRates = taxTables.length > 0 ? {
    employee: taxTables[0].ss_employee_rate,
    employer: taxTables[0].ss_employer_rate,
  } : { employee: 5.5, employer: 13.0 };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load tax tables" />;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Tax Tables</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure PAYE tax brackets and statutory deduction rates.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => navigate('/payroll/tax-tables/new')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Tax Bracket
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Year
                </label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(parseInt(e.target.value))}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SSNIT Rates Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
          <CalculatorIcon className="h-4 w-4 mr-1" />
          Current SSNIT Rates
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Employee Contribution:</span>
            <span className="ml-2 font-medium text-blue-900">{ssRates.employee}%</span>
          </div>
          <div>
            <span className="text-blue-600">Employer Contribution:</span>
            <span className="ml-2 font-medium text-blue-900">{ssRates.employer}%</span>
          </div>
        </div>
      </div>

      {/* Tax Tables */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Tax Year
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Income Range
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Tax Rate
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {taxTables.map((table) => (
                    <tr key={table.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {table.tax_year}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatCurrency(table.bracket_from)} 
                        {table.bracket_to 
                          ? ` - ${formatCurrency(table.bracket_to)}`
                          : ' and above'
                        }
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                        {table.rate}%
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/payroll/tax-tables/edit/${table.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit tax bracket"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(table.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete tax bracket"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {taxTables.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-gray-500">
                        No tax brackets found for {yearFilter}. Click "Add Tax Bracket" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Calculation Example */}
      {taxTables.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-1" />
            Tax Calculation Example (Monthly)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Gross Income: GHS 5,000</p>
              <p className="text-xs text-gray-500 mb-1">Taxable Income: GHS 4,510</p>
              <p className="text-sm font-medium text-red-600">PAYE Tax: GHS 450.50</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Gross Income: GHS 10,000</p>
              <p className="text-xs text-gray-500 mb-1">Taxable Income: GHS 9,510</p>
              <p className="text-sm font-medium text-red-600">PAYE Tax: GHS 1,450.50</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Gross Income: GHS 20,000</p>
              <p className="text-xs text-gray-500 mb-1">Taxable Income: GHS 19,510</p>
              <p className="text-sm font-medium text-red-600">PAYE Tax: GHS 3,950.50</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Tax Bracket"
        message="Are you sure you want to delete this tax bracket? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default TaxTables;