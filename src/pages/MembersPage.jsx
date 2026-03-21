import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '../services/members';
import { 
  PlusIcon, 
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  XCircleIcon,
  UserGroupIcon,
  CheckCircleIcon,
  HeartIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AddMember from '../components/members/AddMember';
import MembersList from '../components/members/MembersList';
import EditMemberModal from '../components/members/EditMemberModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Members List Component
function MembersListPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    isTither: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showGivingHistory, setShowGivingHistory] = useState(false);
  const [givingHistory, setGivingHistory] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['members', page, filters],
    queryFn: () => memberService.getMembers({ 
      page, 
      perPage: 10,
      ...filters 
    }),
  });

  const queryClient = useQueryClient();
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => memberService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['members']);
      toast.success('Member deleted successfully');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete member');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => memberService.updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['members']);
      toast.success('Member updated successfully');
      setShowEditModal(false);
      setEditingMember(null);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update member');
    },
  });

  const handleEdit = (member) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setShowDetails(true);
  };

  const handleViewGiving = async (member) => {
    try {
      const data = await memberService.getMemberGiving(member.id);
      setGivingHistory(data);
      setSelectedMember(member);
      setShowGivingHistory(true);
    } catch (error) {
      toast.error('Failed to load giving history');
    }
  };

  const handleUpdateSubmit = (formData) => {
    if (!editingMember) return;
    
    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      dateOfBirth: formData.dateOfBirth || null,
      joinDate: formData.joinDate,
      status: formData.status,
      givingPreference: formData.givingPreference || null,
      isTither: formData.isTither,
    };
    
    updateMutation.mutate({ 
      id: editingMember.id, 
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
      status: '',
      isTither: '',
      search: ''
    });
    setPage(1);
  };

  const handleExport = () => {
    memberService.exportMembers(filters);
  };

  const getStatusBadge = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      TRANSFERRED: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="bg-white shadow sm:rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-medium text-gray-900">Church Members</h2>
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
              to="/members/add"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[rgb(31,178,86)] hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Member
            </Link>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <form onSubmit={handleSearch} className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="TRANSFERRED">Transferred</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tither Status</label>
                <select
                  name="isTither"
                  value={filters.isTither}
                  onChange={handleFilterChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Tither</option>
                  <option value="false">Non-Tither</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search by name, email..."
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-xl font-bold text-gray-900">{data.summary.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-xl font-bold text-green-600">{data.summary.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <HeartIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Tithers</p>
                <p className="text-xl font-bold text-purple-600">{data.summary.tithers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">New This Month</p>
                <p className="text-xl font-bold text-orange-600">{data.summary.newThisMonth || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <MembersList 
          members={data?.members || []} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleViewDetails}
          onViewGiving={handleViewGiving}
        />

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            {/* Pagination component same as before */}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedMember && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Member Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <dl className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-800 text-2xl font-bold">
                    {selectedMember.firstName?.[0]}{selectedMember.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedMember.fullName}</h3>
                  <p className="text-sm text-gray-500">Member since {formatDate(selectedMember.joinDate)}</p>
                  <p className="text-xs text-gray-400">#{selectedMember.membershipNumber}</p>
                </div>
                <div className="ml-auto">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedMember.status)}`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd className="text-sm">{selectedMember.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="text-sm">{selectedMember.phone || '-'}</dd>
                </div>
              </div>

              <div>
                <dt className="text-xs text-gray-500">Address</dt>
                <dd className="text-sm">{selectedMember.address || '-'}</dd>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-500">Date of Birth</dt>
                  <dd className="text-sm">{selectedMember.dateOfBirth ? formatDate(selectedMember.dateOfBirth) : '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Giving Preference</dt>
                  <dd className="text-sm capitalize">{selectedMember.givingPreference || '-'}</dd>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-500">Total Given</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCurrency(selectedMember.totalGiven || 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Tither</dt>
                  <dd className="text-sm">{selectedMember.isTither ? 'Yes' : 'No'}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Giving History Modal */}
      {showGivingHistory && selectedMember && givingHistory && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Giving History - {selectedMember.fullName}
              </h2>
              <button
                onClick={() => setShowGivingHistory(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Total Given</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(givingHistory.totalGiven)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Number of Gifts</p>
                  <p className="text-2xl font-bold text-blue-700">{givingHistory.transactions?.length || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600">Average Gift</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(givingHistory.totalGiven / (givingHistory.transactions?.length || 1))}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Transaction History</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Transaction #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {givingHistory.transactions?.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatDate(tx.date)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{tx.transactionNumber}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{tx.category}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{tx.description}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <EditMemberModal
          member={editingMember}
          onSubmit={handleUpdateSubmit}
          onClose={() => {
            setShowEditModal(false);
            setEditingMember(null);
          }}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  );
}

// Add Member Component
function AddMemberPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => memberService.createMember(data),
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries(['members']);
      navigate('/members');
    },
    onError: (error) => {
      console.error('Error:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to add member');
      setIsSubmitting(false);
    },
  });

  const onSubmit = (formData) => {
    const apiData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      dateOfBirth: formData.dateOfBirth || null,
      joinDate: formData.joinDate,
      status: formData.status,
      givingPreference: formData.givingPreference || null,
      isTither: formData.isTither,
    };
    
    setIsSubmitting(true);
    mutation.mutate(apiData);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Member</h2>
        <AddMember 
          onSubmit={onSubmit} 
          isLoading={mutation.isLoading || isSubmitting} 
        />
      </div>
    </div>
  );
}

// Analytics Component
function MembersAnalytics() {
  const [period, setPeriod] = useState('month');
  const { data, isLoading } = useQuery({
    queryKey: ['membersAnalytics', period],
    queryFn: () => memberService.getMembersAnalytics({ period }),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Members Analytics</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
        >
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last 365 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Status Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Member Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {(data?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Growth */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Member Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.growthData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="newMembers" stroke="#8884d8" name="New Members" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tither Stats */}
      {data?.titherStats && (
        <div className="mt-6 bg-primary-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-primary-900 mb-2">Tither Statistics</h3>
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-xs text-primary-700">Total Tithers</p>
              <p className="text-2xl font-bold text-primary-600">{data.titherStats.total}</p>
            </div>
            <div className="h-8 w-px bg-primary-200"></div>
            <div>
              <p className="text-xs text-primary-700">Percentage</p>
              <p className="text-2xl font-bold text-primary-600">{data.titherStats.percentage}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Members Page Component
export default function MembersPage() {
  const [view, setView] = useState('list');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
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
          view === 'analytics' ? <MembersAnalytics /> : <MembersListPage />
        } />
        <Route path="add" element={<AddMemberPage />} />
      </Routes>
    </div>
  );
}