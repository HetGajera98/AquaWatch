'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getMockZoneDetail } from '@/lib/mockData';

export function useZoneDetail(id) {
  const fetchZoneDetail = async () => {
    // If id comes with spaces instead of hyphens, normalize it for the mock dictionary
    const normalizedId = typeof id === 'string' ? id.replace(/ /g, '-').replace(/%20/g, '-') : id;
    
    try {
      const { data } = await api.get(`/api/zones/${id}`);
      if (data) return data;
    } catch (err) {
      // Backend unavailable or 404, fallback to mock data
    }
    return getMockZoneDetail(normalizedId);
  };

  const { data, isLoading, error } = useQuery({
    queryKey:        ['zones', id],
    queryFn:         fetchZoneDetail,
    enabled:         !!id,
    retry: 1,
    refetchInterval: 15 * 1000,
  });

  return { zoneDetail: data ?? null, isLoading, error };
}
