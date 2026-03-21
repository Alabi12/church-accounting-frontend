export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const PAYMENT_METHODS = [
  { id: 'CASH', name: 'Cash' },
  { id: 'CHECK', name: 'Check' },
  { id: 'BANK_TRANSFER', name: 'Bank Transfer' },
  { id: 'CREDIT_CARD', name: 'Credit Card' },
  { id: 'MOBILE_MONEY', name: 'Mobile Money' },
  { id: 'ONLINE', name: 'Online' },
];

export const INCOME_CATEGORIES = [
  { id: 'TITHE', name: 'Tithe' },
  { id: 'NORMAL_OFFERING', name: 'Normal Offering' },
  { id: 'SPECIAL_OFFERING', name: 'Special Offering' },
  { id: 'WELFARE_OFFERING', name: 'Welfare Offering' },
  { id: 'HARVEST', name: 'Harvest' },
];

export const EXPENSE_CATEGORIES = [
  'PASTORAL_SUPPORT',
  'MINISTRY_OPERATIONS',
  'OUTREACH',
  'BUILDING_MAINTENANCE',
  'ADMINISTRATIVE',
  'MISSIONS',
  'EDUCATION',
  'BENEVOLENCE',
  'EVENTS',
  'TECHNOLOGY',
  'UTILITIES',
  'SALARIES',
  'OTHER'
];

export const REPORT_PERIODS = [
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'quarterly', name: 'Quarterly' },
  { id: 'yearly', name: 'Yearly' },
];

export const REPORT_FORMATS = [
  { id: 'pdf', name: 'PDF' },
  { id: 'excel', name: 'Excel' },
  { id: 'csv', name: 'CSV' },
];