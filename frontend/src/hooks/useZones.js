'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mockZones } from '@/lib/mockData';

async function fetchZones() {
  const { data } = await api.get('/api/zones');
  return data;
}

export function useZones() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['zones'],
    queryFn:  fetchZones,
  });

  // Fallback to mock data if backend is unavailable
  const zones = data ?? (error ? mockZones : null);
  return { zones: zones ?? [], isLoading, error, usingMock: !data && !!error };
}
