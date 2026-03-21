// components/admin/ChurchStats.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  XCircleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const ChurchStats = ({ church, stats, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.stats.users,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Accounts',
      value: stats.stats.accounts,
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    {
      title: 'Total Members',
      value: stats.stats.members,
      icon: UsersIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Transactions',
      value: stats.stats.transactions,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    }
  ];

  const financialCards = [
    {
      title: 'Total Income',
      value: formatCurrency(stats.stats.total_income),
      icon: CurrencyDollarIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.stats.total_expense),
      icon: CurrencyDollarIcon,
      color: 'bg-red-500'
    },
    {
      title: 'Net Balance',
      value: formatCurrency(stats.stats.net_balance),
      icon: CurrencyDollarIcon,
      color: stats.stats.net_balance >= 0 ? 'bg-blue-500' : 'bg-red-500'
    }
  ];

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{church.name}</h2>
            <p className="text-sm text-gray-600">Church Statistics & Overview</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Church Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium">{church.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium">{church.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">City</p>
              <p className="text-sm font-medium">{church.city || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tax ID</p>
              <p className="text-sm font-medium">{church.tax_id || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Financial Summary */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {financialCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${card.color} bg-opacity-10 rounded-lg`}>
                  <card.icon className={`h-5 w-5 ${card.color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.title}</p>
                  <p className={`text-lg font-bold ${
                    card.title === 'Net Balance' 
                      ? stats.stats.net_balance >= 0 ? 'text-green-600' : 'text-red-600'
                      : 'text-gray-900'
                  }`}>
                    {card.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChurchStats;