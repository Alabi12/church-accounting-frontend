import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/admin';
import toast from 'react-hot-toast';

// Add username uniqueness check to schema
const getSchema = (isNew) => yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  username: yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  password: yup.string().when([], {
    is: () => isNew,
    then: (schema) => schema
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
      .required('Password is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  role: yup.string().required('Role is required'),
  churchId: yup.number().nullable(),
  isActive: yup.boolean(),
  isVerified: yup.boolean(),
});

const UserForm = ({ user, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [churches, setChurches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  
  const isNew = !user;
  
  const schema = getSchema(isNew);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ...user,
      isNew,
      password: '',
      isActive: user?.isActive ?? true,
      isVerified: user?.isVerified ?? false,
    },
  });

  const username = watch('username');

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3 || !isNew) return;
    
    // Don't check if it's the same as the original username
    if (!isNew && username === user?.username) return;
    
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      setUsernameAvailable(null);
      setUsernameError(null);
      
      try {
        const response = await adminService.checkUsername(username);
        if (response.available) {
          setUsernameAvailable(true);
          clearErrors('username');
        } else {
          setUsernameAvailable(false);
          setUsernameError('Username is already taken');
          setError('username', { message: 'Username is already taken' });
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username, isNew, user, setError, clearErrors]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRoles(), fetchChurches()]);
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await adminService.getRoles();
      console.log('Roles fetched:', data);
      
      if (Array.isArray(data)) {
        setRoles(data);
      } else if (data.roles && Array.isArray(data.roles)) {
        setRoles(data.roles);
      } else if (data.data && Array.isArray(data.data)) {
        setRoles(data.data);
      } else {
        setRoles([]);
        console.warn('Unexpected roles response format:', data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const fetchChurches = async () => {
    try {
      const data = await adminService.getChurches();
      console.log('Churches fetched:', data);
      
      if (Array.isArray(data)) {
        setChurches(data);
      } else if (data.churches && Array.isArray(data.churches)) {
        setChurches(data.churches);
      } else if (data.data && Array.isArray(data.data)) {
        setChurches(data.data);
      } else {
        setChurches([]);
        console.warn('Unexpected churches response format:', data);
      }
    } catch (error) {
      console.error('Error fetching churches:', error);
      toast.error('Failed to load churches');
    }
  };

  const onSubmit = async (data) => {
    // Final validation for username availability
    if (isNew && (!usernameAvailable && usernameAvailable !== null)) {
      toast.error('Please choose a different username');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isNew) {
        await adminService.createUser(data);
        toast.success('User created successfully');
      } else {
        const { password, ...updateData } = data;
        await adminService.updateUser(user.id, updateData);
        toast.success('User updated successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      
      // Handle duplicate username error from backend
      if (error.response?.data?.error?.includes('UNIQUE constraint failed: users.username')) {
        setUsernameError('Username is already taken');
        setError('username', { message: 'Username is already taken' });
        toast.error('Username already exists. Please choose another.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to save user');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <ArrowPathIcon className="h-8 w-8 text-[rgb(31,178,86)] animate-spin mx-auto" />
          <p className="text-center mt-2">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isNew ? 'Add New User' : 'Edit User'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <EnvelopeIcon className="h-4 w-4 inline mr-1" />
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              className={`
                w-full px-4 py-2 border-2 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${errors.email
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                }
              `}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Username with Availability Check */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <UserIcon className="h-4 w-4 inline mr-1" />
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('username')}
                className={`
                  w-full px-4 py-2 border-2 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${(usernameError || errors.username)
                    ? 'border-red-300 focus:ring-red-500'
                    : usernameAvailable === true
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                  }
                `}
                placeholder="johndoe"
                disabled={!isNew}
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
                </div>
              )}
              {!checkingUsername && usernameAvailable === true && username && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {usernameError && (
              <p className="mt-1 text-xs text-red-600">{usernameError}</p>
            )}
            {errors.username && !usernameError && (
              <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
            )}
            {!usernameError && !errors.username && usernameAvailable === true && username && (
              <p className="mt-1 text-xs text-green-600">✓ Username is available</p>
            )}
            {!isNew && (
              <p className="mt-1 text-xs text-gray-500">Username cannot be changed after creation</p>
            )}
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('firstName')}
                className={`
                  w-full px-4 py-2 border-2 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${errors.firstName
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                  }
                `}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('lastName')}
                className={`
                  w-full px-4 py-2 border-2 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${errors.lastName
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                }
              `}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Password (only for new users) */}
          {isNew && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <LockClosedIcon className="h-4 w-4 inline mr-1" />
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                {...register('password')}
                className={`
                  w-full px-4 py-2 border-2 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${errors.password
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                  }
                `}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
              Role <span className="text-red-500">*</span>
            </label>
            <select
              {...register('role')}
              className={`
                w-full px-4 py-2 border-2 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${errors.role
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-[rgb(31,178,86)]'
                }
              `}
            >
              <option value="">Select role</option>
              {roles.map(role => (
                <option key={role.id || role.name} value={role.name}>
                  {role.name?.replace('_', ' ') || role}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Church */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
              Church (Optional)
            </label>
            <select
              {...register('churchId')}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
            >
              <option value="">Select church</option>
              {churches.map(church => (
                <option key={church.id} value={church.id}>{church.name}</option>
              ))}
            </select>
          </div>

          {/* Status Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active User
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('isVerified')}
                className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Verified User
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (isNew && (!usernameAvailable && username))}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-md hover:bg-[rgb(25,142,69)] disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                isNew ? 'Create User' : 'Update User'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UserForm;