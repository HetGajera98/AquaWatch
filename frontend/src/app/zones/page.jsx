'use client';

import { useRouter } from 'next/navigation';
import { Zap, Map, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useZones } from '@/hooks/useZones';
import { GlassCard } from '@/components/ui/GlassCard';
import { StressChip } from '@/components/ui/StressChip';

export default function ZonesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { zones, isLoading } = useZones();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{isAdmin ? 'All Zones' : 'Motor Stations'}</h1>
        <p className="page-subtitle">{zones.length} active {isAdmin ? 'zone' : 'motor station'}{zones.length !== 1 ? 's' : ''} — click to inspect live telemetry</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading zones…
          </div>
        ) : zones.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No zones available. Connect data source.
          </div>
        ) : (
          zones.map(zone => (
            <GlassCard
              key={zone.id}
              style={{ padding: '16px 20px', cursor: 'pointer' }}
              onClick={() => router.push(`/zones/${zone.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(14,165,233,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isAdmin ? <Map size={18} color="var(--primary)" /> : <Zap size={18} color="var(--primary)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {zone.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Tank: {zone.tankLevel?.toFixed(0) ?? '–'}% · Flow: {zone.flowRate?.toFixed(1) ?? '–'} L/min
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>Tank</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{zone.tankLevel?.toFixed(0) ?? '–'}%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>Flow</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{zone.flowRate?.toFixed(1) ?? '–'} L/m</div>
                  </div>
                  <StressChip severity={zone.stressScore} />
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
