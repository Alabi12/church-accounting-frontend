// services/reports.js
import api from './api';

export const reportService = {
 // services/reports.js - Update getFinancialSummary method

getFinancialSummary: async (startDate, endDate) => {
  try {
    console.log('🔍 Fetching financial summary for:', { startDate, endDate });
    
    // Make the request with responseType: 'text' to see raw response
    const response = await api.get('/treasurer/financial-overview', {
      params: { startDate, endDate },
      responseType: 'text'  // Get as text first to inspect
    });
    
    console.log('📥 Raw response text:', response.data.substring(0, 200) + '...'); // First 200 chars
    
    // Try to parse it as JSON
    try {
      const data = JSON.parse(response.data);
      console.log('✅ Successfully parsed JSON');
      console.log('📥 Data structure:', {
        hasSummary: !!data.summary,
        hasIncome: !!data.income,
        hasExpenses: !!data.expenses,
        incomeType: Array.isArray(data.income) ? 'array' : typeof data.income,
        expensesType: Array.isArray(data.expenses) ? 'array' : typeof data.expenses
      });
      
      if (data.summary) {
        console.log('📥 Summary:', data.summary);
      }
      
      if (Array.isArray(data.income)) {
        console.log('📥 Income items count:', data.income.length);
        if (data.income.length > 0) {
          console.log('📥 First income item:', data.income[0]);
        }
      }
      
      if (Array.isArray(data.expenses)) {
        console.log('📥 Expenses items count:', data.expenses.length);
        if (data.expenses.length > 0) {
          console.log('📥 First expense item:', data.expenses[0]);
        }
      }
      
      return {
        totalIncome: data.summary?.totalIncome || 0,
        totalExpenses: data.summary?.totalExpenses || 0,
        netIncome: data.summary?.netIncome || 0,
        profitMargin: data.summary?.profitMargin || 0,
        avgMonthlyIncome: data.summary?.avgMonthlyIncome || 0,
        avgMonthlyExpenses: data.summary?.avgMonthlyExpenses || 0
      };
      
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      console.error('❌ Raw response (first 500 chars):', response.data.substring(0, 500));
      throw new Error('Invalid JSON response from server');
    }
    
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      profitMargin: 0,
      avgMonthlyIncome: 0,
      avgMonthlyExpenses: 0
    };
  }
},

  // Get income vs expenses comparison
  getIncomeVsExpenses: async (months = 6) => {
    try {
      console.log('🔍 Fetching income vs expenses for last', months, 'months');
      const response = await api.get('/accounting/monthly-trend');
      console.log('📥 Monthly trend response status:', response.status);
      
      const data = response.data;
      console.log('📥 Monthly trend data type:', typeof data);
      console.log('📥 Monthly trend is array?', Array.isArray(data));
      
      if (Array.isArray(data)) {
        console.log('📥 Monthly trend length:', data.length);
        if (data.length > 0) {
          console.log('📥 First trend item:', data[0]);
        }
        return data.slice(-months).map(item => ({
          month: item.month,
          income: item.income || 0,
          expenses: item.expenses || 0,
          net: (item.income || 0) - (item.expenses || 0)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching income vs expenses:', error);
      return [];
    }
  },

  // Get expense breakdown
  getExpenseBreakdown: async (startDate, endDate) => {
    try {
      console.log('🔍 Fetching expense breakdown for:', { startDate, endDate });
      
      // First try to get from financial overview
      const overview = await api.get('/treasurer/financial-overview', {
        params: { startDate, endDate }
      });
      
      const expenses = overview.data.expenses || [];
      console.log('📥 Expenses from overview:', {
        type: typeof expenses,
        isArray: Array.isArray(expenses),
        length: Array.isArray(expenses) ? expenses.length : 'N/A'
      });
      
      if (Array.isArray(expenses) && expenses.length > 0) {
        console.log('📥 First expense item:', expenses[0]);
        return expenses;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching expense breakdown:', error);
      return [];
    }
  },

  // Get income breakdown
  getIncomeBreakdown: async (startDate, endDate) => {
    try {
      console.log('🔍 Fetching income breakdown for:', { startDate, endDate });
      
      const overview = await api.get('/treasurer/financial-overview', {
        params: { startDate, endDate }
      });
      
      const income = overview.data.income || [];
      console.log('📥 Income from overview:', {
        type: typeof income,
        isArray: Array.isArray(income),
        length: Array.isArray(income) ? income.length : 'N/A'
      });
      
      if (Array.isArray(income) && income.length > 0) {
        console.log('📥 First income item:', income[0]);
        return income;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching income breakdown:', error);
      return [];
    }
  },

  // Get top categories
  getTopCategories: async (startDate, endDate) => {
    try {
      console.log('🔍 Fetching top categories for:', { startDate, endDate });
      const response = await api.get('/treasurer/financial-overview', {
        params: { startDate, endDate }
      });
      
      const topCategories = response.data.topCategories || [];
      console.log('📥 Top categories:', {
        type: typeof topCategories,
        isArray: Array.isArray(topCategories),
        length: Array.isArray(topCategories) ? topCategories.length : 'N/A'
      });
      
      return topCategories;
    } catch (error) {
      console.error('Error fetching top categories:', error);
      return [];
    }
  },

  // Get financial ratios
  getFinancialRatios: async (startDate, endDate) => {
    try {
      console.log('🔍 Fetching financial ratios for:', { startDate, endDate });
      const response = await api.get('/treasurer/financial-overview', {
        params: { startDate, endDate }
      });
      
      const ratios = response.data.ratios || {
        operatingMargin: 0,
        expenseRatio: 0,
        savingsRate: 0,
        liquidityRatio: 0,
        currentRatio: 0,
        debtToEquity: 0
      };
      
      console.log('📥 Ratios:', ratios);
      return ratios;
    } catch (error) {
      console.error('Error fetching financial ratios:', error);
      return {
        operatingMargin: 0,
        expenseRatio: 0,
        savingsRate: 0,
        liquidityRatio: 0,
        currentRatio: 0,
        debtToEquity: 0
      };
    }
  },

  // Export report
  exportReport: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.type) queryParams.append('type', params.type);
      if (params.format) queryParams.append('format', params.format);
      
      const response = await api.get(`/reports/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
};