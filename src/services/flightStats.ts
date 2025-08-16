import { prisma } from "@/lib/db";

export type FlightStats = {
  totalFlights: number;
  totalFlightTimeSeconds: number;
  maxDistanceMeters: number | null;
  maxDurationSeconds: number | null;
  altitudeMaxMeters: number | null;
  longestFlightId: string | null;
};

function toZero(n: number | null): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export async function getUserFlightStats(userId: string): Promise<{ allTime: FlightStats; currentYear: FlightStats }>{
  const now = new Date();
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
  const startOfNextYear = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1, 0, 0, 0));

  // All time (processed flights only for meaningful metrics)
  const [allAgg, allCount, allLongest] = await Promise.all([
    prisma.flight.aggregate({
      where: { userId, processed: true },
      _sum: { durationSeconds: true },
      _max: { distanceMeters: true, durationSeconds: true, altitudeMaxMeters: true },
    }),
    prisma.flight.count({ where: { userId, processed: true } }),
    prisma.flight.findFirst({
      where: { userId, processed: true },
      orderBy: { durationSeconds: 'desc' },
      select: { id: true },
    }),
  ]);

  const yearlyWhere = {
    userId,
    processed: true,
    OR: [
      { startAt: { gte: startOfYear, lt: startOfNextYear } },
      { AND: [{ startAt: null }, { createdAt: { gte: startOfYear, lt: startOfNextYear } }] },
    ],
  };

  const [yearAgg, yearCount, yearLongest] = await Promise.all([
    prisma.flight.aggregate({
      where: yearlyWhere,
      _sum: { durationSeconds: true },
      _max: { distanceMeters: true, durationSeconds: true, altitudeMaxMeters: true },
    }),
    prisma.flight.count({ where: yearlyWhere }),
    prisma.flight.findFirst({
      where: yearlyWhere,
      orderBy: { durationSeconds: 'desc' },
      select: { id: true },
    }),
  ]);

  const allTime: FlightStats = {
    totalFlights: allCount,
    totalFlightTimeSeconds: toZero(allAgg._sum.durationSeconds),
    maxDistanceMeters: allAgg._max.distanceMeters ?? null,
    maxDurationSeconds: allAgg._max.durationSeconds ?? null,
    altitudeMaxMeters: allAgg._max.altitudeMaxMeters ?? null,
    longestFlightId: allLongest?.id ?? null,
  };

  const currentYear: FlightStats = {
    totalFlights: yearCount,
    totalFlightTimeSeconds: toZero(yearAgg._sum?.durationSeconds ?? null),
    maxDistanceMeters: yearAgg._max?.distanceMeters ?? null,
    maxDurationSeconds: yearAgg._max?.durationSeconds ?? null,
    altitudeMaxMeters: yearAgg._max?.altitudeMaxMeters ?? null,
    longestFlightId: yearLongest?.id ?? null,
  };

  return { allTime, currentYear };
}


