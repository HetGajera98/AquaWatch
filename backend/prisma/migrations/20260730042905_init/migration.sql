-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('TANK_LEVEL', 'FLOW_RATE', 'FLOAT_SWITCH');

-- CreateEnum
CREATE TYPE "StressLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SHORTAGE', 'LEAK', 'PUMP');

-- CreateEnum
CREATE TYPE "PumpActionSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "PumpState" AS ENUM ('ON', 'OFF');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanks" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacityL" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tanks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "type" "SensorType" NOT NULL,
    "blynkVirtualPin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_readings" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "rainfallMm" DOUBLE PRECISION NOT NULL,
    "forecastFor" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "sensorId" TEXT,
    "type" "AlertType" NOT NULL,
    "severity" "StressLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pump_actions" (
    "id" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "state" "PumpState" NOT NULL,
    "reason" TEXT NOT NULL,
    "source" "PumpActionSource" NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pump_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sensor_readings_sensorId_recordedAt_idx" ON "sensor_readings"("sensorId", "recordedAt");

-- CreateIndex
CREATE INDEX "weather_readings_zoneId_forecastFor_idx" ON "weather_readings"("zoneId", "forecastFor");

-- CreateIndex
CREATE INDEX "alerts_zoneId_createdAt_idx" ON "alerts"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "pump_actions_tankId_triggeredAt_idx" ON "pump_actions"("tankId", "triggeredAt");

-- AddForeignKey
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "sensors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_readings" ADD CONSTRAINT "weather_readings_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "sensors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_actions" ADD CONSTRAINT "pump_actions_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
