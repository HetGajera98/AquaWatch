// ─────────────────────────────────────────────────────────────────
// AquaWatch — Rich Mock Data (4 Indian city zones)
// ─────────────────────────────────────────────────────────────────

// Helper: generate sinusoidal level history for tank chart
function genLevelHistory(base, points = 48) {
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(Date.now() - (points - 1 - i) * 30 * 60 * 1000).toISOString(),
    value: Math.max(5, Math.min(100,
      base + Math.sin(i / 4) * 8 + (Math.random() - 0.5) * 4
    )).toFixed(1) * 1,
  }));
}

// Helper: generate 14-day consumption + rainfall history
function genConsumptionHistory(baseConsumption, days = 14) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - 1 - i) * 86400000)
      .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    consumption: Math.round(baseConsumption + (Math.random() - 0.5) * 400),
  }));
}

function genRainfallHistory(days = 14) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - 1 - i) * 86400000)
      .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    rainfall: i === 3 || i === 8 || i === 12
      ? parseFloat((Math.random() * 15 + 5).toFixed(1))
      : parseFloat((Math.random() * 2).toFixed(1)),
  }));
}

// ─────────────────────────────────────────────
// ZONES (summary cards on dashboard)
// ─────────────────────────────────────────────
export const mockZones = [
  {
    id: 'zone-ahm-north',
    name: 'Ahmedabad North',
    city: 'Ahmedabad',
    population: 142000,
    tankLevel: 28.4,
    tankLevelHistory: genLevelHistory(28),
    flowRate: 12.3,
    floatSwitch: 'empty',
    leakProbability: 0.12,
    stressScore: 'high',
    pumpStatus: 'on',
  },
  {
    id: 'zone-srt-west',
    name: 'Surat West',
    city: 'Surat',
    population: 98000,
    tankLevel: 61.2,
    tankLevelHistory: genLevelHistory(61),
    flowRate: 8.7,
    floatSwitch: 'normal',
    leakProbability: 0.18,
    stressScore: 'low',
    pumpStatus: 'off',
  },
  {
    id: 'zone-rjk-central',
    name: 'Rajkot Central',
    city: 'Rajkot',
    population: 76000,
    tankLevel: 44.9,
    tankLevelHistory: genLevelHistory(45),
    flowRate: 10.1,
    floatSwitch: 'normal',
    leakProbability: 0.42,
    stressScore: 'medium',
    pumpStatus: 'on',
  },
  {
    id: 'zone-vdr-south',
    name: 'Vadodara South',
    city: 'Vadodara',
    population: 113000,
    tankLevel: 79.6,
    tankLevelHistory: genLevelHistory(80),
    flowRate: 6.2,
    floatSwitch: 'full',
    leakProbability: 0.09,
    stressScore: 'low',
    pumpStatus: 'off',
  },
];
// ─────────────────────────────────────────────
// OPERATORS (for Admin view)
// ─────────────────────────────────────────────
export const mockOperators = [
  {
    id: 'op-demo',
    name: 'Demo Operator',
    email: 'operator@aquawatch.io',
    phone: '+91 98765 00000',
    zoneId: 'zone-ahm-north',
    zoneName: 'Ahmedabad North',
    status: 'online',
    lastActive: 'Just now',
  },
  {
    id: 'op-01',
    name: 'Rahul Sharma',
    email: 'rahul.s@aquawatch.io',
    phone: '+91 98765 43210',
    zoneId: 'zone-ahm-north',
    zoneName: 'Ahmedabad North',
    status: 'online',
    lastActive: 'Just now',
  },
  {
    id: 'op-02',
    name: 'Priya Patel',
    email: 'priya.p@aquawatch.io',
    phone: '+91 98765 43211',
    zoneId: 'zone-srt-west',
    zoneName: 'Surat West',
    status: 'online',
    lastActive: '5m ago',
  },
  {
    id: 'op-03',
    name: 'Amit Kumar',
    email: 'amit.k@aquawatch.io',
    phone: '+91 98765 43212',
    zoneId: 'zone-rjk-central',
    zoneName: 'Rajkot Central',
    status: 'offline',
    lastActive: '2h ago',
  },
  {
    id: 'op-04',
    name: 'Neha Desai',
    email: 'neha.d@aquawatch.io',
    phone: '+91 98765 43213',
    zoneId: 'zone-vdr-south',
    zoneName: 'Vadodara South',
    status: 'online',
    lastActive: '1m ago',
  },
];

// ─────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────
export const mockAlerts = [
  {
    id: 'alert-001',
    zoneId: 'zone-ahm-north',
    zoneName: 'Ahmedabad North',
    sensorId: 'sns-ahm-flow-1',
    type: 'leak',
    severity: 'high',
    message: 'Continuous abnormal flow detected at 02:15 AM with no scheduled demand. Likely pipe burst near sector 7.',
    acknowledged: false,
    confidence: 0.89,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'alert-002',
    zoneId: 'zone-ahm-north',
    zoneName: 'Ahmedabad North',
    sensorId: null,
    type: 'water_stress',
    severity: 'high',
    message: 'Tank level critically low at 28%. At current consumption rate, supply exhaustion in ~14 hours.',
    acknowledged: false,
    confidence: 0.95,
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'alert-003',
    zoneId: 'zone-rjk-central',
    zoneName: 'Rajkot Central',
    sensorId: 'sns-rjk-flow-2',
    type: 'water_stress',
    severity: 'medium',
    message: 'Tank level declining steadily. 7-day trend shows -3.1%/day. Elevated consumption detected during peak hours.',
    acknowledged: false,
    confidence: 0.77,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'alert-004',
    zoneId: 'zone-rjk-central',
    zoneName: 'Rajkot Central',
    sensorId: 'sns-rjk-flow-1',
    type: 'leak',
    severity: 'medium',
    message: 'Marginal flow anomaly detected overnight. Monitoring for sustained pattern.',
    acknowledged: true,
    confidence: 0.61,
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: 'alert-005',
    zoneId: 'zone-srt-west',
    zoneName: 'Surat West',
    sensorId: null,
    type: 'water_stress',
    severity: 'low',
    message: 'Minor consumption spike detected. Tank remains healthy at 61%. Monitoring.',
    acknowledged: true,
    confidence: 0.53,
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
];

// ─────────────────────────────────────────────
// ZONE DETAIL (full data for /zones/[id] page)
// ─────────────────────────────────────────────
const ZONE_DETAILS = {
  'zone-ahm-north': {
    id: 'zone-ahm-north',
    name: 'Ahmedabad North',
    city: 'Ahmedabad',
    population: 142000,
    stressScore: 'high',
    weather: { temperatureC: 38.2, rainfallMm: 1.4 },
    tank: {
      id: 'tank-ahm-1',
      name: 'Main Overhead Tank A1',
      capacityLiters: 500000,
      levelPercent: 28.4,
      levelHistory: genLevelHistory(28, 48),
    },
    pump: {
      id: 'pump-ahm-1',
      status: 'on',
      lastAction: {
        id: 'pa-001',
        pumpId: 'pump-ahm-1',
        action: 'on',
        triggeredBy: 'auto',
        reason: 'tank_critical',
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      },
    },
    sensors: [
      { id: 'sns-ahm-tank-1', type: 'tank_level', label: 'Tank Level Sensor', liveValue: 28.4, unit: '%', status: 'ok', blynkPin: 'V1' },
      { id: 'sns-ahm-flow-1', type: 'flow', label: 'Main Flow Meter', liveValue: 12.3, unit: 'L/min', status: 'alert', blynkPin: 'V2' },
      { id: 'sns-ahm-float-1', type: 'float_switch', label: 'Float Switch', liveValue: 0, unit: 'boolean', status: 'ok', blynkPin: 'V3' },
    ],
    pumpHistory: [
      { id: 'pha-001', action: 'on', triggeredBy: 'auto', reason: 'tank_critical', createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: 'pha-002', action: 'off', triggeredBy: 'auto', reason: 'tank_full', createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
      { id: 'pha-003', action: 'on', triggeredBy: 'manual', reason: 'manual_override', createdAt: new Date(Date.now() - 7 * 3600000).toISOString() },
      { id: 'pha-004', action: 'off', triggeredBy: 'auto', reason: 'leak_detected', createdAt: new Date(Date.now() - 9 * 3600000).toISOString() },
    ],
    consumptionHistory: genConsumptionHistory(2100),
    rainfallHistory: genRainfallHistory(),
    // Static fallback AI prediction (overridden by live call when AI is up)
    aiPrediction: {
      shortage: { severity: 'high', confidence: 0.95, stressScore: 87 },
      leak: { leakProbability: 0.12, isLeak: false, sensorId: 'sns-ahm-flow-1', reason: 'Flow within expected range' },
      pump: { action: 'on', reason: 'tank_critical' },
    },
  },

  'zone-srt-west': {
    id: 'zone-srt-west',
    name: 'Surat West',
    city: 'Surat',
    population: 98000,
    stressScore: 'low',
    weather: { temperatureC: 33.6, rainfallMm: 6.2 },
    tank: {
      id: 'tank-srt-1',
      name: 'West Reservoir B2',
      capacityLiters: 350000,
      levelPercent: 61.2,
      levelHistory: genLevelHistory(61, 48),
    },
    pump: {
      id: 'pump-srt-1',
      status: 'off',
      lastAction: {
        id: 'pa-010',
        pumpId: 'pump-srt-1',
        action: 'off',
        triggeredBy: 'auto',
        reason: 'tank_full',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    },
    sensors: [
      { id: 'sns-srt-tank-1', type: 'tank_level', label: 'Tank Level Sensor', liveValue: 61.2, unit: '%', status: 'ok', blynkPin: 'V1' },
      { id: 'sns-srt-flow-1', type: 'flow', label: 'Main Flow Meter', liveValue: 8.7, unit: 'L/min', status: 'ok', blynkPin: 'V2' },
      { id: 'sns-srt-float-1', type: 'float_switch', label: 'Float Switch', liveValue: 1, unit: 'boolean', status: 'ok', blynkPin: 'V3' },
    ],
    pumpHistory: [
      { id: 'phb-001', action: 'off', triggeredBy: 'auto', reason: 'tank_full', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'phb-002', action: 'on', triggeredBy: 'auto', reason: 'tank_low', createdAt: new Date(Date.now() - 14 * 3600000).toISOString() },
    ],
    consumptionHistory: genConsumptionHistory(1600),
    rainfallHistory: genRainfallHistory(),
    aiPrediction: {
      shortage: { severity: 'low', confidence: 0.91, stressScore: 22 },
      leak: { leakProbability: 0.18, isLeak: false, sensorId: null, reason: 'Flow within expected range' },
      pump: { action: 'off', reason: 'tank_full' },
    },
  },

  'zone-rjk-central': {
    id: 'zone-rjk-central',
    name: 'Rajkot Central',
    city: 'Rajkot',
    population: 76000,
    stressScore: 'medium',
    weather: { temperatureC: 36.4, rainfallMm: 0.8 },
    tank: {
      id: 'tank-rjk-1',
      name: 'Central Storage C3',
      capacityLiters: 280000,
      levelPercent: 44.9,
      levelHistory: genLevelHistory(45, 48),
    },
    pump: {
      id: 'pump-rjk-1',
      status: 'on',
      lastAction: {
        id: 'pa-020',
        pumpId: 'pump-rjk-1',
        action: 'on',
        triggeredBy: 'auto',
        reason: 'tank_low',
        createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      },
    },
    sensors: [
      { id: 'sns-rjk-tank-1', type: 'tank_level', label: 'Tank Level Sensor', liveValue: 44.9, unit: '%', status: 'ok', blynkPin: 'V1' },
      { id: 'sns-rjk-flow-1', type: 'flow', label: 'Inlet Flow Meter', liveValue: 10.1, unit: 'L/min', status: 'warning', blynkPin: 'V2' },
      { id: 'sns-rjk-flow-2', type: 'flow', label: 'Distribution Flow Meter', liveValue: 7.4, unit: 'L/min', status: 'ok', blynkPin: 'V4' },
      { id: 'sns-rjk-float-1', type: 'float_switch', label: 'Float Switch', liveValue: 0, unit: 'boolean', status: 'ok', blynkPin: 'V3' },
    ],
    pumpHistory: [
      { id: 'phc-001', action: 'on', triggeredBy: 'auto', reason: 'tank_low', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: 'phc-002', action: 'off', triggeredBy: 'auto', reason: 'tank_full', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: 'phc-003', action: 'on', triggeredBy: 'manual', reason: 'manual_override', createdAt: new Date(Date.now() - 11 * 3600000).toISOString() },
    ],
    consumptionHistory: genConsumptionHistory(1850),
    rainfallHistory: genRainfallHistory(),
    aiPrediction: {
      shortage: { severity: 'medium', confidence: 0.78, stressScore: 56 },
      leak: { leakProbability: 0.42, isLeak: false, sensorId: 'sns-rjk-flow-1', reason: 'Slightly elevated overnight flow — monitoring' },
      pump: { action: 'on', reason: 'tank_low' },
    },
  },

  'zone-vdr-south': {
    id: 'zone-vdr-south',
    name: 'Vadodara South',
    city: 'Vadodara',
    population: 113000,
    stressScore: 'low',
    weather: { temperatureC: 31.8, rainfallMm: 12.6 },
    tank: {
      id: 'tank-vdr-1',
      name: 'South Basin D4',
      capacityLiters: 420000,
      levelPercent: 79.6,
      levelHistory: genLevelHistory(80, 48),
    },
    pump: {
      id: 'pump-vdr-1',
      status: 'off',
      lastAction: {
        id: 'pa-030',
        pumpId: 'pump-vdr-1',
        action: 'off',
        triggeredBy: 'auto',
        reason: 'tank_full',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      },
    },
    sensors: [
      { id: 'sns-vdr-tank-1', type: 'tank_level', label: 'Tank Level Sensor', liveValue: 79.6, unit: '%', status: 'ok', blynkPin: 'V1' },
      { id: 'sns-vdr-flow-1', type: 'flow', label: 'Main Flow Meter', liveValue: 6.2, unit: 'L/min', status: 'ok', blynkPin: 'V2' },
      { id: 'sns-vdr-float-1', type: 'float_switch', label: 'Float Switch', liveValue: 1, unit: 'boolean', status: 'ok', blynkPin: 'V3' },
    ],
    pumpHistory: [
      { id: 'phd-001', action: 'off', triggeredBy: 'auto', reason: 'tank_full', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: 'phd-002', action: 'on', triggeredBy: 'auto', reason: 'tank_low', createdAt: new Date(Date.now() - 8 * 3600000).toISOString() },
    ],
    consumptionHistory: genConsumptionHistory(2300),
    rainfallHistory: genRainfallHistory(),
    aiPrediction: {
      shortage: { severity: 'low', confidence: 0.96, stressScore: 14 },
      leak: { leakProbability: 0.09, isLeak: false, sensorId: null, reason: 'No anomalies detected' },
      pump: { action: 'off', reason: 'tank_full' },
    },
  },
};

export function getMockZoneDetail(id) {
  return ZONE_DETAILS[id] ?? null;
}

// Legacy named exports (kept for backward compat)
export const mockSensors = {};
export const mockTanks = {};
export const mockPumps = {};
export const mockWeather = {};
export const mockAIPredictions = {};
