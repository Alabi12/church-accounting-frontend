import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomeService } from '../services/income';
import { memberService } from '../services/members';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AddIncome from '../components/income/AddIncome';
import IncomeList from '../components/income/IncomeList';
import EditIncomeModal from '../components/income/EditIncomeModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

// Income List Component
function IncomeListPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    paymentMethod: '',
    status: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [members, setMembers] = useState([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['income', page, filters],
    queryFn: () => incomeService.getIncomeList({ 
      page, 
      perPage: 10,
      ...filters 
    }),
  });

  const queryClient = useQueryClient();

  // Fetch members for dropdown
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await memberService.getMembers({ status: 'ACTIVE', perPage: 100 });
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => incomeService.deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['income']);
      queryClient.invalidateQueries(['incomeSummary']);
      toast.success('Income deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete income');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => incomeService.updateIncome(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['income']);
      queryClient.invalidateQueries(['incomeSummary']);
      toast.success('Income updated successfully');
      setShowEditModal(false);
      setEditingIncome(null);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update income');
    },
  });

  const handleEdit = (income) => {
    setEditingIncome(income);
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this income record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (income) => {
    setSelectedIncome(income);
    setShowDetails(true);
  };

  const handleUpdateSubmit = (formData) => {
    if (!editingIncome) return;
    
    const updateData = {
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      paymentMethod: formData.payment_method,
      description: formData.description || '',
      reference: formData.reference_number || '',
      memberId: formData.memberId || null,
      notes: formData.notes || '',
    };
    
    console.log('Updating income with data:', updateData);
    updateMutation.mutate({ 
      id: editingIncome.id, 
      data: updateData 
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      paymentMethod: '',
      status: '',
      search: ''
    });
    setPage(1);
  };

  const handleExport = () => {
    incomeService.exportIncome(filters);
  };

  const getStatusBadge = (status) => {
    const config = {
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircleIcon }
    };
    const { bg, text, icon: Icon } = config[status] || config.COMPLETED;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="bg-white shadow sm:rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-medium text-gray-900">Income Transactions</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Toggle filters"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleResetFilters}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Reset filters"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <Link
              to="/income/add"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[rgb(31,178,86)] hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Income
            </Link>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <form onSubmit={handleSearch} className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="pl-9 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="TITHE">Tithe</option>
                  <option value="OFFERING">Offering</option>
                  <option value="SPECIAL_OFFERING">Special Offering</option>
                  <option value="DONATION">Donation</option>
                  <option value="PLEDGE">Pledge</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search by description or reference..."
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                />
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(data.summary.totalAmount)}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(data.summary.monthAmount)}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-xl font-bold text-gray-900">{data.total}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500">Average per Transaction</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(data.summary.totalAmount / (data.total || 1))}
            </p>
          </div>
        </div>
      )}

      {/* Income Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <IncomeList 
          incomes={data?.transactions || []} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleViewDetails}
        />

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {data.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === data.pages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{data.pages}</span> |{' '}
                  <span className="font-medium">{data.total}</span> total income records
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, data.pages))].map((_, i) => {
                  const pageNum = page + i - 2;
                  if (pageNum < 1 || pageNum > data.pages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        page === pageNum
                          ? 'bg-[rgb(31,178,86)] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pages}
                  className="relative inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedIncome && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Income Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <dl className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Transaction Number</dt>
                  <dd className="text-sm font-medium">{selectedIncome.transactionNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date</dt>
                  <dd className="text-sm">{formatDate(selectedIncome.date)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd className="text-sm">{selectedIncome.description}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Category</dt>
                  <dd className="text-sm">{selectedIncome.category}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Amount</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCurrency(selectedIncome.amount)}</dd>
                </div>
              </div>
              {selectedIncome.member && (
                <div>
                  <dt className="text-sm text-gray-500">Donor</dt>
                  <dd className="text-sm flex items-center">
                    <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {selectedIncome.member.name}
                    {selectedIncome.member.email && (
                      <span className="ml-2 text-xs text-gray-500">({selectedIncome.member.email})</span>
                    )}
                  </dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Payment Method</dt>
                  <dd className="text-sm">{selectedIncome.paymentMethod}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Reference</dt>
                  <dd className="text-sm">{selectedIncome.reference || '-'}</dd>
                </div>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Account</dt>
                <dd className="text-sm">
                  {selectedIncome.account?.code} - {selectedIncome.account?.name}
                </dd>
              </div>
              {selectedIncome.notes && (
                <div>
                  <dt className="text-sm text-gray-500">Notes</dt>
                  <dd className="text-sm bg-gray-50 p-2 rounded">{selectedIncome.notes}</dd>
                </div>
              )}
              <div className="border-t pt-4">
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="mt-1">{getStatusBadge(selectedIncome.status)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingIncome && (
        <EditIncomeModal
          income={editingIncome}
          members={members}
          onSubmit={handleUpdateSubmit}
          onClose={() => {
            setShowEditModal(false);
            setEditingIncome(null);
          }}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  );
}

// Add Income Component
function AddIncomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [members, setMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await memberService.getMembers({ status: 'ACTIVE', perPage: 100 });
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

 const mutation = useMutation({
  mutationFn: (data) => incomeService.recordIncome(data),
  onSuccess: () => {
    toast.success('Income recorded successfully');
    queryClient.invalidateQueries(['income']);
    navigate('/income');
  },
  onError: (error) => {
    console.error('Error response:', error.response?.data);
    toast.error(error.response?.data?.error || 'Failed to record income');
  },
});

  const onSubmit = (formData) => {
    console.log('Form data received:', formData);
    
    const apiData = {
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      paymentMethod: formData.payment_method,
      description: formData.description || '',
      reference: formData.reference_number || '',
      memberId: formData.memberId || null,
      notes: formData.notes || '',
    };
    
    console.log('Sending to API:', apiData);
    setIsSubmitting(true);
    mutation.mutate(apiData);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Record New Income</h2>
        <AddIncome 
          onSubmit={onSubmit} 
          isLoading={mutation.isLoading || isSubmitting}
          members={members}
        />
      </div>
    </div>
  );
}

// Analytics Component
function IncomeAnalytics() {
  const [period, setPeriod] = useState('month');
  const { data, isLoading } = useQuery({
    queryKey: ['incomeAnalytics', period],
    queryFn: () => incomeService.getIncomeAnalytics({ period }),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Income Analytics</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last 365 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Category */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">By Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.by_category || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="category"
                >
                  {(data?.by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Trend */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Daily Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.daily_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Givers */}
      {data?.top_givers && data.top_givers.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Top Givers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.top_givers.map((giver, index) => (
              <div key={giver.member.id} className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[rgb(31,178,86)] rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{giver.member.name}</p>
                  <p className="text-xs text-gray-500">{giver.member.email}</p>
                  <p className="text-sm font-bold text-[rgb(31,178,86)] mt-1">
                    {formatCurrency(giver.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Income Page Component
export default function IncomePage() {
  const [view, setView] = useState('list');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Income Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              view === 'list' 
                ? 'bg-[rgb(31,178,86)] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              view === 'analytics' 
                ? 'bg-[rgb(31,178,86)] text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      <Routes>
        <Route index element={
          view === 'analytics' ? <IncomeAnalytics /> : <IncomeListPage />
        } />
        <Route path="add" element={<AddIncomePage />} />
      </Routes>
    </div>
  );
}