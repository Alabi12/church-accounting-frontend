// pages/Accountant/AddJournalEntry.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { accountantService } from '../../services/accountant';
import { approvalService } from '../../services/approval';
import AsyncSelect from 'react-select/async';
import toast from 'react-hot-toast';

const lineSchema = yup.object({
  accountId: yup.number().required('Account is required'),
  description: yup.string(),
  debit: yup.number().min(0, 'Debit must be positive').nullable(),
  credit: yup.number().min(0, 'Credit must be positive').nullable(),
}).test(
  'debit-or-credit',
  'Each line must have either debit or credit',
  function(value) {
    const { debit, credit } = value;
    return (debit > 0 || credit > 0) && !(debit > 0 && credit > 0);
  }
);

const schema = yup.object({
  date: yup.string().required('Date is required'),
  description: yup.string().required('Description is required'),
  notes: yup.string(),
  entries: yup.array().of(lineSchema).min(2, 'At least two journal lines are required for double-entry'),
});

const AddJournalEntry = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountsByType, setAccountsByType] = useState({});
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [submitForApproval, setSubmitForApproval] = useState(true);
  const [showAccountGuide, setShowAccountGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Modal state
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

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
      entries: [
        { accountId: '', description: '', debit: '', credit: '' },
        { accountId: '', description: '', debit: '', credit: '' }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries',
  });

  const watchEntries = watch('entries');

  // Calculate totals whenever entries change
  useEffect(() => {
    let debit = 0;
    let credit = 0;
    watchEntries?.forEach(entry => {
      debit += parseFloat(entry.debit) || 0;
      credit += parseFloat(entry.credit) || 0;
    });
    setTotalDebit(debit);
    setTotalCredit(credit);
  }, [watchEntries]);

  // Load accounts from Chart of Accounts
  useEffect(() => {
    fetchChartOfAccounts();
  }, []);

  const fetchChartOfAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountantService.getChartOfAccounts();
      console.log('📊 Chart of Accounts loaded:', response);
      
      // Combine all account types
      const allAccounts = [
        ...(response.chart_of_accounts?.ASSET || []),
        ...(response.chart_of_accounts?.LIABILITY || []),
        ...(response.chart_of_accounts?.EQUITY || []),
        ...(response.chart_of_accounts?.REVENUE || []),
        ...(response.chart_of_accounts?.EXPENSE || [])
      ];
      
      // Group by type for modal
      const byType = {
        ASSET: response.chart_of_accounts?.ASSET || [],
        LIABILITY: response.chart_of_accounts?.LIABILITY || [],
        EQUITY: response.chart_of_accounts?.EQUITY || [],
        REVENUE: response.chart_of_accounts?.REVENUE || [],
        EXPENSE: response.chart_of_accounts?.EXPENSE || []
      };
      
      console.log('✅ Total accounts loaded:', allAccounts.length);
      console.log('📊 Account types:', Object.keys(byType).map(k => `${k}: ${byType[k].length}`));
      
      setAccounts(allAccounts);
      setAccountsByType(byType);
    } catch (error) {
      console.error('❌ Error fetching chart of accounts:', error);
      toast.error('Failed to load chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  // Load accounts for dropdown with search
  const loadAccountOptions = async (inputValue) => {
    try {
      if (accounts.length === 0) {
        return [];
      }
      
      const searchTerm = inputValue.toLowerCase();
      
      const filtered = accounts.filter(acc => {
        return (
          (acc.name?.toLowerCase() || '').includes(searchTerm) ||
          (acc.account_code?.toLowerCase() || '').includes(searchTerm) ||
          (acc.account_type?.toLowerCase() || '').includes(searchTerm) ||
          (acc.category?.toLowerCase() || '').includes(searchTerm)
        );
      });
      
      return filtered.map(acc => ({
        value: acc.id,
        label: `${acc.account_code} - ${acc.name} (${acc.account_type})`,
        type: acc.account_type,
        category: acc.category,
        balance: acc.current_balance,
        normal_balance: acc.normal_balance || (acc.account_type === 'ASSET' || acc.account_type === 'EXPENSE' ? 'debit' : 'credit')
      }));
    } catch (error) {
      console.error('Error loading accounts:', error);
      return [];
    }
  };

  // Get account type icon
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

  // Get account type color
  const getAccountTypeColor = (type) => {
    switch(type) {
      case 'ASSET': return 'text-blue-600 bg-blue-50';
      case 'LIABILITY': return 'text-orange-600 bg-orange-50';
      case 'EQUITY': return 'text-purple-600 bg-purple-50';
      case 'REVENUE': return 'text-green-600 bg-green-50';
      case 'EXPENSE': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Modal functions
  const openAccountModal = (index) => {
    setSelectedLineIndex(index);
    setModalSearchTerm('');
    setShowAccountModal(true);
  };

  const closeAccountModal = () => {
    setShowAccountModal(false);
    setSelectedLineIndex(null);
    setModalSearchTerm('');
  };

  const toggleType = (type) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const selectAccountFromModal = (account) => {
    if (selectedLineIndex !== null) {
      setValue(`entries.${selectedLineIndex}.accountId`, account.id);
      trigger(`entries.${selectedLineIndex}.accountId`);
      
      // Auto-suggest debit/credit based on account type
      const normalBalance = account.normal_balance || 
        (account.account_type === 'ASSET' || account.account_type === 'EXPENSE' ? 'debit' : 'credit');
      setValue(`entries.${selectedLineIndex}.${normalBalance}`, '');
      
      closeAccountModal();
    }
  };

  // Filter accounts for modal
  const getFilteredAccountsForModal = () => {
    if (!modalSearchTerm) return accountsByType;
    
    const filtered = {};
    const searchTerm = modalSearchTerm.toLowerCase();
    
    Object.entries(accountsByType).forEach(([type, accList]) => {
      const filteredAccounts = accList.filter(acc => 
        (acc.name?.toLowerCase() || '').includes(searchTerm) ||
        (acc.account_code?.toLowerCase() || '').includes(searchTerm) ||
        (acc.category?.toLowerCase() || '').includes(searchTerm)
      );
      
      if (filteredAccounts.length > 0) {
        filtered[type] = filteredAccounts;
      }
    });
    
    return filtered;
  };

  const onSubmit = async (data) => {
    // Check if entry balances (double-entry principle)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error(`Journal entry does not balance: Debits ${formatCurrency(totalDebit)} vs Credits ${formatCurrency(totalCredit)}`);
      return;
    }

    // Check if there's at least one debit and one credit
    const hasDebit = data.entries.some(e => parseFloat(e.debit) > 0);
    const hasCredit = data.entries.some(e => parseFloat(e.credit) > 0);
    
    if (!hasDebit || !hasCredit) {
      toast.error('Journal entry must have at least one debit and one credit line');
      return;
    }

    // Validate that total is not zero
    if (totalDebit === 0 && totalCredit === 0) {
      toast.error('Journal entry total cannot be zero');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Creating journal entry with data:', data);
      
      const validLines = data.entries
        .filter(e => e.accountId && (parseFloat(e.debit) > 0 || parseFloat(e.credit) > 0))
        .map(e => ({
          account_id: e.accountId,
          description: e.description || data.description,
          debit: parseFloat(e.debit) || 0,
          credit: parseFloat(e.credit) || 0
        }));
      
      const formattedData = {
        entry_date: data.date,
        description: data.description,
        notes: data.notes,
        lines: validLines
      };
      
      if (submitForApproval) {
        await accountantService.createJournalEntry(formattedData, 'PENDING');
        toast.success('Journal entry created and submitted for treasurer approval');
        navigate('/accountant/pending-approvals');
      } else {
        await accountantService.createJournalEntry(formattedData, 'DRAFT');
        toast.success('Journal entry saved as draft');
        navigate('/accountant/journal-entries');
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      
      let errorMessage = 'Failed to create journal entry';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const difference = Math.abs(totalDebit - totalCredit).toFixed(2);

  // Helper to suggest account based on double-entry rules
  const suggestDebitCredit = (index) => {
    const currentLine = watchEntries[index];
    const otherLines = watchEntries.filter((_, i) => i !== index);
    
    if (!currentLine.debit && !currentLine.credit && otherLines.length > 0) {
      const totalOtherDebit = otherLines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
      const totalOtherCredit = otherLines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
      
      if (totalOtherDebit > totalOtherCredit) {
        return 'credit';
      } else if (totalOtherCredit > totalOtherDebit) {
        return 'debit';
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="animate-spin h-12 w-12 text-[rgb(31,178,86)] mx-auto mb-4" />
          <p className="text-gray-600">Loading Chart of Accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/accountant/journal-entries')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Journal Entries
          </button>
        </div>

        {/* Account Type Summary */}
        <div className="mb-4 flex flex-wrap gap-2">
          {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map(type => {
            const count = accounts.filter(a => a.account_type === type).length;
            if (count === 0) return null;
            return (
              <span key={type} className={`px-3 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(type)}`}>
                {type}: {count}
              </span>
            );
          })}
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] px-6 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Create Journal Entry</h2>
                <p className="text-sm text-green-100 mt-0.5">
                  {accounts.length} accounts loaded - Select from Chart of Accounts
                </p>
              </div>
            </div>
          </div>

          {/* Approval Flow Info */}
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <ShieldCheckIcon className="h-5 w-5" />
              <span className="font-medium">Approval Workflow:</span>
              <span>Accountant → Treasurer Approval → Post to Ledger</span>
              <ClockIcon className="h-4 w-4 ml-2" />
              <span>Status: {submitForApproval ? 'Will be submitted for approval' : 'Saved as draft'}</span>
            </div>
          </div>

          {/* Quick Account Type Guide */}
          <div className="bg-gray-50 px-6 py-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setShowAccountGuide(!showAccountGuide)}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center"
            >
              <InformationCircleIcon className="h-4 w-4 mr-1" />
              {showAccountGuide ? 'Hide' : 'Show'} Account Type Guide
            </button>
            {showAccountGuide && (
              <div className="mt-2 grid grid-cols-5 gap-2 text-xs">
                <div className="p-2 bg-blue-50 rounded">
                  <span className="font-bold text-blue-700">ASSET</span>
                  <p className="text-gray-600">Normal: Debit</p>
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <span className="font-bold text-orange-700">LIABILITY</span>
                  <p className="text-gray-600">Normal: Credit</p>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <span className="font-bold text-purple-700">EQUITY</span>
                  <p className="text-gray-600">Normal: Credit</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <span className="font-bold text-green-700">REVENUE</span>
                  <p className="text-gray-600">Normal: Credit</p>
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <span className="font-bold text-red-700">EXPENSE</span>
                  <p className="text-gray-600">Normal: Debit</p>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('date')}
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    transition-all duration-200
                    ${errors.date
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                    }
                  `}
                />
                {errors.date && (
                  <p className="text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('description')}
                  placeholder="Brief description of the journal entry"
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    transition-all duration-200
                    ${errors.description
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                    }
                  `}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Notes for Approver */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes for Approver
              </label>
              <textarea
                {...register('notes')}
                rows="2"
                placeholder="Add any notes or context for the Treasurer approving this entry..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] transition-all duration-200"
              />
            </div>

            {/* Journal Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Journal Lines (Double-Entry)</h3>
                <button
                  type="button"
                  onClick={() => append({ accountId: '', description: '', debit: '', credit: '' })}
                  className="inline-flex items-center px-3 py-2 bg-[rgb(31,178,86)] bg-opacity-10 text-[rgb(31,178,86)] rounded-lg hover:bg-opacity-20 transition-colors text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Line
                </button>
              </div>

              {/* Balance Indicator */}
              <div className={`p-4 rounded-lg ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Total Debits: {formatCurrency(totalDebit)}</p>
                    <p className="text-sm font-medium">Total Credits: {formatCurrency(totalCredit)}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isBalanced ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
                  </div>
                </div>
              </div>

              {/* Lines */}
              {fields.map((field, index) => {
                const suggestedField = suggestDebitCredit(index);
                const currentAccount = accounts.find(a => a.id === watchEntries[index]?.accountId);
                
                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="grid grid-cols-12 gap-4 items-start">
                      {/* Account */}
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Account <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <AsyncSelect
                              cacheOptions
                              loadOptions={loadAccountOptions}
                              defaultOptions={(() => {
                                const sample = [];
                                const types = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
                                
                                types.forEach(type => {
                                  const typeAccounts = accounts.filter(a => a.account_type === type).slice(0, 2);
                                  sample.push(...typeAccounts);
                                });
                                
                                return sample.map(acc => ({
                                  value: acc.id,
                                  label: `${acc.account_code} - ${acc.name} (${acc.account_type})`,
                                  type: acc.account_type
                                }));
                              })()}
                              value={watchEntries[index]?.accountId ? {
                                value: watchEntries[index].accountId,
                                label: (() => {
                                  const acc = accounts.find(a => a.id === watchEntries[index].accountId);
                                  return acc ? `${acc.account_code} - ${acc.name} (${acc.account_type})` : 'Loading...';
                                })(),
                                type: currentAccount?.account_type
                              } : null}
                              onChange={(selected) => {
                                setValue(`entries.${index}.accountId`, selected?.value);
                                trigger(`entries.${index}.accountId`);
                                
                                if (selected && !watchEntries[index]?.debit && !watchEntries[index]?.credit) {
                                  const account = accounts.find(a => a.id === selected.value);
                                  if (account) {
                                    const normalBalance = account.normal_balance || 
                                      (account.account_type === 'ASSET' || account.account_type === 'EXPENSE' ? 'debit' : 'credit');
                                    setValue(`entries.${index}.${normalBalance}`, '');
                                  }
                                }
                              }}
                              placeholder="Search accounts..."
                              className="react-select-container text-sm"
                              classNamePrefix="react-select"
                              isClearable
                              formatOptionLabel={({ label, type }) => (
                                <div className="flex items-center">
                                  {getAccountTypeIcon(type)}
                                  <span className="ml-2">{label}</span>
                                </div>
                              )}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => openAccountModal(index)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center"
                            title="Browse all accounts"
                          >
                            <MagnifyingGlassIcon className="h-4 w-4" />
                          </button>
                        </div>
                        {errors.entries?.[index]?.accountId && (
                          <p className="text-xs text-red-600 mt-1">{errors.entries[index].accountId.message}</p>
                        )}
                        
                        {currentAccount && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getAccountTypeColor(currentAccount.account_type)}`}>
                              {currentAccount.account_type} • Normal: {currentAccount.normal_balance || (currentAccount.account_type === 'ASSET' || currentAccount.account_type === 'EXPENSE' ? 'Debit' : 'Credit')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          {...register(`entries.${index}.description`)}
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] text-sm"
                          placeholder="Line description"
                        />
                      </div>

                      {/* Debit */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Debit (DR)
                          {suggestedField === 'debit' && !watchEntries[index]?.debit && !watchEntries[index]?.credit && (
                            <span className="ml-1 text-green-600">• suggested</span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">GHS</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`entries.${index}.debit`)}
                            className={`w-full pl-12 pr-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 text-sm ${
                              watchEntries[index]?.debit 
                                ? 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500' 
                                : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                            }`}
                            placeholder="0.00"
                            onChange={(e) => {
                              if (e.target.value) {
                                setValue(`entries.${index}.credit`, '');
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Credit */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Credit (CR)
                          {suggestedField === 'credit' && !watchEntries[index]?.debit && !watchEntries[index]?.credit && (
                            <span className="ml-1 text-green-600">• suggested</span>
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">GHS</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`entries.${index}.credit`)}
                            className={`w-full pl-12 pr-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 text-sm ${
                              watchEntries[index]?.credit 
                                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
                                : 'border-gray-200 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]'
                            }`}
                            placeholder="0.00"
                            onChange={(e) => {
                              if (e.target.value) {
                                setValue(`entries.${index}.debit`, '');
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 flex justify-end">
                        {fields.length > 2 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {errors.entries?.[index] && !errors.entries[index].accountId && (
                      <p className="text-xs text-red-600 mt-2">
                        {errors.entries[index].message}
                      </p>
                    )}
                  </motion.div>
                );
              })}

              {errors.entries && !Array.isArray(errors.entries) && (
                <p className="text-sm text-red-600">{errors.entries.message}</p>
              )}
            </div>

            {/* Submit Options */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={submitForApproval}
                  onChange={(e) => setSubmitForApproval(e.target.checked)}
                  className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Submit for treasurer approval</span>
                  <p className="text-xs text-gray-500">
                    If checked, this entry will be sent to the Treasurer for review. Otherwise, it will be saved as a draft.
                  </p>
                </div>
              </label>
            </div>

            {/* Form Footer */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/accountant/journal-entries')}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] transition-all duration-200"
              >
                Cancel
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting || !isBalanced}
                className="px-8 py-3 border-2 border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[rgb(31,178,86)] to-[rgb(25,142,69)] hover:from-[rgb(25,142,69)] hover:to-[rgb(31,178,86)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(31,178,86)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Creating...
                  </span>
                ) : (
                  submitForApproval ? 'Create & Submit for Approval' : 'Save as Draft'
                )}
              </motion.button>
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
                <h3 className="text-lg font-medium text-gray-900">
                  Select Account for Line {selectedLineIndex !== null ? selectedLineIndex + 1 : ''}
                </h3>
                <button
                  onClick={closeAccountModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts by name, code, or category..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              
              {/* Account List */}
              <div className="overflow-y-auto max-h-[60vh] border border-gray-200 rounded-lg">
                {Object.entries(getFilteredAccountsForModal()).map(([type, accList]) => (
                  <div key={type} className="border-b border-gray-200 last:border-0">
                    {/* Type Header */}
                    <button
                      onClick={() => toggleType(type)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
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
                          ({accList.length} accounts)
                        </span>
                      </div>
                    </button>

                    {/* Accounts */}
                    {expandedTypes[type] && (
                      <div className="divide-y divide-gray-100">
                        {accList.map(acc => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => selectAccountFromModal(acc)}
                            className="w-full text-left px-8 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              {getAccountTypeIcon(acc.account_type)}
                              <span className="font-mono text-sm text-gray-500 w-16">
                                {acc.account_code}
                              </span>
                              <span className="text-sm text-gray-900">
                                {acc.name}
                              </span>
                              {acc.category && (
                                <span className={`text-xs px-2 py-1 rounded-full ${getAccountTypeColor(acc.account_type)}`}>
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
                
                {Object.keys(getFilteredAccountsForModal()).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No accounts found matching "{modalSearchTerm}"
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200"
        >
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Double-Entry Accounting Tips</h4>
              <ul className="mt-2 text-xs text-blue-600 space-y-1 list-disc list-inside">
                <li><span className="font-medium">ASSETS & EXPENSES:</span> Increase with Debits, Decrease with Credits</li>
                <li><span className="font-medium">LIABILITIES, EQUITY & REVENUE:</span> Increase with Credits, Decrease with Debits</li>
                <li>Every transaction must have at least one Debit and one Credit</li>
                <li>Total Debits must always equal Total Credits</li>
                <li>Click the search icon (🔍) next to each account field to browse all accounts</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AddJournalEntry;