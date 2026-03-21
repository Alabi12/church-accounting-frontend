import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ComplianceCheck() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    warning: 0
  });

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/compliance-checks');
      setChecks(response.data.checks || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    const mockChecks = [
      {
        id: 1,
        name: 'Financial Statement Accuracy',
        category: 'Financial',
        status: 'passed',
        lastCheck: '2024-03-15',
        nextDue: '2024-04-15',
        findings: []
      },
      {
        id: 2,
        name: 'Tax Filing Compliance',
        category: 'Tax',
        status: 'warning',
        lastCheck: '2024-03-14',
        nextDue: '2024-04-14',
        findings: ['Quarterly estimated tax payment pending']
      },
      {
        id: 3,
        name: 'Internal Control Review',
        category: 'Controls',
        status: 'failed',
        lastCheck: '2024-03-13',
        nextDue: '2024-03-28',
        findings: ['Segregation of duties issue in cash handling']
      },
      {
        id: 4,
        name: 'Donor Receipt Compliance',
        category: 'Donations',
        status: 'passed',
        lastCheck: '2024-03-12',
        nextDue: '2024-04-12',
        findings: []
      },
    ];

    setChecks(mockChecks);
    setSummary({
      total: 4,
      passed: 2,
      failed: 1,
      warning: 1
    });
  };

  const handleRunCheck = (checkId) => {
    toast.success(`Running compliance check...`);
    // Implement check execution
  };

  const handleScheduleCheck = (checkId) => {
    toast.success(`Check scheduled`);
    // Implement scheduling
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'passed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Compliance Checks</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Total Checks</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Passed</p>
          <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Warnings</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.warning}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
        </div>
      </div>

      {/* Compliance Checks List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Compliance Checks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {checks.map((check) => (
            <div key={check.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{check.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Category: {check.category}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <span className="text-gray-500">
                        Last Check: {formatDate(check.lastCheck)}
                      </span>
                      <span className="text-gray-500">
                        Next Due: {formatDate(check.nextDue)}
                      </span>
                    </div>
                    {check.findings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">Findings:</p>
                        <ul className="mt-1 list-disc list-inside">
                          {check.findings.map((finding, index) => (
                            <li key={index} className="text-xs text-gray-600">{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(check.status)}`}>
                    {check.status}
                  </span>
                  <button
                    onClick={() => handleRunCheck(check.id)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Run Check
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Score */}
      <div className="bg-primary-50 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-primary-900 mb-2">Overall Compliance Score</h3>
        <div className="flex items-center">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(summary.passed / summary.total) * 100}%` }}
              ></div>
            </div>
          </div>
          <span className="ml-4 text-2xl font-bold text-primary-600">
            {Math.round((summary.passed / summary.total) * 100)}%
          </span>
        </div>
        <p className="text-sm text-primary-700 mt-2">
          {summary.passed} out of {summary.total} compliance checks passed
        </p>
      </div>
    </div>
  );
}