import { prisma } from '@/lib/db';

export async function listFlightsForUser(userId: string, args: { year?: string; location?: string; cursor?: string | null; limit?: number }) {
  const { year, location, cursor, limit: limitRaw } = args;
  const limit = Math.min(Math.max(Number(limitRaw) || 50, 1), 200);
  const where: any = { userId };
  if (location && location.trim()) where.location = { contains: location.trim() };
  if (year) {
    const y = Number(year);
    if (!Number.isNaN(y)) {
      const start = new Date(Date.UTC(y, 0, 1));
      const end = new Date(Date.UTC(y + 1, 0, 1));
      where.OR = [
        { startAt: { gte: start, lt: end } },
        { AND: [{ startAt: null }, { createdAt: { gte: start, lt: end } }] },
      ];
    }
  }
  const items = await prisma.flight.findMany({
    where,
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ startAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      createdAt: true,
      processed: true,
      filename: true,
      location: true,
      durationSeconds: true,
      distanceMeters: true,
      altitudeMaxMeters: true,
      startAt: true,
    },
  });
  const total = await prisma.flight.count({ where });
  const rows = items.map((f) => ({
    id: f.id,
    dateIso: (f.startAt ?? f.createdAt).toISOString(),
    processed: f.processed,
    filename: f.filename,
    location: f.location,
    durationSeconds: f.durationSeconds,
    distanceMeters: f.distanceMeters,
    altitudeMaxMeters: f.altitudeMaxMeters,
  }));
  const nextCursor = items.length === limit ? items[items.length - 1]?.id ?? null : null;
  return { items: rows, total, nextCursor };
}

export async function listLocationsForUser(userId: string, args: { year?: string; limit?: number }) {
  const { year } = args;
  const where: any = { userId };
  if (year) {
    const y = Number(year);
    if (!Number.isNaN(y)) {
      const start = new Date(Date.UTC(y, 0, 1));
      const end = new Date(Date.UTC(y + 1, 0, 1));
      where.OR = [
        { startAt: { gte: start, lt: end } },
        { AND: [{ startAt: null }, { createdAt: { gte: start, lt: end } }] },
      ];
    }
  }
  const rows = await prisma.flight.findMany({ where, select: { location: true } });
  return Array.from(new Set(rows.map(r => r.location).filter(Boolean) as string[])).sort();
}

export async function getFlightForUser(userId: string, flightId: string) {
  const f = await prisma.flight.findFirst({
    where: { id: flightId, userId },
    select: {
      id: true,
      filename: true,
      createdAt: true,
      startAt: true,
      endAt: true,
      processed: true,
      location: true,
      durationSeconds: true,
      distanceMeters: true,
      altitudeMaxMeters: true,
      faiDistanceMeters: true,
      rawIgc: true,
    },
  });
  return f;
}


