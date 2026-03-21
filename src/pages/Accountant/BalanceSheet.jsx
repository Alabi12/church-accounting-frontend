// pages/Accountant/BalanceSheet.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  BriefcaseIcon,
  HomeIcon,
  TruckIcon,
  ComputerDesktopIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters';

const BalanceSheet = ({ data, asOf }) => {
  if (!data) return null;

  const { assets, liabilities, equity } = data;

  // Helper function to categorize assets
  const categorizeAssets = (assets) => {
    const current = [];
    const fixed = [];
    const other = [];

    (assets || []).forEach(asset => {
      const name = (asset.name || '').toLowerCase();
      const category = (asset.category || '').toLowerCase();

      // Current Assets
      if (category.includes('current') || 
          name.includes('cash') || 
          name.includes('bank') || 
          name.includes('petty') ||
          name.includes('account receivable') ||
          name.includes('inventory')) {
        current.push(asset);
      }
      // Fixed Assets
      else if (category.includes('fixed') || 
               category.includes('non-current') ||
               name.includes('building') || 
               name.includes('land') ||
               name.includes('equipment') || 
               name.includes('vehicle') ||
               name.includes('furniture') || 
               name.includes('computer')) {
        fixed.push(asset);
      }
      // Other Assets
      else {
        other.push(asset);
      }
    });

    return { current, fixed, other };
  };

  // Helper function to categorize liabilities
  const categorizeLiabilities = (liabilities) => {
    const current = [];
    const longTerm = [];

    (liabilities || []).forEach(liability => {
      const name = (liability.name || '').toLowerCase();
      const category = (liability.category || '').toLowerCase();

      // Current Liabilities (due within 1 year)
      if (category.includes('current') ||
          name.includes('payable') || 
          name.includes('accrued') ||
          name.includes('tax') || 
          name.includes('supplier')) {
        current.push(liability);
      }
      // Long-term Liabilities
      else {
        longTerm.push(liability);
      }
    });

    return { current, longTerm };
  };

  const categorizedAssets = categorizeAssets(assets);
  const categorizedLiabilities = categorizeLiabilities(liabilities);

  // Calculate totals
  const totalCurrentAssets = categorizedAssets.current.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalFixedAssets = categorizedAssets.fixed.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalOtherAssets = categorizedAssets.other.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalAssets = data.totalAssets || totalCurrentAssets + totalFixedAssets + totalOtherAssets;

  const totalCurrentLiabilities = categorizedLiabilities.current.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalLongTermLiabilities = categorizedLiabilities.longTerm.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalLiabilities = data.totalLiabilities || totalCurrentLiabilities + totalLongTermLiabilities;

  const totalEquity = data.totalEquity || (equity || []).reduce((sum, e) => sum + (e.amount || 0), 0);

  const checkBalance = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  // Icons mapping
  const getAssetIcon = (assetName, category) => {
    const name = (assetName || '').toLowerCase();
    const cat = (category || '').toLowerCase();
    
    if (name.includes('cash') || name.includes('bank') || name.includes('petty') || cat.includes('cash'))
      return <BanknotesIcon className="h-4 w-4 text-green-600" />;
    if (name.includes('building') || name.includes('land') || name.includes('property') || cat.includes('building'))
      return <HomeIcon className="h-4 w-4 text-blue-600" />;
    if (name.includes('vehicle') || name.includes('car') || name.includes('truck'))
      return <TruckIcon className="h-4 w-4 text-purple-600" />;
    if (name.includes('computer') || name.includes('equipment') || name.includes('machine'))
      return <ComputerDesktopIcon className="h-4 w-4 text-indigo-600" />;
    if (name.includes('inventory') || name.includes('stock') || name.includes('supplies'))
      return <ShoppingBagIcon className="h-4 w-4 text-yellow-600" />;
    return <CurrencyDollarIcon className="h-4 w-4 text-gray-600" />;
  };

  const AssetSection = ({ title, items, bgColor }) => (
    <div className="mb-6">
      <h4 className={`text-sm font-semibold ${bgColor} p-2 rounded-t-lg`}>
        {title}
      </h4>
      {items.length > 0 ? (
        <div className="bg-white border-x border-b border-gray-200 rounded-b-lg p-3">
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-2 px-2 text-sm text-gray-700 flex items-center">
                    {getAssetIcon(item.name, item.category)}
                    <span className="ml-2">{item.name}</span>
                  </td>
                  <td className="py-2 px-2 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(item.amount || 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="py-3 px-2 text-sm text-gray-800">Total {title}</td>
                <td className="py-3 px-2 text-sm text-right text-blue-600">
                  {formatCurrency(items.reduce((sum, i) => sum + (i.amount || 0), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-b-lg">
          No {title.toLowerCase()}
        </p>
      )}
    </div>
  );

  const LiabilityEquitySection = ({ title, items, bgColor }) => (
    <div className="mb-4">
      <h4 className={`text-sm font-semibold ${bgColor} p-2 rounded-t-lg`}>
        {title}
      </h4>
      {items.length > 0 ? (
        <div className="bg-white border-x border-b border-gray-200 rounded-b-lg p-3">
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-2 px-2 text-sm text-gray-700">{item.name}</td>
                  <td className="py-2 px-2 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(item.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-b-lg">
          No {title.toLowerCase()}
        </p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Balance Sheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASSETS - Left Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                ASSETS
              </h3>
            </div>
            <div className="p-6">
              {/* Current Assets */}
              <AssetSection
                title="Current Assets"
                items={categorizedAssets.current}
                bgColor="bg-blue-50 text-blue-700"
              />

              {/* Fixed Assets */}
              <AssetSection
                title="Fixed Assets"
                items={categorizedAssets.fixed}
                bgColor="bg-indigo-50 text-indigo-700"
              />

              {/* Other Assets */}
              {categorizedAssets.other.length > 0 && (
                <AssetSection
                  title="Other Assets"
                  items={categorizedAssets.other}
                  bgColor="bg-gray-50 text-gray-700"
                />
              )}

              {/* Total Assets */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">TOTAL ASSETS</span>
                  <span className="text-base font-bold text-blue-600">
                    {formatCurrency(totalAssets)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LIABILITIES & EQUITY - Right Column */}
        <div className="space-y-6">
          {/* Liabilities Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                LIABILITIES
              </h3>
            </div>
            <div className="p-6">
              {/* Current Liabilities */}
              <LiabilityEquitySection
                title="Current Liabilities"
                items={categorizedLiabilities.current}
                bgColor="bg-orange-50 text-orange-700"
              />

              {/* Long-term Liabilities */}
              <LiabilityEquitySection
                title="Long-term Liabilities"
                items={categorizedLiabilities.longTerm}
                bgColor="bg-yellow-50 text-yellow-700"
              />

              {/* Total Liabilities */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">TOTAL LIABILITIES</span>
                  <span className="text-base font-bold text-orange-600">
                    {formatCurrency(totalLiabilities)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Equity Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <ScaleIcon className="h-5 w-5 mr-2" />
                EQUITY
              </h3>
            </div>
            <div className="p-6">
              {/* Equity Items */}
              <LiabilityEquitySection
                title="Equity"
                items={equity || []}
                bgColor="bg-purple-50 text-purple-700"
              />

              {/* Total Equity */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">TOTAL EQUITY</span>
                  <span className="text-base font-bold text-purple-600">
                    {formatCurrency(totalEquity)}
                  </span>
                </div>
              </div>

              {/* Total Liabilities & Equity */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">TOTAL LIABILITIES & EQUITY</span>
                  <span className="text-base font-bold text-green-600">
                    {formatCurrency(totalLiabilities + totalEquity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounting Equation Verification */}
      <div className={`rounded-lg p-4 ${checkBalance ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Accounting Equation:</span>
            <span className="text-sm text-gray-600">Assets = Liabilities + Equity</span>
          </div>
          <div className="text-right">
            <p className="text-sm">
              <span className="font-medium">{formatCurrency(totalAssets)}</span>
              <span className="mx-2 text-gray-400">=</span>
              <span className="font-medium">{formatCurrency(totalLiabilities)}</span>
              <span className="mx-1 text-gray-400">+</span>
              <span className="font-medium">{formatCurrency(totalEquity)}</span>
            </p>
            <p className={`text-xs mt-1 ${checkBalance ? 'text-green-600' : 'text-red-600'}`}>
              {checkBalance ? '✓ Balanced' : '✗ Out of balance'}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Ratios */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Current Ratio</p>
          <p className="text-sm font-bold text-gray-900">
            {totalCurrentLiabilities > 0 
              ? (totalCurrentAssets / totalCurrentLiabilities).toFixed(2)
              : 'N/A'}
          </p>
          <p className="text-xs text-gray-400">Current Assets / Current Liabilities</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Debt to Equity</p>
          <p className="text-sm font-bold text-gray-900">
            {totalEquity > 0 
              ? (totalLiabilities / totalEquity).toFixed(2)
              : 'N/A'}
          </p>
          <p className="text-xs text-gray-400">Total Liabilities / Total Equity</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Working Capital</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(totalCurrentAssets - totalCurrentLiabilities)}
          </p>
          <p className="text-xs text-gray-400">Current Assets - Current Liabilities</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Asset Turnover</p>
          <p className="text-sm font-bold text-gray-900">N/A</p>
          <p className="text-xs text-gray-400">Requires revenue data</p>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceSheet;