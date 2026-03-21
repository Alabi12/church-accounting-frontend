import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  EyeIcon, 
  EyeSlashIcon,
  EnvelopeIcon,
  KeyIcon,
  ArrowRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import logo from '../../assets/pcg-logo.jpg';

const schema = yup.object({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      
      if (rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      
      toast.success('Welcome back!', {
        icon: '👋',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid email or password', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#FEE2E2',
          color: '#991B1B',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[rgb(31,178,86)] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {/* Logo and Title Section */}
            <motion.div variants={fadeInUp} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[rgb(31,178,86)] rounded-full blur-lg opacity-50"></div>
                  <img 
                    src={logo} 
                    alt="PCG Logo" 
                    className="h-20 w-auto relative z-10 rounded-full border-4 border-white shadow-lg"
                  />
                </div>
              </div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
              >
                Presbyterian Church of Ghana
              </motion.h1>
              
              <motion.h2 
                variants={fadeInUp}
                className="mt-2 text-xl font-semibold text-gray-700"
              >
                Zimmermann Memorial Congregation
              </motion.h2>
              
              <motion.p 
                variants={fadeInUp}
                className="mt-2 text-sm text-gray-500"
              >
                Nungua • Est. 1965
              </motion.p>
            </motion.div>

            {/* Welcome Message */}
            <motion.div 
              variants={fadeInUp}
              className="bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] rounded-xl p-4 text-white shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-6 w-6" />
                <div>
                  <p className="font-medium">Welcome Back!</p>
                  <p className="text-sm opacity-90">Sign in to access your account</p>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.form 
              variants={fadeInUp}
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-6"
            >
              {/* Email Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={`
                      block w-full pl-10 pr-3 py-3 border-2 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      transition-all duration-200
                      ${errors.email 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                      }
                    `}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 mt-1"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`
                      block w-full pl-10 pr-12 py-3 border-2 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                      transition-all duration-200
                      ${errors.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                      }
                    `}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 mt-1"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded transition-colors"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] hover:from-[rgb(25,142,69)] hover:to-[rgb(31,178,86)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Sign in
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </span>
                )}
              </motion.button>
            </motion.form>

            {/* Register Link */}
            <motion.div 
              variants={fadeInUp}
              className="text-center"
            >
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-[rgb(31,178,86)] hover:text-[rgb(25,142,69)] transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </motion.div>

            {/* Security Badge */}
            <motion.div 
              variants={fadeInUp}
              className="flex items-center justify-center space-x-2 text-xs text-gray-400"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Secured by 256-bit encryption</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-4 text-center text-xs text-gray-500"
        >
          © {new Date().getFullYear()} Presbyterian Church of Ghana. All rights reserved.
        </motion.p>
      </motion.div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}