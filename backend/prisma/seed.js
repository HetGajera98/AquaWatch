// prisma/seed.js — Seeds Supabase with 4 Indian city zones + sensors + alerts
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function randBetween(min, max) {
  return parseFloat((min + Math.random() * (max - min)).toFixed(2));
}

function genReadings(sensorId, baseVal, count = 48, unit = '%') {
  return Array.from({ length: count }, (_, i) => ({
    sensorId,
    value: parseFloat(Math.max(0, Math.min(100,
      baseVal + Math.sin(i / 4) * 6 + (Math.random() - 0.5) * 3
    )).toFixed(2)),
    unit,
    recordedAt: new Date(Date.now() - (count - 1 - i) * 30 * 60 * 1000),
  }));
}

async function main() {
  console.log('🌱 Seeding AquaWatch database...\n');

  // ── 1. Clear existing data (order matters for FK constraints) ──
  await prisma.sensorReading.deleteMany();
  await prisma.pumpAction.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.weatherReading.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing data');

  // ── 2. Create demo user ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo1234', 10);
  await prisma.user.create({
    data: { email: 'operator@aquawatch.io', passwordHash },
  });
  console.log('✅ Created demo user (operator@aquawatch.io / demo1234)');

  // ── 3. Zone definitions ──────────────────────────────────────────
  const zoneDefs = [
    { name: 'Ahmedabad North', tankLevel: 28.4, flow: 12.3, capacityL: 500000, population: 142000 },
    { name: 'Surat West',      tankLevel: 61.2, flow:  8.7, capacityL: 350000, population: 98000  },
    { name: 'Rajkot Central',  tankLevel: 44.9, flow: 10.1, capacityL: 280000, population: 76000  },
    { name: 'Vadodara South',  tankLevel: 79.6, flow:  6.2, capacityL: 420000, population: 113000 },
  ];

  for (const def of zoneDefs) {
    console.log(`\n  ─ Creating zone: ${def.name}`);

    // Zone
    const zone = await prisma.zone.create({ data: { name: def.name } });

    // Weather
    await prisma.weatherReading.createMany({
      data: Array.from({ length: 14 }, (_, i) => ({
        zoneId:       zone.id,
        temperatureC: randBetween(30, 40),
        rainfallMm:   i === 3 || i === 8 ? randBetween(5, 18) : randBetween(0, 2),
        forecastFor:  new Date(Date.now() - (13 - i) * 86400000),
      })),
    });

    // Tank
    const tank = await prisma.tank.create({
      data: { zoneId: zone.id, name: `Main Tank — ${def.name}`, capacityL: def.capacityL },
    });

    // Sensors
    const tankSensor = await prisma.sensor.create({
      data: { tankId: tank.id, type: 'TANK_LEVEL', blynkVirtualPin: 'V1' },
    });
    const flowSensor = await prisma.sensor.create({
      data: { tankId: tank.id, type: 'FLOW_RATE',  blynkVirtualPin: 'V2' },
    });
    const floatSensor = await prisma.sensor.create({
      data: { tankId: tank.id, type: 'FLOAT_SWITCH', blynkVirtualPin: 'V3' },
    });

    // Sensor readings (48 × 30-min history)
    await prisma.sensorReading.createMany({
      data: genReadings(tankSensor.id,  def.tankLevel, 48, '%'),
    });
    await prisma.sensorReading.createMany({
      data: genReadings(flowSensor.id,  def.flow, 48, 'L/min'),
    });
    const floatVal = def.tankLevel >= 80 ? 1 : 0;
    await prisma.sensorReading.createMany({
      data: Array.from({ length: 48 }, (_, i) => ({
        sensorId:   floatSensor.id,
        value:      floatVal,
        unit:       'boolean',
        recordedAt: new Date(Date.now() - (47 - i) * 30 * 60 * 1000),
      })),
    });

    // Pump actions
    const pumpSource = def.tankLevel < 50 ? 'AUTO' : 'MANUAL';
    const pumpState  = def.tankLevel < 50 ? 'ON' : 'OFF';
    await prisma.pumpAction.createMany({
      data: [
        {
          tankId:      tank.id, state: pumpState, source: pumpSource,
          reason:      pumpState === 'ON' ? 'tank_low' : 'tank_full',
          triggeredAt: new Date(Date.now() - 40 * 60 * 1000),
        },
        {
          tankId:      tank.id, state: pumpState === 'ON' ? 'OFF' : 'ON',
          source:      'AUTO',
          reason:      pumpState === 'ON' ? 'tank_full' : 'tank_low',
          triggeredAt: new Date(Date.now() - 5 * 3600 * 1000),
        },
      ],
    });

    console.log(`     zone_id=${zone.id}`);
    console.log(`     tank_id=${tank.id}`);
    console.log(`     sensors: TANK_LEVEL=${tankSensor.id}, FLOW_RATE=${flowSensor.id}`);
  }

  // ── 4. Alerts ────────────────────────────────────────────────────
  console.log('\n  ─ Creating alerts');
  const zones = await prisma.zone.findMany({ include: { tanks: { include: { sensors: true } } } });

  const ahmZone = zones.find(z => z.name === 'Ahmedabad North');
  const rjkZone = zones.find(z => z.name === 'Rajkot Central');
  const srtZone = zones.find(z => z.name === 'Surat West');

  const ahmFlow = ahmZone?.tanks[0]?.sensors.find(s => s.type === 'FLOW_RATE');
  const rjkFlow = rjkZone?.tanks[0]?.sensors.find(s => s.type === 'FLOW_RATE');

  const alertsData = [
    {
      zoneId:   ahmZone.id,
      sensorId: ahmFlow?.id ?? null,
      type:     'LEAK',
      severity: 'HIGH',
      message:  'Continuous abnormal flow detected at 02:15 AM with no scheduled demand. Likely pipe burst near sector 7.',
      resolved: false,
      createdAt: new Date(Date.now() - 3 * 3600000),
    },
    {
      zoneId:   ahmZone.id,
      sensorId: null,
      type:     'SHORTAGE',
      severity: 'HIGH',
      message:  'Tank level critically low at 28%. At current consumption rate, supply exhaustion in ~14 hours.',
      resolved: false,
      createdAt: new Date(Date.now() - 1 * 3600000),
    },
    {
      zoneId:   rjkZone.id,
      sensorId: rjkFlow?.id ?? null,
      type:     'SHORTAGE',
      severity: 'MEDIUM',
      message:  'Tank level declining steadily. 7-day trend shows -3.1%/day. Elevated consumption detected during peak hours.',
      resolved: false,
      createdAt: new Date(Date.now() - 6 * 3600000),
    },
    {
      zoneId:   rjkZone.id,
      sensorId: rjkFlow?.id ?? null,
      type:     'LEAK',
      severity: 'MEDIUM',
      message:  'Marginal flow anomaly detected overnight. Monitoring for sustained pattern.',
      resolved: true,
      createdAt: new Date(Date.now() - 18 * 3600000),
    },
    {
      zoneId:   srtZone.id,
      sensorId: null,
      type:     'SHORTAGE',
      severity: 'LOW',
      message:  'Minor consumption spike detected. Tank remains healthy at 61%. Monitoring.',
      resolved: true,
      createdAt: new Date(Date.now() - 26 * 3600000),
    },
  ];

  await prisma.alert.createMany({ data: alertsData });
  console.log(`  ✅ Created ${alertsData.length} alerts`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo login: operator@aquawatch.io / demo1234');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
