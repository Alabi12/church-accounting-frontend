import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          © {currentYear} Church Accounting System. All rights reserved.
        </p>
        <div className="flex space-x-4">
          <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Privacy Policy</a>
          <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Terms of Service</a>
          <a href="#" className="text-xs text-gray-400 hover:text-gray-600">Help</a>
        </div>
      </div>
    </footer>
  );
}