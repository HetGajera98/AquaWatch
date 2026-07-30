'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mockAlerts } from '@/lib/mockData';

async function fetchAlerts(params = {}) {
  const { data } = await api.get('/api/alerts', { params });
  return data;
}

async function acknowledgeAlert(id) {
  const { data } = await api.patch(`/api/alerts/${id}/acknowledge`);
  return data;
}

export function useAlerts(filters = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts', filters],
    queryFn:  () => fetchAlerts(filters),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const alerts = data ?? (error ? mockAlerts : null);
  return {
    alerts:      alerts ?? [],
    isLoading,
    error,
    usingMock:   !data && !!error,
    acknowledge: acknowledgeMutation.mutate,
  };
}
