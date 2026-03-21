import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomeService } from '../services/income';
import toast from 'react-hot-toast';

export const useIncome = (params = {}) => {
  const queryClient = useQueryClient();

  const { data: incomeList, isLoading: isLoadingList } = useQuery({
    queryKey: ['income', params],
    queryFn: () => incomeService.getIncomeList(params),
  });

  const { data: incomeSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['incomeSummary'],
    queryFn: incomeService.getIncomeSummary,
  });

  const { data: incomeAnalytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['incomeAnalytics', params],
    queryFn: () => incomeService.getIncomeAnalytics(params),
  });

  const createTithe = useMutation({
    mutationFn: incomeService.recordTithe,
    onSuccess: () => {
      queryClient.invalidateQueries(['income']);
      queryClient.invalidateQueries(['incomeSummary']);
      toast.success('Tithe recorded successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to record tithe');
    },
  });

  const createOffering = useMutation({
    mutationFn: incomeService.recordOffering,
    onSuccess: () => {
      queryClient.invalidateQueries(['income']);
      queryClient.invalidateQueries(['incomeSummary']);
      toast.success('Offering recorded successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to record offering');
    },
  });

  return {
    incomeList,
    incomeSummary,
    incomeAnalytics,
    isLoading: isLoadingList || isLoadingSummary || isLoadingAnalytics,
    recordTithe: createTithe.mutate,
    recordOffering: createOffering.mutate,
    isRecording: createTithe.isLoading || createOffering.isLoading,
  };
};