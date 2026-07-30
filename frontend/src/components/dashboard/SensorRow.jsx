import { Droplets, Activity, ToggleLeft } from 'lucide-react';
import { StressChip } from '../ui/StressChip';

const typeConfig = {
  flow:         { label: 'Flow Rate',    Icon: Activity,    cls: 'flow' },
  tank_level:   { label: 'Tank Level',   Icon: Droplets,    cls: 'tank_level' },
  float_switch: { label: 'Float Switch', Icon: ToggleLeft,  cls: 'float_switch' },
};

function formatValue(sensor) {
  if (sensor.type === 'float_switch') {
    return sensor.liveValue === 1 ? 'FULL' : 'NORMAL';
  }
  return sensor.liveValue.toFixed(sensor.type === 'flow' ? 2 : 0);
}

export function SensorRow({ sensor }) {
  const cfg = typeConfig[sensor.type];
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
