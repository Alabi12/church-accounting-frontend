import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function RiskAssessment() {
  const [loading, setLoading] = useState(true);
  const [riskScores, setRiskScores] = useState([]);
  const [riskMatrix, setRiskMatrix] = useState([]);
  const [highRiskAreas, setHighRiskAreas] = useState([]);
  const [overallRisk, setOverallRisk] = useState({
    score: 0,
    level: 'Low',
    trend: 'stable'
  });

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/audit/risk-assessment');
      setRiskScores(response.data.riskScores || []);
      setRiskMatrix(response.data.riskMatrix || []);
      setHighRiskAreas(response.data.highRiskAreas || []);
      setOverallRisk(response.data.overallRisk || {});
    } catch (error) {
      console.error('Error fetching risk data:', error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setRiskScores([
      { category: 'Financial', value: 65, fullMark: 100 },
      { category: 'Operational', value: 42, fullMark: 100 },
      { category: 'Compliance', value: 28, fullMark: 100 },
      { category: 'Reputational', value: 35, fullMark: 100 },
      { category: 'Strategic', value: 55, fullMark: 100 },
      { category: 'Fraud', value: 48, fullMark: 100 },
    ]);

    setRiskMatrix([
      { name: 'Cash Handling', probability: 70, impact: 85, risk: 59.5 },
      { name: 'Vendor Payments', probability: 45, impact: 60, risk: 27 },
      { name: 'Donor Records', probability: 30, impact: 75, risk: 22.5 },
      { name: 'Payroll', probability: 25, impact: 80, risk: 20 },
      { name: 'Investments', probability: 15, impact: 90, risk: 13.5 },
      { name: 'IT Security', probability: 40, impact: 70, risk: 28 },
    ]);

    setHighRiskAreas([
      { area: 'Cash Handling', riskLevel: 'High', mitigation: 'Implement dual control', deadline: '2024-04-30' },
      { area: 'Vendor Setup', riskLevel: 'High', mitigation: 'Add approval workflow', deadline: '2024-04-15' },
      { area: 'Bank Reconciliation', riskLevel: 'Medium', mitigation: 'Weekly reviews', deadline: '2024-03-31' },
    ]);

    setOverallRisk({
      score: 45.5,
      level: 'Medium',
      trend: 'decreasing'
    });
  };

  const getRiskLevel = (score) => {
    if (score >= 70) return { level: 'Critical', color: 'text-red-600 bg-red-100' };
    if (score >= 50) return { level: 'High', color: 'text-orange-600 bg-orange-100' };
    if (score >= 30) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    return { level: 'Low', color: 'text-green-600 bg-green-100' };
  };

  const getImpactColor = (impact) => {
    if (impact >= 70) return 'text-red-600';
    if (impact >= 50) return 'text-orange-600';
    if (impact >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Risk Assessment</h1>
        <button
          onClick={fetchRiskData}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Recalculate Risk
        </button>
      </div>

      {/* Overall Risk Score */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Overall Risk Score</p>
            <div className="flex items-baseline space-x-3">
              <p className="text-4xl font-bold text-gray-900">{overallRisk.score}</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                overallRisk.level === 'Low' ? 'bg-green-100 text-green-800' :
                overallRisk.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {overallRisk.level}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Trend: {overallRisk.trend === 'increasing' ? '↑' : '↓'} {overallRisk.trend}
            </p>
          </div>
          <ShieldExclamationIcon className="h-16 w-16 text-gray-300" />
        </div>
      </div>

      {/* Risk Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Risk Categories</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskScores}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Risk Score" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Risk Matrix</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskMatrix}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="probability" fill="#8884d8" name="Probability" />
                <Bar dataKey="impact" fill="#82ca9d" name="Impact" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Risk Analysis */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Detailed Risk Analysis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Area</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Probability</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mitigation</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {riskMatrix.map((item, index) => {
                const riskLevel = getRiskLevel(item.risk);
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      <span className={getImpactColor(item.probability)}>
                        {item.probability}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      <span className={getImpactColor(item.impact)}>
                        {item.impact}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {item.risk.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${riskLevel.color}`}>
                        {riskLevel.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {highRiskAreas.find(area => area.area === item.name)?.mitigation || 'Review required'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* High Risk Areas */}
      <div className="bg-red-50 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-red-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          High Risk Areas Requiring Immediate Attention
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highRiskAreas.map((area, index) => (
            <div key={index} className="bg-white border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{area.area}</h3>
              <p className="text-sm text-red-600 mt-1">Risk Level: {area.riskLevel}</p>
              <p className="text-sm text-gray-600 mt-2">Mitigation: {area.mitigation}</p>
              <p className="text-xs text-gray-500 mt-2">Deadline: {new Date(area.deadline).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}