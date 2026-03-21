// src/pages/Payroll/EmployeeList.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

function EmployeeList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    id: null, 
    name: '' 
  });

  // Fetch employees
  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', statusFilter, departmentFilter, searchTerm],
    queryFn: () => payrollService.getEmployees({ 
      status: statusFilter !== 'all' ? statusFilter : undefined,
      department: departmentFilter || undefined,
      search: searchTerm || undefined
    }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => payrollService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      toast.success('Employee deactivated successfully');
      setDeleteDialog({ isOpen: false, id: null, name: '' });
    },
    onError: (error) => {
      toast.error('Failed to deactivate employee');
    },
  });

  const handleDelete = (id, name) => {
    setDeleteDialog({ 
      isOpen: true, 
      id, 
      name 
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.id) {
      deleteMutation.mutate(deleteDialog.id);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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

  const getEmploymentTypeColor = (type) => {
    switch (type) {
      case 'full-time':
        return 'bg-blue-100 text-blue-800';
      case 'part-time':
        return 'bg-purple-100 text-purple-800';
      case 'contractor':
        return 'bg-orange-100 text-orange-800';
      case 'casual':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load employees" />;

  const employees = data?.data?.employees || [];
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage employee information, payroll settings, and employment details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => navigate('/payroll/employees/new')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[rgb(31,178,86)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[rgb(25,142,69)] focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:ring-offset-2 sm:w-auto"
          >
            <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search employees by name, code, or email..."
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm sm:leading-6"
          />
        </div>
        <div className="flex items-center gap-3">
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
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm sm:leading-6"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[rgb(31,178,86)] sm:text-sm sm:leading-6"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Employee Code
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Department
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Position
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Employment Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Pay Rate
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {employee.employee_code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="font-medium text-gray-900">{employee.full_name}</div>
                        <div className="text-gray-500">{employee.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {employee.department || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {employee.position || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getEmploymentTypeColor(employee.employment_type)}`}>
                          {employee.employment_type?.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        GHS {employee.pay_rate?.toLocaleString()}
                        <span className="text-xs text-gray-400 ml-1">
                          /{employee.pay_frequency}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(employee.status)}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/payroll/employees/edit/${employee.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit employee"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id, employee.full_name)}
                            className="text-red-600 hover:text-red-900"
                            disabled={employee.status === 'inactive'}
                            title="Deactivate employee"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500">
                        No employees found. Click "Add Employee" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${deleteDialog.name}? This action can be reversed later.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default EmployeeList;