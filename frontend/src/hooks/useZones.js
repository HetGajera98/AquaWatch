'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '@/lib/api';
import { mockZones, mockOperators } from '@/lib/mockData';
import { useAuth } from '@/hooks/useAuth';

async function fetchZones() {
  try {
    const { data } = await api.get('/api/zones');
    return data && data.length > 0 ? data : null;
  } catch (err) {
    return null; // null means "use mock"
  }
}

// Match a backend zone to a mock zone by name similarity
function matchToMock(backendZone) {
  const bName = (backendZone.name || '').toLowerCase();
  return mockZones.find(m => bName.includes(m.city.toLowerCase()) || m.name.toLowerCase().includes(bName.split(' ')[0]));
}

export function useZones() {
  const { user } = useAuth();
  const isOperator = user?.role === 'operator';

  const { data: backendZones, isLoading, error } = useQuery({
    queryKey: ['zones'],
    queryFn:  fetchZones,
    retry: 1,
    refetchInterval: 15 * 1000,
  });

  const zones = useMemo(() => {
    // 1. Merge live backend data (tank level, flow, stress) into mock zones where possible.
    const mergedZones = mockZones.map(mockZone => {
      if (!backendZones) return mockZone; // full mock fallback
      // Try to find a matching backend zone by name
      const live = backendZones.find(bz => matchToMock(bz)?.id === mockZone.id);
      if (!live) return mockZone;
      // Merge live values on top of mock — preserve mock ID and chart history
      return {
        ...mockZone,
        tankLevel:       live.tankLevel       ?? mockZone.tankLevel,
        flowRate:        live.flowRate         ?? mockZone.flowRate,
        leakProbability: live.leakProbability  ?? mockZone.leakProbability,
        pumpStatus:      live.pumpStatus        ?? mockZone.pumpStatus,
        stressScore:     live.stressScore       ?? mockZone.stressScore,
      };
    });

    if (isOperator) {
      // Operator: always use their assigned mock zone
      const opProfile = mockOperators.find(op => op.email === user?.email);
      if (opProfile) {
        const assignedZone = mergedZones.find(z => z.id === opProfile.zoneId);
        return assignedZone ? [assignedZone] : mergedZones.slice(0, 1);
      }
      return mergedZones.slice(0, 1);
    }

    // Admin: return all zones
    return mergedZones;
  }, [backendZones, isOperator, user?.email]);

  return { zones, isLoading, error };
}
