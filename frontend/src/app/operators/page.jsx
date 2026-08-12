'use client';

import { useRouter } from 'next/navigation';
import { Users, Phone, MapPin, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { mockOperators } from '@/lib/mockData';
import { useZones } from '@/hooks/useZones';
import { GlassCard } from '@/components/ui/GlassCard';

export default function OperatorsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { zones } = useZones();
  
  // Quick security check: if someone navigates here directly and isn't admin
  if (user?.role && user.role !== 'admin') {
    if (typeof window !== 'undefined') router.push('/dashboard');
    return null;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Operators</h1>
        <p className="page-subtitle">Manage operator assignments and monitor team performance</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {mockOperators.map(op => {
          // Find the live zone data for this operator's assigned zone
          const assignedZone = zones.find(z => z.id === op.zoneId);
          const isStressed = assignedZone?.stressScore === 'high';

          return (
            <GlassCard key={op.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(14,165,233,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)'
                }}>
                  {op.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{op.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{op.email}</div>
                </div>
                {op.status === 'online' ? (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10B981', padding: '3px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.10)' }}>
                    ONLINE
                  </span>
                ) : (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)' }}>
                    OFFLINE
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} style={{ color: 'var(--text-muted)' }} /> {op.phone}
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Assignment Info */}
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Assigned Station
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={15} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                    {op.zoneName}
                  </span>
                  
                  {isStressed ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 700, color: 'var(--high)' }}>
                      <Activity size={12} /> Needs Help
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 700, color: 'var(--low)' }}>
                      <ShieldCheck size={12} /> Stable
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => router.push(`/zones/${op.zoneId}`)}
                style={{
                  width: '100%', padding: '8px', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 600, 
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  marginTop: 4
                }}
              >
                View Station
              </button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
