// pages/Accountant/JournalEntryForm.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import AsyncSelect from 'react-select/async';
import toast from 'react-hot-toast';

// Icons for account types
const getAccountTypeIcon = (type) => {
  switch(type) {
    case 'ASSET': return <BanknotesIcon className="h-4 w-4 text-blue-600" />;
    case 'LIABILITY': return <BriefcaseIcon className="h-4 w-4 text-orange-600" />;
    case 'EQUITY': return <ScaleIcon className="h-4 w-4 text-purple-600" />;
    case 'REVENUE': return <CurrencyDollarIcon className="h-4 w-4 text-green-600" />;
    case 'EXPENSE': return <CurrencyDollarIcon className="h-4 w-4 text-red-600" />;
    default: return <BuildingOfficeIcon className="h-4 w-4 text-gray-600" />;
  }
};

const getAccountTypeColor = (type) => {
  switch(type) {
    case 'ASSET': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'LIABILITY': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'EQUITY': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'REVENUE': return 'text-green-600 bg-green-50 border-green-200';
    case 'EXPENSE': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const JournalEntryForm = ({ entry, onClose, onSuccess }) => {
  const getDefaultLines = () => [
    { account_id: '', debit: '', credit: '', description: '' },
    { account_id: '', debit: '', credit: '', description: '' }
  ];
  
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    notes: '',
    lines: getDefaultLines()
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountsByType, setAccountsByType] = useState({});
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [loading, setLoading] = useState(true);
  const [submitForApproval, setSubmitForApproval] = useState(true);
  const [validationErrors, setValidationErrors] = useState([]);
  const [localBalanced, setLocalBalanced] = useState(true);
  
  // Modal state for account selection
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [expandedTypes, setExpandedTypes] = useState({
    ASSET: true,
    LIABILITY: true,
    EQUITY: true,
    REVENUE: true,
    EXPENSE: true
  });
  const [selectedType, setSelectedType] = useState(null);

  // State for insufficient funds modal
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [fundsErrors, setFundsErrors] = useState([]);

  const isEditable = !entry || ['DRAFT', 'RETURNED'].includes(entry.status);
  const difference = Math.abs(totals.debit - totals.credit).toFixed(2);

  useEffect(() => {
    fetchChartOfAccounts();
  }, []);

  useEffect(() => {
    initializeForm();
  }, [entry]);

  useEffect(() => {
    calculateTotals();
  }, [formData.lines]);

  const fetchChartOfAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountantService.getChartOfAccounts();
      
      console.log('📊 Chart of Accounts Response:', response);
      
      const allAccounts = [
        ...(response.chart_of_accounts?.ASSET || []),
        ...(response.chart_of_accounts?.LIABILITY || []),
        ...(response.chart_of_accounts?.EQUITY || []),
        ...(response.chart_of_accounts?.REVENUE || []),
        ...(response.chart_of_accounts?.EXPENSE || [])
      ];
      
      const byType = {
        ASSET: response.chart_of_accounts?.ASSET || [],
        LIABILITY: response.chart_of_accounts?.LIABILITY || [],
        EQUITY: response.chart_of_accounts?.EQUITY || [],
        REVENUE: response.chart_of_accounts?.REVENUE || [],
        EXPENSE: response.chart_of_accounts?.EXPENSE || []
      };
      
      console.log('📊 Chart of Accounts loaded:', {
        total: allAccounts.length,
        byType: Object.keys(byType).map(k => `${k}: ${byType[k].length}`)
      });
      
      setAccounts(allAccounts);
      setAccountsByType(byType);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      toast.error('Failed to load chart of accounts');
      setLoading(false);
    }
  };

  const initializeForm = () => {
    if (entry) {
      console.log('Loading entry for edit:', entry);
      setFormData({
        entry_date: entry.entry_date?.split('T')[0] || '',
        description: entry.description || '',
        reference: entry.reference || '',
        notes: entry.notes || '',
        lines: entry.lines?.length ? entry.lines.map(line => ({
          account_id: line.account_id,
          debit: line.debit || '',
          credit: line.credit || '',
          description: line.description || ''
        })) : getDefaultLines()
      });
    } else {
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        notes: '',
        lines: getDefaultLines()
      });
    }
  };

  const loadAccountOptions = async (inputValue) => {
    if (!inputValue) return [];
    
    const filtered = accounts.filter(acc => 
      (acc.name?.toLowerCase() || '').includes(inputValue.toLowerCase()) ||
      (acc.account_code?.toLowerCase() || '').includes(inputValue.toLowerCase()) ||
      (acc.account_type?.toLowerCase() || '').includes(inputValue.toLowerCase())
    );
    
    return filtered.slice(0, 50).map(acc => ({
      value: acc.id,
      label: `${acc.account_code} - ${acc.name}`,
      type: acc.account_type,
      category: acc.category,
      balance: acc.current_balance
    }));
  };

  const openAccountModal = (index) => {
    setSelectedLineIndex(index);
    setModalSearchTerm('');
    setSelectedType(null);
    setShowAccountModal(true);
  };

  const closeAccountModal = () => {
    setShowAccountModal(false);
    setSelectedLineIndex(null);
    setModalSearchTerm('');
    setSelectedType(null);
  };

  const toggleType = (type) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const selectAccount = (account) => {
    if (selectedLineIndex !== null) {
      const newLines = [...formData.lines];
      newLines[selectedLineIndex].account_id = account.id;
      setFormData({ ...formData, lines: newLines });
      
      const normalBalance = account.normal_balance || 
        (account.account_type === 'ASSET' || account.account_type === 'EXPENSE' ? 'debit' : 'credit');
      
      setTimeout(() => {
        if (normalBalance === 'debit') {
          const debitInput = document.querySelector(`input[name="lines.${selectedLineIndex}.debit"]`);
          if (debitInput) debitInput.focus();
        } else {
          const creditInput = document.querySelector(`input[name="lines.${selectedLineIndex}.credit"]`);
          if (creditInput) creditInput.focus();
        }
      }, 100);
      
      closeAccountModal();
    }
  };

  const getFilteredAccounts = () => {
    let filtered = { ...accountsByType };
    
    if (modalSearchTerm) {
      const searchTerm = modalSearchTerm.toLowerCase();
      filtered = {};
      
      Object.entries(accountsByType).forEach(([type, accList]) => {
        const matches = accList.filter(acc => 
          (acc.name?.toLowerCase() || '').includes(searchTerm) ||
          (acc.account_code?.toLowerCase() || '').includes(searchTerm) ||
          (acc.category?.toLowerCase() || '').includes(searchTerm)
        );
        if (matches.length > 0) {
          filtered[type] = matches;
        }
      });
    }
    
    return filtered;
  };

  const calculateTotals = () => {
    const debit = formData.lines.reduce((sum, line) => {
      return sum + (parseFloat(line.debit) || 0);
    }, 0);
    
    const credit = formData.lines.reduce((sum, line) => {
      return sum + (parseFloat(line.credit) || 0);
    }, 0);
    
    setTotals({ debit, credit });
    setLocalBalanced(Math.abs(debit - credit) < 0.01);
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.entry_date) {
      errors.push('Entry date is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    const hasAccount = formData.lines.some(line => line.account_id);
    if (!hasAccount) {
      errors.push('At least one account must be selected');
    }

    const hasDebit = formData.lines.some(line => parseFloat(line.debit) > 0);
    const hasCredit = formData.lines.some(line => parseFloat(line.credit) > 0);
    
    if (!hasDebit || !hasCredit) {
      errors.push('Journal entry must have at least one debit and one credit line');
    }

    formData.lines.forEach((line, index) => {
      if (line.account_id) {
        const debit = parseFloat(line.debit) || 0;
        const credit = parseFloat(line.credit) || 0;
        
        if (debit === 0 && credit === 0) {
          errors.push(`Line ${index + 1}: Please enter either debit or credit amount`);
        }
        
        if (debit > 0 && credit > 0) {
          errors.push(`Line ${index + 1}: Cannot have both debit and credit`);
        }
      } else if (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0) {
        errors.push(`Line ${index + 1}: Please select an account for this amount`);
      }
    });

    if (!localBalanced) {
      errors.push(`Entry does not balance: Debits (${totals.debit.toFixed(2)}) must equal Credits (${totals.credit.toFixed(2)})`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    
    if (field === 'account_id') {
      newLines[index][field] = value;
    } else {
      newLines[index][field] = value;
      
      if (field === 'debit' && value) {
        newLines[index].credit = '';
      } else if (field === 'credit' && value) {
        newLines[index].debit = '';
      }
    }
    
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { account_id: '', debit: '', credit: '', description: '' }]
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length <= 2) {
      toast.error('Journal entry must have at least 2 lines');
      return;
    }
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const checkLineBalance = (line) => {
    if (!line.account_id || !line.credit) return null;
    
    const account = accounts.find(a => a.id === line.account_id);
    if (!account || account.account_type !== 'ASSET') return null;
    
    const currentBalance = account.current_balance || 0;
    const requiredAmount = parseFloat(line.credit) || 0;
    
    if (requiredAmount > currentBalance) {
      return {
        hasBalance: false,
        message: `Insufficient funds in ${account.name}. Available: GHS ${currentBalance.toFixed(2)}`
      };
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    calculateTotals();
    
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);
    
    try {
      const validLines = formData.lines
        .filter(line => line.account_id && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0))
        .map(line => ({
          account_id: line.account_id,
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0,
          description: line.description || ''
        }));

      const submitData = {
        entry_date: formData.entry_date,
        description: formData.description.trim(),
        reference: formData.reference || '',
        lines: validLines,
        submit_for_approval: submitForApproval
      };

      let response;
      if (entry) {
        response = await accountantService.updateJournalEntry(entry.id, submitData);
        toast.success(submitForApproval ? 'Entry updated and submitted for approval' : 'Journal entry updated successfully');
      } else {
        response = await accountantService.createJournalEntry(submitData);
        toast.success(submitForApproval ? 'Journal entry created and submitted for approval' : 'Journal entry saved as draft');
      }
      
      onSuccess();
    } catch (error) {
      console.error('❌ Error saving journal entry:', error);
      
      if (error.response) {
        if (error.response.data?.code === 'INSUFFICIENT_FUNDS') {
          const details = error.response.data.details || [];
          setFundsErrors(details);
          setShowFundsModal(true);
          toast.error('Insufficient funds for this transaction');
        } else {
          const errorMessage = error.response.data?.error || error.response.data?.message || 'Failed to save journal entry';
          toast.error(errorMessage);
        }
      } else if (error.request) {
        toast.error('No response from server');
      } else {
        toast.error('Error: ' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    calculateTotals();
    
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);
    
    try {
      const validLines = formData.lines
        .filter(line => line.account_id && (parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0))
        .map(line => ({
          account_id: line.account_id,
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0,
          description: line.description || ''
        }));

      const submitData = {
        entry_date: formData.entry_date,
        description: formData.description.trim(),
        reference: formData.reference || '',
        notes: formData.notes || '',
        lines: validLines,
        submit_for_approval: true
      };

      console.log('📤 Submitting for approval:', submitData);
      
      await accountantService.updateJournalEntry(entry.id, submitData);
      toast.success('Journal entry submitted for approval');
      onSuccess();
    } catch (error) {
      console.error('❌ Error submitting for approval:', error);
      if (error.response) {
        toast.error(error.response.data?.error || 'Failed to submit for approval');
      } else {
        toast.error('Failed to submit for approval');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmitButtonText = () => {
    if (!entry) {
      return submitForApproval ? 'Create & Submit for Approval' : 'Save as Draft';
    }
    if (entry.status === 'RETURNED') {
      return 'Resubmit for Approval';
    }
    if (entry.status === 'DRAFT') {
      return submitForApproval ? 'Submit for Approval' : 'Save as Draft';
    }
    return 'Update Entry';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <ArrowPathIcon className="animate-spin h-8 w-8 text-green-600 mx-auto" />
          <p className="text-center mt-2">Loading chart of accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">
              {entry ? `Edit Journal Entry: ${entry.entry_number}` : 'Create Journal Entry'}
            </h2>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <UserGroupIcon className="h-4 w-4 mr-1" />
              <span>Accountant → Treasurer Approval → Post to Ledger</span>
            </div>
          </div>
          <button onClick={onClose}>
            <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
          </button>
        </div>

        {/* Status Display for Existing Entries */}
        {entry && (
          <div className={`mb-4 p-3 rounded-lg border ${
            entry.status === 'POSTED' ? 'bg-green-50 border-green-200' : 
            entry.status === 'PENDING' ? 'bg-yellow-50 border-yellow-200' : 
            entry.status === 'DRAFT' ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {entry.status === 'POSTED' && <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />}
              {entry.status === 'PENDING' && <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />}
              {entry.status === 'DRAFT' && <ArrowPathIcon className="h-5 w-5 text-gray-600 mr-2" />}
              <span className="font-medium">Status: {entry.status}</span>
            </div>
            {entry.status === 'PENDING' && (
              <p className="text-sm text-yellow-700 mt-1">Waiting for treasurer approval</p>
            )}
            {entry.status === 'POSTED' && (
              <p className="text-sm text-green-700 mt-1">Entry has been posted to the ledger</p>
            )}
            {entry.status === 'DRAFT' && (
              <p className="text-sm text-gray-600 mt-1">This entry is in draft mode. Edit and submit for approval when ready.</p>
            )}
          </div>
        )}

        {/* Account Types Summary */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map(type => {
            const count = accountsByType[type]?.length || 0;
            if (count === 0) return null;
            return (
              <div key={type} className={`text-xs p-2 rounded-lg border ${getAccountTypeColor(type)}`}>
                <div className="font-bold">{type}</div>
                <div>{count} accounts</div>
              </div>
            );
          })}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
                <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Entry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                disabled={!isEditable}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reference</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Invoice #, Check #, etc."
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Brief description of the journal entry"
              disabled={!isEditable}
              required
            />
          </div>

          {/* Notes for Treasurer */}
          {isEditable && (
            <div>
              <label className="block text-sm font-medium mb-1">Notes for Treasurer</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Add any context or justification for the Treasurer..."
              />
            </div>
          )}

          {/* Journal Lines */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">Journal Lines (Double-Entry)</h3>
              <span className="text-xs text-gray-500">Total Debits must equal Total Credits</span>
            </div>
            
            {/* Headers */}
            <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-medium text-gray-500">
              <div className="col-span-4">Account *</div>
              <div className="col-span-2 text-green-600">Debit (DR)</div>
              <div className="col-span-2 text-red-600">Credit (CR)</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1"></div>
            </div>

            {/* Lines */}
            {formData.lines.map((line, index) => {
              const balanceWarning = checkLineBalance(line);
              
              return (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <AsyncSelect
                          cacheOptions
                          loadOptions={loadAccountOptions}
                          defaultOptions={accounts.slice(0, 20).map(acc => ({
                            value: acc.id,
                            label: `${acc.account_code} - ${acc.name}`,
                            type: acc.account_type
                          }))}
                          value={line.account_id ? {
                            value: line.account_id,
                            label: accounts.find(a => a.id === line.account_id)?.name || 'Selected'
                          } : null}
                          onChange={(selected) => handleLineChange(index, 'account_id', selected?.value)}
                          placeholder="Search accounts..."
                          isDisabled={!isEditable}
                          className="text-sm"
                          formatOptionLabel={(option) => (
                            <div className="flex items-center">
                              {getAccountTypeIcon(option.type)}
                              <span className="ml-2">{option.label}</span>
                            </div>
                          )}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => openAccountModal(index)}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                        title="Browse all accounts"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name={`lines.${index}.debit`}
                      value={line.debit}
                      onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                      className={`w-full px-2 py-1 border rounded-md ${line.debit ? 'bg-green-50 border-green-300' : ''}`}
                      placeholder="0.00"
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name={`lines.${index}.credit`}
                      value={line.credit}
                      onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                      className={`w-full px-2 py-1 border rounded-md ${line.credit ? 'bg-red-50 border-red-300' : ''}`}
                      placeholder="0.00"
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 border rounded-md"
                      placeholder="Line description"
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {formData.lines.length > 1 && isEditable && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  
                  {balanceWarning && (
                    <div className="col-span-12 text-xs text-red-600 mt-1">
                      ⚠️ {balanceWarning.message}
                    </div>
                  )}
                </div>
              );
            })}

            {isEditable && (
              <button
                type="button"
                onClick={addLine}
                className="mt-2 px-3 py-1 border rounded-md text-sm hover:bg-gray-100"
              >
                <PlusIcon className="h-4 w-4 inline mr-1" />
                Add Line
              </button>
            )}
          </div>

          {/* Totals and Balance Check */}
          <div className={`rounded-lg p-4 ${localBalanced ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Total Debits:</span>
                <span className="ml-2 text-lg font-bold text-green-600">
                  GHS {totals.debit.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Total Credits:</span>
                <span className="ml-2 text-lg font-bold text-red-600">
                  GHS {totals.credit.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <CalculatorIcon className={`h-5 w-5 mr-2 ${localBalanced ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${localBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {localBalanced 
                  ? '✓ Entry is balanced (DR = CR)' 
                  : `✗ Not balanced (Difference: GHS ${difference})`}
              </span>
            </div>
          </div>

          {/* Submit for Approval Checkbox */}
          {isEditable && entry?.status !== 'POSTED' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="submitForApproval"
                checked={submitForApproval}
                onChange={(e) => setSubmitForApproval(e.target.checked)}
                className="h-4 w-4 text-green-600 rounded"
              />
              <label htmlFor="submitForApproval" className="ml-2 text-sm">
                Submit for treasurer approval after saving
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>

            {isEditable && entry?.status !== 'POSTED' && (
              <button
                type="submit"
                disabled={submitting || !localBalanced}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </span>
                ) : (
                  getSubmitButtonText()
                )}
              </button>
            )}

            {entry?.status === 'DRAFT' && (
              <button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={submitting || !localBalanced}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Submitting...
                  </span>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </>
                )}
              </button>
            )}

            {entry?.status === 'PENDING' && (
              <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-md flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                Pending Approval
              </div>
            )}

            {entry?.status === 'POSTED' && (
              <div className="px-4 py-2 bg-green-50 text-green-700 rounded-md flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Posted
              </div>
            )}
          </div>
        </form>
      </motion.div>

      {/* Account Selection Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-[10000]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Select Account for Line {selectedLineIndex !== null ? selectedLineIndex + 1 : ''}
              </h3>
              <button onClick={closeAccountModal}>
                <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-gray-500" />
              </button>
            </div>

            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  selectedType === null
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All Types
              </button>
              {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getAccountTypeColor(type)} ${
                    selectedType === type ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search accounts by name, code, or category..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[50vh] border rounded-lg">
              {Object.entries(getFilteredAccounts())
                .filter(([type]) => !selectedType || type === selectedType)
                .map(([type, accList]) => (
                <div key={type} className="border-b last:border-0">
                  <button
                    onClick={() => toggleType(type)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      {expandedTypes[type] ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                      )}
                      <span className={`ml-2 text-sm font-semibold ${getAccountTypeColor(type).split(' ')[0]}`}>
                        {type}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({accList.length})
                      </span>
                    </div>
                  </button>

                  {expandedTypes[type] && (
                    <div className="divide-y">
                      {accList.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => selectAccount(acc)}
                          className="w-full text-left px-8 py-3 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            {getAccountTypeIcon(acc.account_type)}
                            <span className="font-mono text-sm text-gray-500 w-16">
                              {acc.account_code}
                            </span>
                            <span className="text-sm font-medium">
                              {acc.name}
                            </span>
                            {acc.category && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getAccountTypeColor(acc.account_type)}`}>
                                {acc.category}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {acc.normal_balance || (acc.account_type === 'ASSET' || acc.account_type === 'EXPENSE' ? 'Debit' : 'Credit')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {Object.keys(getFilteredAccounts()).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No accounts found matching "{modalSearchTerm}"
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={closeAccountModal}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Insufficient Funds Modal */}
      {showFundsModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-red-600">Insufficient Funds</h3>
            </div>
            <div className="space-y-2 mb-4">
              {fundsErrors.length > 0 ? (
                fundsErrors.map((error, i) => (
                  <p key={i} className="text-sm text-gray-700">{error}</p>
                ))
              ) : (
                <p className="text-sm text-gray-700">This transaction would exceed the available balance in one or more accounts.</p>
              )}
            </div>
            <button
              onClick={() => setShowFundsModal(false)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntryForm;