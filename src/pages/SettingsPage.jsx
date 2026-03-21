import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BuildingOfficeIcon, 
  CurrencyDollarIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: BuildingOfficeIcon },
    { id: 'financial', name: 'Financial', icon: CurrencyDollarIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'language', name: 'Language', icon: LanguageIcon },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Church Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    defaultValue="My Church"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    defaultValue="123 Church Street"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Financial Settings</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fiscal Year Start</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option>January</option>
                    <option>February</option>
                    <option>March</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Session Timeout</h3>
                    <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
                  </div>
                  <select className="border-gray-300 rounded-md">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}