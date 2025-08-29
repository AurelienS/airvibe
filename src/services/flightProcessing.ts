import IGCParser from "igc-parser";
import { haversineDistanceMeters } from "@/lib/geo";
import { prisma } from "@/lib/db";
import type { IgcFix, ParsedIgcMinimal } from "@/types/igc";

export type ProcessedMetrics = {
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

export function preferAltitude(fix: IgcFix | undefined): number | null {
  if (!fix) return null;
  const pa = typeof fix.pressureAltitude === 'number' ? fix.pressureAltitude : null;
  const ga = typeof fix.gpsAltitude === 'number' ? fix.gpsAltitude : null;
  const a = pa ?? ga;
  return typeof a === 'number' && !Number.isNaN(a) ? a : null;
}

export function timestampSeconds(ts: IgcFix["timestamp"]): number | null {
  if (ts instanceof Date) return ts.getTime() / 1000;
  if (typeof ts === 'number') return ts;
  const d = new Date(ts as string);
  const n = d.getTime();
  return Number.isFinite(n) ? n / 1000 : null;
}

export function computeStartEnd(points: IgcFix[]): { startAt: Date; endAt: Date; durationSeconds: number } {
  const startAt = new Date(points[0].timestamp);
  const endAt = new Date(points[points.length - 1].timestamp);
  const durationSeconds = Math.max(0, Math.floor((endAt.getTime() - startAt.getTime()) / 1000));
  return { startAt, endAt, durationSeconds };
}

export function computeDistanceAndAltitudeMax(points: IgcFix[]): { distanceMeters: number; altitudeMaxMeters: number | null } {
  let distanceMeters = 0;
  let altitudeMaxMeters: number | null = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    distanceMeters += haversineDistanceMeters({ lat: a.latitude, lon: a.longitude }, { lat: b.latitude, lon: b.longitude });
    const altB = preferAltitude(b);
    if (typeof altB === 'number') altitudeMaxMeters = altitudeMaxMeters == null ? altB : Math.max(altitudeMaxMeters, altB);
  }
  return { distanceMeters, altitudeMaxMeters };
}

export function extractTimesAndAlts(points: IgcFix[]): { times: number[]; alts: number[] } {
  const times: number[] = [];
  const alts: number[] = [];
  for (const p of points) {
    const ts = timestampSeconds(p.timestamp);
    const alt = preferAltitude(p);
    if (typeof ts === 'number' && typeof alt === 'number') {
      times.push(ts);
      alts.push(alt);
    }
  }
  return { times, alts };
}

export function computeMaxAltitudeGain(alts: number[]): number | null {
  let minAlt: number | null = null;
  let maxGain = 0;
  for (const alt of alts) {
    if (minAlt == null || alt < minAlt) minAlt = alt;
    if (minAlt != null) {
      const gain = alt - minAlt;
      if (gain > maxGain) maxGain = gain;
    }
  }
  return maxGain > 0 ? Math.round(maxGain) : null;
}

export function computeVerticalExtremes(times: number[], alts: number[]): { maxClimbMs: number | null; maxSinkMs: number | null } {
  let maxClimb: number | null = null;
  let maxSink: number | null = null;
  const windowSeconds = 3;
  const minDt = 1.5;
  let startIdx = 0;
  for (let i = 0; i < times.length; i++) {
    while (startIdx < i && (times[i] - times[startIdx]) > windowSeconds) startIdx++;
    const dt = times[i] - times[startIdx];
    if (dt >= minDt) {
      const vs = (alts[i] - alts[startIdx]) / dt; // m/s
      if (vs < 15 && vs > -15) {
        if (maxClimb == null || vs > maxClimb) maxClimb = vs;
        if (maxSink == null || vs < maxSink) maxSink = vs;
      }
    }
  }
  // Fallback: pairwise if window produced no values
  if (maxClimb == null || maxSink == null) {
    for (let i = 1; i < times.length; i++) {
      const dt = times[i] - times[i - 1];
      if (dt > 0.8) {
        const vs = (alts[i] - alts[i - 1]) / dt;
        if (vs < 15 && vs > -15) {
          if (maxClimb == null || vs > maxClimb) maxClimb = vs;
          if (maxSink == null || vs < maxSink) maxSink = vs;
        }
      }
    }
  }
  return {
    maxClimbMs: maxClimb != null ? Number(maxClimb.toFixed(2)) : null,
    maxSinkMs: maxSink != null ? Number(maxSink.toFixed(2)) : null,
  };
}

export function computeAvgSpeedKmH(distanceMeters: number, durationSeconds: number): number | null {
  return durationSeconds > 0 ? Number(((distanceMeters / durationSeconds) * 3.6).toFixed(2)) : null;
}

export function resolveLocation(parsed: ParsedIgcMinimal, start: IgcFix): string {
  const siteField = parsed?.site;
  const siteName = (typeof siteField === 'string' ? siteField : (siteField?.name as string | undefined))
    || (parsed?.task?.name as string | undefined)
    || (parsed?.headers?.HFFTY?.site as string | undefined);
  return (typeof siteName === 'string' && siteName.trim().length > 0)
    ? siteName.trim()
    : `${start.latitude.toFixed(4)}, ${start.longitude.toFixed(4)}`;
}

export function processIgc(rawIgc: string): ProcessedMetrics {
  try {
    const parsed = IGCParser.parse(rawIgc, { lenient: true }) as unknown as ParsedIgcMinimal;
    const points: IgcFix[] = Array.isArray(parsed.fixes) ? parsed.fixes as IgcFix[] : [];
    if (points.length < 2) return {};

    const start = points[0];
    const { startAt, endAt, durationSeconds } = computeStartEnd(points);
    const { distanceMeters, altitudeMaxMeters } = computeDistanceAndAltitudeMax(points);
    const location = resolveLocation(parsed, start);
    const { times, alts } = extractTimesAndAlts(points);
    const maxAltGainMeters = computeMaxAltitudeGain(alts);
    const { maxClimbMs, maxSinkMs } = computeVerticalExtremes(times, alts);
    const avgSpeedKmh = computeAvgSpeedKmH(distanceMeters, durationSeconds);

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


