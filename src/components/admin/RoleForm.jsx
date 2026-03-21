import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  XCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/admin';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup.string()
    .required('Role name is required')
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name must be at most 50 characters')
    .matches(/^[a-z_]+$/, 'Role name can only contain lowercase letters and underscores'),
  description: yup.string().max(200, 'Description must be at most 200 characters'),
});

const RoleForm = ({ role, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const isNew = !role;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: role || {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      if (isNew) {
        await adminService.createRole(data);
        toast.success('Role created successfully');
      } else {
        await adminService.updateRole(role.id, data);
        toast.success('Role updated successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(error.response?.data?.error || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isNew ? 'Create New Role' : 'Edit Role'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
              Role Name <span className="text-red-500">*</span>
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
              placeholder="e.g., manager, coordinator"
              disabled={!isNew && role?.name === 'super_admin'}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Use lowercase letters and underscores only (e.g., finance_manager)
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
              placeholder="Describe the role's purpose and responsibilities..."
              disabled={!isNew && role?.name === 'super_admin'}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
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
              disabled={submitting || (!isNew && role?.name === 'super_admin')}
              className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-md hover:bg-[rgb(25,142,69)] disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                isNew ? 'Create Role' : 'Update Role'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RoleForm;