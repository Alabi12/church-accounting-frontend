// components/admin/ChurchManagement.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { churchService } from '../../services/church';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ChurchForm from './ChurchForm';
import ChurchStats from './ChurchStats';

const ChurchManagement = () => {
  const { user } = useAuth();
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const response = await churchService.getChurches();
      setChurches(response.churches || []);
    } catch (error) {
      console.error('Error fetching churches:', error);
      toast.error('Failed to load churches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChurch = async (data) => {
    try {
      const response = await churchService.createChurch(data);
      toast.success('Church created successfully');
      setShowForm(false);
      fetchChurches();
    } catch (error) {
      console.error('Error creating church:', error);
      toast.error(error.response?.data?.error || 'Failed to create church');
    }
  };

  const handleUpdateChurch = async (churchId, data) => {
    try {
      const response = await churchService.updateChurch(churchId, data);
      toast.success('Church updated successfully');
      setShowForm(false);
      setSelectedChurch(null);
      fetchChurches();
    } catch (error) {
      console.error('Error updating church:', error);
      toast.error(error.response?.data?.error || 'Failed to update church');
    }
  };

  const handleDeleteChurch = async (churchId) => {
    if (!window.confirm('Are you sure you want to delete this church?')) return;
    
    try {
      await churchService.deleteChurch(churchId);
      toast.success('Church deleted successfully');
      fetchChurches();
    } catch (error) {
      console.error('Error deleting church:', error);
      toast.error(error.response?.data?.error || 'Failed to delete church');
    }
  };

  const handleViewStats = async (church) => {
    try {
      const response = await churchService.getChurchStats(church.id);
      setStats(response);
      setSelectedChurch(church);
      setShowStats(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load church statistics');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(31,178,86)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Church Management</h1>
          <p className="text-sm text-gray-600">Manage churches and their settings</p>
        </div>
        <button
          onClick={() => {
            setSelectedChurch(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Church
        </button>
      </div>

      {/* Churches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {churches.map((church) => (
          <motion.div
            key={church.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[rgb(31,178,86)] bg-opacity-10 rounded-lg">
                    <BuildingOfficeIcon className="h-6 w-6 text-[rgb(31,178,86)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{church.name}</h3>
                    <p className="text-sm text-gray-500">{church.city || 'No city'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  church.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {church.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {church.email || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Phone:</span> {church.phone || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tax ID:</span> {church.tax_id || 'N/A'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => handleViewStats(church)}
                  className="p-2 text-gray-600 hover:text-[rgb(31,178,86)] hover:bg-gray-100 rounded-lg transition-colors"
                  title="View Statistics"
                >
                  <ChartBarIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedChurch(church);
                    setShowForm(true);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Church"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteChurch(church.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Delete Church"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {churches.length === 0 && !loading && (
          <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Churches Found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first church.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Church
            </button>
          </div>
        )}
      </div>

      {/* Church Form Modal */}
      {showForm && (
        <ChurchForm
          church={selectedChurch}
          onClose={() => {
            setShowForm(false);
            setSelectedChurch(null);
          }}
          onSubmit={selectedChurch ? 
            (data) => handleUpdateChurch(selectedChurch.id, data) : 
            handleCreateChurch
          }
        />
      )}

      {/* Church Stats Modal */}
      {showStats && stats && (
        <ChurchStats
          church={selectedChurch}
          stats={stats}
          onClose={() => {
            setShowStats(false);
            setSelectedChurch(null);
            setStats(null);
          }}
        />
      )}
    </div>
  );
};

export default ChurchManagement;