import IGCParser from "igc-parser";
import { haversineDistanceMeters } from "@/lib/geo";
import { prisma } from "@/lib/db";
import type { IgcFix, ParsedIgcMinimal } from "@/types/igc";

type ProcessedMetrics = {
  location?: string | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  altitudeMaxMeters?: number | null;
  faiDistanceMeters?: number | null;
  // Derived metrics
  trackLengthMeters?: number | null;
  avgSpeedKmh?: number | null;
  maxAltGainMeters?: number | null;
  maxClimbMs?: number | null;
  maxSinkMs?: number | null;
  startAt?: Date | null;
  endAt?: Date | null;
};

function preferAltitude(fix: IgcFix | undefined): number | null {
  if (!fix) return null;
  const pa = typeof fix.pressureAltitude === 'number' ? fix.pressureAltitude : null;
  const ga = typeof fix.gpsAltitude === 'number' ? fix.gpsAltitude : null;
  const a = pa ?? ga;
  return typeof a === 'number' && !Number.isNaN(a) ? a : null;
}

export function processIgc(rawIgc: string): ProcessedMetrics {
  try {
    const parsed = IGCParser.parse(rawIgc, { lenient: true }) as unknown as ParsedIgcMinimal;
    const points: IgcFix[] = Array.isArray(parsed.fixes) ? parsed.fixes as IgcFix[] : [];
    if (points.length < 2) return {};

    const start = points[0];
    const end = points[points.length - 1];
    // IGC timestamps are UTC by spec; store Date objects in UTC
    const startAt = new Date(start.timestamp);
    const endAt = new Date(end.timestamp);
    const durationSeconds = Math.max(0, Math.floor((endAt.getTime() - startAt.getTime()) / 1000));

    // Distance and altitude max
    let distanceMeters = 0;
    let altitudeMaxMeters = Number.NEGATIVE_INFINITY as number | null;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1] as IgcFix;
      const b = points[i] as IgcFix;
      distanceMeters += haversineDistanceMeters({ lat: a.latitude, lon: a.longitude }, { lat: b.latitude, lon: b.longitude });
      const altB = preferAltitude(b);
      if (typeof altB === 'number') altitudeMaxMeters = Math.max(altitudeMaxMeters as number, altB);
    }
    if (!Number.isFinite(altitudeMaxMeters as number)) altitudeMaxMeters = null;

    // Prefer a name from IGC metadata if available (common: parsed.site as string)
    const siteField = parsed?.site;
    const siteName = (typeof siteField === 'string' ? siteField : (siteField?.name as string | undefined))
      || (parsed?.task?.name as string | undefined)
      || (parsed?.headers?.HFFTY?.site as string | undefined);
    const location = typeof siteName === 'string' && siteName.trim().length > 0
      ? siteName.trim()
      : `${start.latitude.toFixed(4)}, ${start.longitude.toFixed(4)}`;

    // Derived metrics from altitudes/time (not persisted until migration)
    const times: number[] = [];
    const alts: number[] = [];
    let minAltSoFar: number | null = null;
    let maxAltGainMeters: number | null = 0;
    for (let i = 0; i < points.length; i++) {
      const p = points[i] as any;
      const ts = p.timestamp instanceof Date ? p.timestamp.getTime() / 1000 : (typeof p.timestamp === 'number' ? p.timestamp : null);
      const alt = Number.isFinite(p.pressureAltitude) ? Number(p.pressureAltitude) : (Number.isFinite(p.gpsAltitude) ? Number(p.gpsAltitude) : null);
      if (typeof ts === 'number' && typeof alt === 'number') {
        times.push(ts);
        alts.push(alt);
        if (minAltSoFar == null || alt < minAltSoFar) minAltSoFar = alt;
        if (minAltSoFar != null) {
          const gain = alt - minAltSoFar;
          if (gain > (maxAltGainMeters as number)) maxAltGainMeters = gain;
        }
      }
    }

    // Sliding window vertical speeds (~3s window) with spike filtering
    let maxClimbMs: number | null = null;
    let maxSinkMs: number | null = null;
    const windowSeconds = 3;
    const minDt = 1.5;
    let startIdx = 0;
    for (let i = 0; i < times.length; i++) {
      while (startIdx < i && (times[i] - times[startIdx]) > windowSeconds) startIdx++;
      const dt = times[i] - times[startIdx];
      if (dt >= minDt) {
        const vs = (alts[i] - alts[startIdx]) / dt; // m/s
        if (vs < 15 && vs > -15) {
          if (maxClimbMs == null || vs > maxClimbMs) maxClimbMs = vs;
          if (maxSinkMs == null || vs < maxSinkMs) maxSinkMs = vs;
        }
      }
    }

    // Average speed (km/h) using distance and duration
    const avgSpeedKmh = durationSeconds > 0 ? (distanceMeters / durationSeconds) * 3.6 : null;

    // TODO: compute proper FAI triangle; placeholder null for now
    const faiDistanceMeters = null;

    return {
      location,
      durationSeconds,
      distanceMeters: Math.round(distanceMeters),
      altitudeMaxMeters: altitudeMaxMeters as number | null,
      faiDistanceMeters,
      trackLengthMeters: Math.round(distanceMeters),
      avgSpeedKmh: avgSpeedKmh != null ? Number(avgSpeedKmh.toFixed(2)) : null,
      maxAltGainMeters: maxAltGainMeters != null ? Math.round(maxAltGainMeters) : null,
      maxClimbMs: maxClimbMs != null ? Number(maxClimbMs.toFixed(2)) : null,
      maxSinkMs: maxSinkMs != null ? Number(maxSinkMs.toFixed(2)) : null,
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

export function extractStartAt(rawIgc: string): Date | null {
  try {
    const parsed = IGCParser.parse(rawIgc, { lenient: true });
    const points = parsed.fixes ?? [];
    if (points.length === 0) return null;
    const ts = (points[0] as any).timestamp;
    return ts instanceof Date ? ts : new Date(ts);
  } catch {
    return null;
  }
}

export async function backfillStartAtForUser(userId: string, batchSize = 200): Promise<number> {
  const missing = await prisma.flight.findMany({
    where: { userId, processed: true, startAt: null },
    select: { id: true, rawIgc: true },
    take: batchSize,
  });
  if (missing.length === 0) return 0;
  const updates = missing.map(async (f) => {
    const startAt = extractStartAt(f.rawIgc);
    if (!startAt) return null;
    await prisma.flight.update({ where: { id: f.id }, data: { startAt } });
    return f.id;
  });
  const done = await Promise.all(updates);
  return done.filter(Boolean).length;
}


