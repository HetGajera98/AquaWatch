'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getMockZoneDetail } from '@/lib/mockData';

async function fetchZoneDetail(id) {
  const { data } = await api.get(`/api/zones/${id}`);
  return data;
}

export function useZoneDetail(id) {
  const { data, isLoading, error } = useQuery({
    queryKey:        ['zones', id],
    queryFn:         () => fetchZoneDetail(id),
    enabled:         !!id,
    refetchInterval: 15 * 1000,   // refresh every 15s for live sensors
  });

  const zoneDetail = data ?? (error ? getMockZoneDetail(id) : null);
  return { zoneDetail, isLoading, error, usingMock: !data && !!error };
}
