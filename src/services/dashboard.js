import api from './api';
import { journalService } from './journal';
import { formatCurrency } from '../utils/formatters';

export const dashboardService = {
  // This works - you have this endpoint
  getStats: async () => {
    try {
      const response = await api.get('/accounting/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default structure if endpoint fails
      return {
        totalIncome: 0,
        totalExpenses: 0,
        postedCount: 0,
        pendingCount: 0,
        draftCount: 0,
        cashBalance: 0,
        bankBalance: 0,
        memberCount: 0,
        accountCount: 0,
        todayIncome: 0,
        todayExpenses: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0
      };
    }
  },

  // Alternative: Use journal entries to calculate income vs expenses
  getIncomeVsExpenses: async (months = 6) => {
    try {
      // Try to get from a dedicated endpoint first (if you have it)
      const response = await api.get(`/accounting/income-vs-expenses?months=${months}`);
      return response.data;
    } catch (error) {
      // Fallback: Calculate from journal entries
      console.log('Falling back to journal entries for income/expenses data');
      const entries = await journalService.getJournalEntries({ per_page: 100 });
      return calculateIncomeVsExpenses(entries.items || entries.entries || [], months);
    }
  },

  // Get recent transactions from journal entries
  getRecentTransactions: async (limit = 10) => {
    try {
      const response = await api.get(`/accounting/recent-transactions?limit=${limit}`);
      return response.data;
    } catch (error) {
      // Fallback: Get from journal entries
      const entries = await journalService.getJournalEntries({ per_page: limit });
      return {
        transactions: (entries.items || entries.entries || []).map(entry => ({
          id: entry.id,
          date: entry.entry_date,
          description: entry.description,
          amount: entry.total_credit || entry.total_debit || 0,
          type: entry.total_credit > 0 ? 'income' : 'expense',
          status: entry.status
        }))
      };
    }
  },

  // Get alerts based on dashboard stats
  getAlerts: async () => {
    try {
      const response = await api.get('/accounting/alerts');
      return response.data;
    } catch (error) {
      // Generate alerts from stats
      const stats = await dashboardService.getStats();
      const alerts = [];
      
      if (stats.pendingCount > 0) {
        alerts.push({
          id: 'pending-1',
          severity: stats.pendingCount > 5 ? 'high' : 'medium',
          message: `${stats.pendingCount} journal entr${stats.pendingCount === 1 ? 'y' : 'ies'} pending approval`,
          timestamp: new Date().toISOString()
        });
      }
      
      if (stats.cashBalance < 1000) {
        alerts.push({
          id: 'low-cash-1',
          severity: 'high',
          message: `Low cash balance: ${formatCurrency(stats.cashBalance)}`,
          timestamp: new Date().toISOString()
        });
      }
      
      const netIncome = (stats.totalIncome || 0) - (stats.totalExpenses || 0);
      if (netIncome < 0) {
        alerts.push({
          id: 'negative-net-1',
          severity: 'medium',
          message: `Negative net income: ${formatCurrency(Math.abs(netIncome))}`,
          timestamp: new Date().toISOString()
        });
      }
      
      return { alerts };
    }
  },

  // Get category breakdown from journal entries
  getCategoryBreakdown: async () => {
    try {
      const response = await api.get('/accounting/category-breakdown');
      return response.data;
    } catch (error) {
      // Calculate from journal entries
      const entries = await journalService.getJournalEntries({ per_page: 100 });
      return calculateCategoryBreakdown(entries.items || entries.entries || []);
    }
  },

  // Get monthly trend data
  getMonthlyTrend: async (months = 6) => {
    try {
      const response = await api.get(`/accounting/monthly-trend?months=${months}`);
      return response.data;
    } catch (error) {
      // Calculate from journal entries
      const entries = await journalService.getJournalEntries({ per_page: 100 });
      return calculateMonthlyTrend(entries.items || entries.entries || [], months);
    }
  },

  // Get cash flow data
  getCashFlow: async (days = 30) => {
    try {
      const response = await api.get(`/accounting/cash-flow?days=${days}`);
      return response.data;
    } catch (error) {
      // Return empty array if endpoint doesn't exist
      return [];
    }
  }
};

// Helper function to calculate income vs expenses
const calculateIncomeVsExpenses = (entries, months) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const result = [];
  
  // Initialize last 'months' months with zero
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    result.push({
      month: monthNames[date.getMonth()],
      income: 0,
      expenses: 0
    });
  }
  
  // Aggregate entries by month
  entries.forEach(entry => {
    if (!entry.entry_date) return;
    
    const entryDate = new Date(entry.entry_date);
    const monthDiff = (today.getMonth() - entryDate.getMonth() + 12) % 12;
    
    if (monthDiff < months) {
      const index = months - 1 - monthDiff;
      // Determine if it's income or expense
      if (entry.total_credit > 0) {
        result[index].income += entry.total_credit;
      }
      if (entry.total_debit > 0) {
        result[index].expenses += entry.total_debit;
      }
    }
  });
  
  return result;
};

// Helper function to calculate category breakdown
const calculateCategoryBreakdown = (entries) => {
  const incomeCategories = {};
  const expenseCategories = {};
  
  entries.forEach(entry => {
    // If entry has lines (detailed entries)
    if (entry.lines && Array.isArray(entry.lines)) {
      entry.lines.forEach(line => {
        const category = line.account?.category || 'Uncategorized';
        const amount = Math.abs(line.amount || 0);
        
        if (line.amount > 0) {
          incomeCategories[category] = (incomeCategories[category] || 0) + amount;
        } else if (line.amount < 0) {
          expenseCategories[category] = (expenseCategories[category] || 0) + amount;
        }
      });
    } else {
      // Simple entry - use total_credit/debit
      const category = 'General';
      if (entry.total_credit > 0) {
        incomeCategories[category] = (incomeCategories[category] || 0) + entry.total_credit;
      }
      if (entry.total_debit > 0) {
        expenseCategories[category] = (expenseCategories[category] || 0) + entry.total_debit;
      }
    }
  });
  
  return {
    income: Object.entries(incomeCategories)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
    expenses: Object.entries(expenseCategories)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  };
};

// Helper function to calculate monthly trend
const calculateMonthlyTrend = (entries, months) => {
  return calculateIncomeVsExpenses(entries, months);
};