// utils/formatters.js
import { format } from 'date-fns';

export const formatCurrency = (amount, currency = 'GHS') => {
  if (amount === undefined || amount === null) return formatCurrency(0, currency);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('GHS', 'GH₵'); // Replace GHS with GH₵ symbol
};

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const formatDateTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting dateTime:', error);
    return '';
  }
};

export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  // Ghana phone number format: +233 XX XXX XXXX
  if (cleaned.length === 12 && cleaned.startsWith('233')) {
    return '+' + cleaned.slice(0,3) + ' ' + cleaned.slice(3,5) + ' ' + cleaned.slice(5,8) + ' ' + cleaned.slice(8);
  }
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return '+233 ' + cleaned.slice(1,3) + ' ' + cleaned.slice(3,6) + ' ' + cleaned.slice(6);
  }
  return phoneNumber;
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const truncateText = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Safe date formatter
export const safeFormatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  try {
    if (typeof date === 'string' && 
        (date.includes('Jan') || date.includes('Feb') || date.includes('Mar') ||
         date.includes('Apr') || date.includes('May') || date.includes('Jun') ||
         date.includes('Jul') || date.includes('Aug') || date.includes('Sep') ||
         date.includes('Oct') || date.includes('Nov') || date.includes('Dec'))) {
      return date;
    }
    return formatDate(date, formatStr);
  } catch (error) {
    console.error('Error in safeFormatDate:', error);
    return String(date);
  }
};