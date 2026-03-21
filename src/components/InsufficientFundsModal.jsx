// components/InsufficientFundsModal.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const InsufficientFundsModal = ({ isOpen, onClose, errors, accountBalances }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-red-600">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-bold">Insufficient Funds</h2>
          </div>
          <button onClick={onClose}>
            <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            The following accounts have insufficient balance for this transaction:
          </p>
          
          <div className="bg-red-50 rounded-lg p-4 space-y-2">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">
                • {error}
              </p>
            ))}
          </div>
          
          {accountBalances && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Balances:</p>
              {Object.entries(accountBalances).map(([account, balance]) => (
                <p key={account} className="text-xs text-gray-600">
                  {account}: GHS {balance.toFixed(2)}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InsufficientFundsModal;