import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
  const colors = {
    warning: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
    },
    success: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const color = colors[type] || colors.warning;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 ${color.bg} flex items-start justify-between`}>
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className={`h-6 w-6 ${color.icon}`} />
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600">{message}</p>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-4 py-2 text-white rounded-lg ${color.button} transition-colors`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;