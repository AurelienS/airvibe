import IGCParser from "igc-parser";
import { haversineDistanceMeters } from "@/lib/geo";
import { prisma } from "@/lib/db";

type ProcessedMetrics = {
  location?: string | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  altitudeMaxMeters?: number | null;
  faiDistanceMeters?: number | null;
  startAt?: Date | null;
  endAt?: Date | null;
};

export function processIgc(rawIgc: string): ProcessedMetrics {
  try {
    const parsed = IGCParser.parse(rawIgc, { lenient: true });
    console.log("a",parsed);
    const points = parsed.fixes ?? [];
    if (points.length < 2) return {};

    const start = points[0];
    const end = points[points.length - 1];
    // IGC timestamps are UTC by spec; store Date objects in UTC
    const startAt = new Date(start.timestamp);
    const endAt = new Date(end.timestamp);
    const durationSeconds = Math.max(0, Math.floor((endAt.getTime() - startAt.getTime()) / 1000));

    let distanceMeters = 0;
    let altitudeMaxMeters = Number.NEGATIVE_INFINITY;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      distanceMeters += haversineDistanceMeters({ lat: a.latitude, lon: a.longitude }, { lat: b.latitude, lon: b.longitude });
      if (typeof b.gpsAltitude === 'number') {
        altitudeMaxMeters = Math.max(altitudeMaxMeters, b.gpsAltitude);
      }
    }
    if (!Number.isFinite(altitudeMaxMeters)) altitudeMaxMeters = null as unknown as number;

    // Prefer a name from IGC metadata if available (common: parsed.site as string)
    const siteField = (parsed as any)?.site;
    const siteName =
      (typeof siteField === 'string' ? siteField : (siteField?.name as string | undefined)) ||
      ((parsed as any)?.task?.name as string | undefined) ||
      ((parsed as any)?.headers?.HFFTY?.site as string | undefined);
    const location = typeof siteName === 'string' && siteName.trim().length > 0
      ? siteName.trim()
      : `${start.latitude.toFixed(4)}, ${start.longitude.toFixed(4)}`;

    // TODO: compute proper FAI triangle; placeholder null for now
    const faiDistanceMeters = null;

    return {
      location,
      durationSeconds,
      distanceMeters: Math.round(distanceMeters),
      altitudeMaxMeters: altitudeMaxMeters as number | null,
      faiDistanceMeters,
      startAt,
      endAt,
    };
  } catch {
    return {};
  }
}

export async function processUnprocessedFlightsForUser(userId: string, batchSize = 50): Promise<number> {
  const unprocessed = await prisma.flight.findMany({
    where: { userId, processed: false },
    select: { id: true, rawIgc: true },
    take: batchSize,
  });
  if (unprocessed.length === 0) return 0;

  const updates = unprocessed.map((f) => {
    const metrics = processIgc(f.rawIgc);
    return prisma.flight.update({
      where: { id: f.id },
      data: { ...metrics, processed: true },
      select: { id: true },
    });
  });
  const results = await Promise.all(updates);
  return results.length;
}


