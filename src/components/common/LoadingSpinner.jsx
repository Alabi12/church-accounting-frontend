import React from 'react';

export default function LoadingSpinner({ fullScreen = false }) {
  const spinner = (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}