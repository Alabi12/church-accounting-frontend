import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../services/expenses';
import toast from 'react-hot-toast';

export const useExpenses = (params = {}) => {
  const queryClient = useQueryClient();

  const { data: expenseList, isLoading: isLoadingList } = useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expenseService.getExpenseList(params),
  });

  const { data: expenseSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['expenseSummary'],
    queryFn: expenseService.getExpenseSummary,
  });

  const { data: expenseCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: expenseService.getExpenseCategories,
  });

  const createExpense = useMutation({
    mutationFn: expenseService.recordExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenseSummary']);
      toast.success('Expense recorded successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to record expense');
    },
  });

  return {
    expenseList,
    expenseSummary,
    expenseCategories,
    isLoading: isLoadingList || isLoadingSummary || isLoadingCategories,
    recordExpense: createExpense.mutate,
    isRecording: createExpense.isLoading,
  };
};