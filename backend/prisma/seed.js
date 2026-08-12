// prisma/seed.js — Seeds Supabase with the single real hardware demo zone
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
  console.log('🌱 Seeding AquaWatch database for Hackathon Demo...\n');

  // ── 1. Clear existing data (order matters for FK constraints) ──
  await prisma.sensorReading.deleteMany();
  await prisma.pumpAction.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.weatherReading.deleteMany();
  await prisma.sensor.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing mock data');

  // ── 2. Create demo user ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('demo1234', 10);
  await prisma.user.create({
    data: { email: 'operator@aquawatch.io', passwordHash },
  });
  console.log('✅ Created demo user (operator@aquawatch.io / demo1234)');

  // ── 3. Single Real Zone Definition ───────────────────────────────
  const def = { name: 'Ahmedabad North', tankLevel: 45.0, flow: 8.5, capacityL: 200000 };
  
  console.log(`\n  ─ Creating zone: ${def.name}`);

  // Zone
  const zone = await prisma.zone.create({ data: { id: 'zone-ahm-north', name: def.name } });

  // Weather (mock forecast for the AI model)
  await prisma.weatherReading.createMany({
    data: Array.from({ length: 14 }, (_, i) => ({
      zoneId:       zone.id,
      temperatureC: randBetween(28, 35),
      rainfallMm:   i === 3 || i === 8 ? randBetween(5, 12) : randBetween(0, 1),
      forecastFor:  new Date(Date.now() - (13 - i) * 86400000),
    })),
  });

  // Tank
  const tank = await prisma.tank.create({
    data: { zoneId: zone.id, name: `Main Reservoir`, capacityL: def.capacityL },
  });

  // Sensors mapping exactly to ESP32 Blynk Pins
  const tankSensor = await prisma.sensor.create({
    data: { tankId: tank.id, type: 'TANK_LEVEL', blynkVirtualPin: 'V0' },
  });
  const flowSensor = await prisma.sensor.create({
    data: { tankId: tank.id, type: 'FLOW_RATE',  blynkVirtualPin: 'V2' },
  });
  
  console.log('✅ Created TANK_LEVEL (V0) and FLOW_RATE (V2) sensors (Radar/Ultrasonic & YF-S201)');

  // Seed some historical data so charts aren't empty on boot
  await prisma.sensorReading.createMany({
    data: genReadings(tankSensor.id, def.tankLevel, 48, '%'),
  });
  await prisma.sensorReading.createMany({
    data: genReadings(flowSensor.id, def.flow, 48, 'L/min'),
  });

  // Pump actions
  await prisma.pumpAction.create({
    data: {
      tankId:      tank.id, 
      state:       'OFF', 
      source:      'AUTO',
      reason:      'system_init',
      triggeredAt: new Date(Date.now() - 5 * 3600 * 1000),
    },
  });

  console.log(`     zone_id=${zone.id}`);
  console.log(`     tank_id=${tank.id}`);

  // ── 4. Alerts ────────────────────────────────────────────────────
  console.log('\n  ─ Creating empty alerts state');
  // No fake alerts - let the real hardware and AI trigger them during demo!

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo login: operator@aquawatch.io / demo1234');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
