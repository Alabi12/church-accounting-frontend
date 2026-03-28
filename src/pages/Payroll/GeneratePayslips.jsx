import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ArrowLeftIcon,  // Already have this
  DocumentArrowDownIcon,  // This exists
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { payrollService } from '../../services/payrollService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GeneratePayslips = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState('');
  const [generationResult, setGenerationResult] = useState(null);

  useEffect(() => {
    fetchApprovedRuns();
  }, []);

  const fetchApprovedRuns = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getPayrollRuns({ status: 'POSTED' });
      setRuns(response.runs || []);
    } catch (error) {
      console.error('Error fetching runs:', error);
      toast.error('Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedRun) {
      toast.error('Please select a payroll run');
      return;
    }

    setGenerating(true);
    try {
      const response = await payrollService.generatePayslips(selectedRun);
      setGenerationResult(response);
      toast.success(response.message || 'Payslips generated successfully');
    } catch (error) {
      console.error('Error generating payslips:', error);
      toast.error(error.response?.data?.error || 'Failed to generate payslips');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const selectedRunData = runs.find(r => r.id === parseInt(selectedRun));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/payroll/runs')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Payroll Runs
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-6 w-6 text-white mr-2" />
              <h2 className="text-xl font-semibold text-white">Generate Payslips</h2>
            </div>
            <p className="text-sm text-blue-100 mt-1">
              Generate PDF payslips for employees from approved payroll runs
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Select Payroll Run */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Payroll Run
              </label>
              <select
                value={selectedRun}
                onChange={(e) => setSelectedRun(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a payroll run...</option>
                {runs.map(run => (
                  <option key={run.id} value={run.id}>
                    {run.run_number} - {formatDate(run.period_start)} to {formatDate(run.period_end)}
                  </option>
                ))}
              </select>
            </div>

            {/* Run Details */}
            {selectedRunData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Payroll Run Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Period</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedRunData.period_start)} - {formatDate(selectedRunData.period_end)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Gross</p>
                    <p className="text-sm font-medium text-green-600">{formatCurrency(selectedRunData.total_gross)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Net</p>
                    <p className="text-sm font-medium text-[rgb(31,178,86)]">{formatCurrency(selectedRunData.total_net)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {selectedRunData.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Generation Result */}
            {generationResult && (
              <div className={`rounded-lg p-4 ${generationResult.failed?.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-start">
                  {generationResult.failed?.length > 0 ? (
                    <XCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {generationResult.message}
                    </p>
                    {generationResult.generated?.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Generated {generationResult.generated.length} payslips
                      </p>
                    )}
                    {generationResult.failed?.length > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ⚠ Failed to generate {generationResult.failed.length} payslips
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/payroll/runs')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedRun || generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {generating ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Generate Payslips
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Information Card */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">About Payslip Generation</h4>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Payslips can only be generated for payroll runs with status "POSTED"</li>
            <li>Each payslip is generated as a PDF with employee details and calculations</li>
            <li>Generated payslips can be downloaded individually or emailed to employees</li>
            <li>You can view all payslips in the "Payslips" section</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GeneratePayslips;