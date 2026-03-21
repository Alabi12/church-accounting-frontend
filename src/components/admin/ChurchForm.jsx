// components/admin/ChurchForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ChurchForm = ({ church, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: church?.name || '',
    address: church?.address || '',
    city: church?.city || '',
    state: church?.state || '',
    country: church?.country || 'Ghana',
    phone: church?.phone || '',
    email: church?.email || '',
    website: church?.website || '',
    tax_id: church?.tax_id || '',
    founded_date: church?.founded_date?.split('T')[0] || '',
    description: church?.description || '',
    is_active: church?.is_active ?? true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Church name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      await onSubmit(formData);
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
            {church ? 'Edit Church' : 'Create New Church'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Church Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Church Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
                  errors.name ? 'border-red-300' : ''
                }`}
                placeholder="Enter church name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Contact Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                placeholder="+233 XXX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
                  errors.email ? 'border-red-300' : ''
                }`}
                placeholder="church@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm ${
                  errors.website ? 'border-red-300' : ''
                }`}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="mt-1 text-xs text-red-600">{errors.website}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID</label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                placeholder="Registration number"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State/Region</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                placeholder="State or region"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                placeholder="Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Founded Date</label>
              <input
                type="date"
                name="founded_date"
                value={formData.founded_date}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] sm:text-sm"
                placeholder="Brief description of the church"
              />
            </div>

            {/* Active Status */}
            <div className="col-span-2 flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active Church
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
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
                church ? 'Update Church' : 'Create Church'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ChurchForm;