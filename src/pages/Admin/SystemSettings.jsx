import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  LockClosedIcon,
  BellIcon,
  EnvelopeIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const schema = yup.object({
  // General Settings
  siteName: yup.string().required('Site name is required'),
  siteUrl: yup.string().url('Must be a valid URL').required('Site URL is required'),
  adminEmail: yup.string().email('Invalid email').required('Admin email is required'),
  timezone: yup.string().required('Timezone is required'),
  dateFormat: yup.string().required('Date format is required'),
  currency: yup.string().required('Currency is required'),

  // Security Settings
  sessionTimeout: yup.number().positive().required('Session timeout is required'),
  maxLoginAttempts: yup.number().positive().required('Max login attempts is required'),
  passwordMinLength: yup.number().positive().min(6).required('Password min length is required'),
  requireTwoFactor: yup.boolean(),
  requireEmailVerification: yup.boolean(),

  // Notification Settings
  enableEmailNotifications: yup.boolean(),
  enablePushNotifications: yup.boolean(),
  notificationEmail: yup.string().email('Invalid email').when('enableEmailNotifications', {
    is: true,
    then: (schema) => schema.required('Notification email is required'),
  }),

  // Backup Settings
  enableAutoBackup: yup.boolean(),
  backupFrequency: yup.string().when('enableAutoBackup', {
    is: true,
    then: (schema) => schema.required('Backup frequency is required'),
  }),
  backupRetentionDays: yup.number().positive().when('enableAutoBackup', {
    is: true,
    then: (schema) => schema.required('Backup retention days is required'),
  }),
});

const timezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];

const dateFormats = [
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'MMMM DD, YYYY',
  'DD MMMM YYYY',
];

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'GHS', symbol: '₵', name: 'Ghana Cedi' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

const backupFrequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {},
  });

  const enableEmailNotifications = watch('enableEmailNotifications');
  const enableAutoBackup = watch('enableAutoBackup');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSystemSettings();
      reset(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      await adminService.updateSystemSettings(data);
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: GlobeAltIcon },
    { id: 'security', name: 'Security', icon: LockClosedIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'backup', name: 'Backup', icon: CloudArrowUpIcon },
  ];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure system-wide settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-[rgb(31,178,86)] text-[rgb(31,178,86)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('siteName')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.siteName
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    />
                    {errors.siteName && (
                      <p className="mt-1 text-xs text-red-600">{errors.siteName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      {...register('siteUrl')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.siteUrl
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    />
                    {errors.siteUrl && (
                      <p className="mt-1 text-xs text-red-600">{errors.siteUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('adminEmail')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.adminEmail
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    />
                    {errors.adminEmail && (
                      <p className="mt-1 text-xs text-red-600">{errors.adminEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('timezone')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.timezone
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    >
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                    {errors.timezone && (
                      <p className="mt-1 text-xs text-red-600">{errors.timezone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('dateFormat')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.dateFormat
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    >
                      {dateFormats.map(format => (
                        <option key={format} value={format}>{format}</option>
                      ))}
                    </select>
                    {errors.dateFormat && (
                      <p className="mt-1 text-xs text-red-600">{errors.dateFormat.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('currency')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.currency
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    >
                      {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {curr.name} ({curr.symbol})
                        </option>
                      ))}
                    </select>
                    {errors.currency && (
                      <p className="mt-1 text-xs text-red-600">{errors.currency.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Settings Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timeout (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('sessionTimeout')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.sessionTimeout
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    />
                    {errors.sessionTimeout && (
                      <p className="mt-1 text-xs text-red-600">{errors.sessionTimeout.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Login Attempts <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('maxLoginAttempts')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.maxLoginAttempts
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    />
                    {errors.maxLoginAttempts && (
                      <p className="mt-1 text-xs text-red-600">{errors.maxLoginAttempts.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Minimum Length <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('passwordMinLength')}
                      className={`
                        w-full px-4 py-2 border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${errors.passwordMinLength
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                        }
                      `}
                    />
                    {errors.passwordMinLength && (
                      <p className="mt-1 text-xs text-red-600">{errors.passwordMinLength.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('requireTwoFactor')}
                      className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Require Two-Factor Authentication for all users
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('requireEmailVerification')}
                      className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Require email verification for new users
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notifications Settings Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('enableEmailNotifications')}
                      className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Enable Email Notifications
                    </label>
                  </div>

                  {enableEmailNotifications && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notification Email
                      </label>
                      <input
                        type="email"
                        {...register('notificationEmail')}
                        className={`
                          w-full max-w-md px-4 py-2 border-2 rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-offset-2
                          ${errors.notificationEmail
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                          }
                        `}
                      />
                      {errors.notificationEmail && (
                        <p className="mt-1 text-xs text-red-600">{errors.notificationEmail.message}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('enablePushNotifications')}
                      className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Enable Push Notifications
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Backup Settings Tab */}
            {activeTab === 'backup' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup Settings</h2>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('enableAutoBackup')}
                      className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Enable Automatic Backups
                    </label>
                  </div>

                  {enableAutoBackup && (
                    <>
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Backup Frequency
                          </label>
                          <select
                            {...register('backupFrequency')}
                            className={`
                              w-full px-4 py-2 border-2 rounded-lg
                              focus:outline-none focus:ring-2 focus:ring-offset-2
                              ${errors.backupFrequency
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                              }
                            `}
                          >
                            {backupFrequencies.map(freq => (
                              <option key={freq.value} value={freq.value}>{freq.label}</option>
                            ))}
                          </select>
                          {errors.backupFrequency && (
                            <p className="mt-1 text-xs text-red-600">{errors.backupFrequency.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Backup Retention (days)
                          </label>
                          <input
                            type="number"
                            {...register('backupRetentionDays')}
                            className={`
                              w-full px-4 py-2 border-2 rounded-lg
                              focus:outline-none focus:ring-2 focus:ring-offset-2
                              ${errors.backupRetentionDays
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                              }
                            `}
                          />
                          {errors.backupRetentionDays && (
                            <p className="mt-1 text-xs text-red-600">{errors.backupRetentionDays.message}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={fetchSettings}
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
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;