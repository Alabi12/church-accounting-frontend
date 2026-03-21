import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string().required('Church name is required'),
  legalName: yup.string(),
  address: yup.string(),
  city: yup.string(),
  state: yup.string(),
  postalCode: yup.string(),
  country: yup.string(),
  phone: yup.string(),
  email: yup.string().email('Invalid email format'),
  website: yup.string().url('Invalid URL format'),
  taxId: yup.string(),
  foundedDate: yup.string(),
  pastorName: yup.string(),
  associatePastor: yup.string(),
  denomination: yup.string(),
  serviceTimes: yup.string(),
  description: yup.string(),
});

const ChurchSettings = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [churchData, setChurchData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {},
  });

  useEffect(() => {
    fetchChurchData();
  }, []);

  const fetchChurchData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getChurchSettings();
      setChurchData(data);
      reset(data);
    } catch (error) {
      console.error('Error fetching church data:', error);
      toast.error('Failed to load church settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      await adminService.updateChurchSettings(data);
      toast.success('Church settings updated successfully');
    } catch (error) {
      console.error('Error updating church settings:', error);
      toast.error(error.response?.data?.error || 'Failed to update church settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Church Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your church's information and details
          </p>
        </div>

        {/* Church Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Church Information
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Church Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className={`
                      w-full px-4 py-2 border-2 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${errors.name
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                      }
                    `}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    {...register('legalName')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  placeholder="Brief description of your church..."
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="info@church.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                    Website
                  </label>
                  <input
                    type="url"
                    {...register('website')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="https://www.church.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID / EIN
                  </label>
                  <input
                    type="text"
                    {...register('taxId')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900">Address</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Street Address
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  placeholder="123 Church Street"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    {...register('state')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    {...register('postalCode')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  placeholder="Ghana"
                />
              </div>
            </div>

            {/* Leadership */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900">Leadership</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <UserIcon className="h-4 w-4 inline mr-1" />
                    Senior Pastor
                  </label>
                  <input
                    type="text"
                    {...register('pastorName')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="Pastor John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Associate Pastor
                  </label>
                  <input
                    type="text"
                    {...register('associatePastor')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Denomination
                </label>
                <input
                  type="text"
                  {...register('denomination')}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  placeholder="e.g., Baptist, Methodist, Pentecostal"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Founded Date
                  </label>
                  <input
                    type="date"
                    {...register('foundedDate')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <ClockIcon className="h-4 w-4 inline mr-1" />
                    Service Times
                  </label>
                  <input
                    type="text"
                    {...register('serviceTimes')}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    placeholder="Sundays 9:00 AM & 11:00 AM"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={fetchChurchData}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChurchSettings;