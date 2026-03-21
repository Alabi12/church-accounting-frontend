import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import toast from 'react-hot-toast';

const schema = yup.object({
  code: yup.string().required('Account code is required').min(1, 'Code is required'),
  name: yup.string().required('Account name is required'),
  type: yup.string().required('Account type is required'),
  category: yup.string().nullable(),
  description: yup.string().nullable(),
  openingBalance: yup.number().min(0, 'Opening balance must be positive').nullable(),
  isActive: yup.boolean(),
});

const AccountForm = ({ account, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const accountTypes = accountantService.getAccountTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      code: account?.code || '',
      name: account?.name || '',
      type: account?.type?.toLowerCase() || 'asset', // Convert to lowercase for display
      category: account?.category || '',
      description: account?.description || '',
      openingBalance: account?.openingBalance || 0,
      isActive: account?.isActive ?? true,
    },
  });

  const watchType = watch('type');

  // Set default category based on type
  useEffect(() => {
    if (!account && watchType) {
      const defaultCategories = {
        asset: 'CURRENT_ASSET',
        liability: 'CURRENT_LIABILITY',
        equity: 'EQUITY',
        income: 'OPERATING_INCOME',
        expense: 'OPERATING_EXPENSE',
      };
      setValue('category', defaultCategories[watchType] || '');
    }
  }, [watchType, setValue, account]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      // Transform data for backend
      const transformedData = {
        ...data,
        // Convert type to uppercase for backend
        type: data.type.toUpperCase(),
        // Ensure category is uppercase if provided
        category: data.category ? data.category.toUpperCase() : '',
        // Ensure openingBalance is a number
        openingBalance: parseFloat(data.openingBalance) || 0,
        // Trim string fields
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || '',
      };

      console.log('Submitting transformed data:', transformedData);
      
      if (account) {
        await accountantService.updateAccount(account.id, transformedData);
        toast.success('Account updated successfully');
      } else {
        await accountantService.createAccount(transformedData);
        toast.success('Account created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving account:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save account';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {account ? 'Edit Account' : 'Create New Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('code')}
                disabled={!!account}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
                  errors.code ? 'border-red-300' : ''
                } ${account ? 'bg-gray-100' : ''}`}
                placeholder="e.g., 1001"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
                  errors.name ? 'border-red-300' : ''
                }`}
                placeholder="e.g., Cash"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type')}
                disabled={!!account}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
                  errors.type ? 'border-red-300' : ''
                } ${account ? 'bg-gray-100' : ''}`}
              >
                {accountTypes.map(type => (
                  <option key={type.id} value={type.id.toLowerCase()}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                {...register('category')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                placeholder="e.g., CURRENT_ASSET"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional. Use uppercase with underscores.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
              placeholder="Brief description of the account purpose"
            />
          </div>

          {!account && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Opening Balance</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('openingBalance')}
                  className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                  placeholder="0.00"
                />
              </div>
              {errors.openingBalance && (
                <p className="mt-1 text-xs text-red-600">{errors.openingBalance.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Active Account
            </label>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Account code and type cannot be changed after creation.
              Opening balance sets the initial account balance.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[rgb(31,178,86)] hover:bg-[rgb(25,142,69)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center">
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </span>
              ) : (
                account ? 'Update Account' : 'Create Account'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AccountForm;