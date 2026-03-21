import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PrinterIcon,
  CakeIcon,
  BriefcaseIcon,
  HeartIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
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
} from 'recharts';
import { memberService } from '../../services/members';
import { incomeService } from '../../services/income';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const MemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [givingData, setGivingData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    fetchMemberData();
  }, [id, selectedYear]);

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      const [memberDetails, givingHistory] = await Promise.all([
        memberService.getMemberById(id),
        memberService.getMemberGiving(id, selectedYear),
      ]);
      setMember(memberDetails);
      setGivingData(givingHistory);
    } catch (error) {
      console.error('Error fetching member data:', error);
      toast.error('Failed to load member details');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await memberService.deleteMember(id);
      toast.success('Member deactivated successfully');
      navigate('/members');
    } catch (error) {
      console.error('Error deactivating member:', error);
      toast.error('Failed to deactivate member');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const years = [
    new Date().getFullYear() - 2,
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
  ];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0">
        {/* Header - Hidden when printing */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate('/members')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Members
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print
            </button>
            <Link
              to={`/members/edit/${id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit
            </Link>
            {member.isActive && (
              <button
                onClick={() => setDeleteDialog(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Deactivate
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none">
              <div className="bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] px-6 py-8 print:bg-gray-100">
                <div className="flex flex-col items-center">
                  <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center mb-4 print:bg-gray-200">
                    <UserIcon className="h-12 w-12 text-white print:text-gray-700" />
                  </div>
                  <h2 className="text-xl font-bold text-white print:text-gray-900">{member.fullName}</h2>
                  <p className="text-sm text-green-100 mt-1 print:text-gray-600">
                    Member since {formatDate(member.createdAt, 'year')}
                  </p>
                  <span
                    className={`mt-3 px-3 py-1 text-sm rounded-full print:bg-gray-200 print:text-gray-700 ${
                      member.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {member.email && (
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium break-all">{member.email}</p>
                    </div>
                  </div>
                )}

                {member.phone && (
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium">{member.phone}</p>
                    </div>
                  </div>
                )}

                {member.address && (
                  <div className="flex items-start space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium">{member.address}</p>
                    </div>
                  </div>
                )}

                {member.dateOfBirth && (
                  <div className="flex items-center space-x-3">
                    <CakeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date of Birth</p>
                      <p className="text-sm font-medium">{formatDate(member.dateOfBirth)}</p>
                    </div>
                  </div>
                )}

                {member.occupation && (
                  <div className="flex items-center space-x-3">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Occupation</p>
                      <p className="text-sm font-medium">{member.occupation}</p>
                    </div>
                  </div>
                )}

                {member.maritalStatus && (
                  <div className="flex items-center space-x-3">
                    <HeartIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Marital Status</p>
                      <p className="text-sm font-medium capitalize">{member.maritalStatus}</p>
                    </div>
                  </div>
                )}

                {member.anniversary && (
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Anniversary</p>
                      <p className="text-sm font-medium">{formatDate(member.anniversary)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Giving Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Giving Summary</h3>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                {givingData && (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 mb-1">Total Given</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(givingData.totalGiven)}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 mb-1">Transactions</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {givingData.transactionCount}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 mb-1">Average Gift</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {formatCurrency(givingData.transactionCount > 0
                            ? givingData.totalGiven / givingData.transactionCount
                            : 0)}
                        </p>
                      </div>
                    </div>

                    {/* Monthly Breakdown Chart */}
                    {givingData.monthlyBreakdown && givingData.monthlyBreakdown.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Monthly Giving</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={givingData.monthlyBreakdown}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis tickFormatter={(value) => formatCurrency(value)} />
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#8884d8"
                                fill="#8884d8"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Category Breakdown */}
                    {givingData.categoryBreakdown && givingData.categoryBreakdown.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-4">Giving by Category</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={givingData.categoryBreakdown}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="total"
                                  nameKey="category"
                                >
                                  {givingData.categoryBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2">
                            {givingData.categoryBreakdown.map((cat, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <span className="text-sm text-gray-600">{cat.category}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(cat.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {givingData?.transactions && givingData.transactions.length > 0 ? (
                      givingData.transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.description || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.category?.replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                            +{formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.reference || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.status === 'posted' 
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No transactions found for {selectedYear}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Notes Section */}
          {member.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{member.notes}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog}
          onClose={() => setDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Deactivate Member"
          message="Are you sure you want to deactivate this member? They will no longer be active in the system."
          confirmText="Deactivate"
          type="warning"
        />
      </div>
    </div>
  );
};

export default MemberDetails;