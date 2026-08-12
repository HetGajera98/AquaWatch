import { Droplets, Activity, Gauge } from 'lucide-react';
import { StressChip } from '../ui/StressChip';

// Map every backend sensor.type to a UI config
// Backend sends lowercase: 'tank_level', 'flow_rate'
const typeConfig = {
  tank_level: { label: 'Tank Level',  Icon: Droplets,  cls: 'tank_level' },
  flow_rate:  { label: 'Flow Rate',   Icon: Activity,  cls: 'flow' },
  // legacy / fallback
  flow:       { label: 'Flow Rate',   Icon: Activity,  cls: 'flow' },
};

const DEFAULT_CFG = { label: 'Sensor', Icon: Gauge, cls: 'tank_level' };

function formatValue(sensor) {
  const val = sensor.liveValue ?? 0;
  return val.toFixed(sensor.type === 'flow_rate' || sensor.type === 'flow' ? 2 : 0);
}

export function SensorRow({ sensor }) {
  const cfg = typeConfig[sensor.type] ?? DEFAULT_CFG;
  const Icon = cfg.Icon;

  return (
    <div className="sensor-row">
      <div className={`sensor-icon-wrap ${cfg.cls}`}>
        <Icon size={16} />
      </div>
      <div className="sensor-info">
        <div className="sensor-name">{cfg.label}</div>
        <div className="sensor-id">{sensor.blynkDeviceId}</div>
      </div>
      <div>
        <div className="sensor-value">{formatValue(sensor)}</div>
        <div className="sensor-unit">{sensor.type === 'float_switch' ? '—' : sensor.unit}</div>
      </div>
      <div style={{ minWidth: 80, textAlign: 'right' }}>
        <StressChip severity={sensor.leakRisk} size="sm" />
      </div>
    </div>
  );
}
