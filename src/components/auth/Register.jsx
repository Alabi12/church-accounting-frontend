// src/components/auth/Register.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { UserIcon, EnvelopeIcon, LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth';
import toast from 'react-hot-toast';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  username: yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
});

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Prepare data in the format expected by backend
      const registrationData = {
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
      };
      
      console.log('📤 Sending registration data:', registrationData);
      
      const response = await authService.register(registrationData);
      console.log('✅ Registration response:', response);
      
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.status === 400) {
        toast.error('Invalid registration data. Please check your information.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-sm text-gray-600 mt-2">Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  {...register('firstName')}
                  className={`pl-10 w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                    errors.firstName
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                  placeholder="John"
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                {...register('lastName')}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  errors.lastName
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              {...register('username')}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                errors.username
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="johndoe123"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                {...register('email')}
                className={`pl-10 w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                {...register('password')}
                className={`pl-10 w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                {...register('confirmPassword')}
                className={`pl-10 w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Creating account...
                </span>
              ) : (
                'Sign up'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;