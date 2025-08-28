import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import IGCParser from "igc-parser";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const url = new URL(req.url);
  const yearParam = url.searchParams.get('year');
  const locationParam = url.searchParams.get('location');
  const cursor = url.searchParams.get('cursor');
  const limitParam = url.searchParams.get('limit');
  const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 200);

  const where: any = { userId: user.id };
  if (locationParam && locationParam.trim()) {
    where.location = { contains: locationParam.trim() };
  }
  if (yearParam) {
    const y = Number(yearParam);
    if (!Number.isNaN(y)) {
      const start = new Date(Date.UTC(y, 0, 1));
      const end = new Date(Date.UTC(y + 1, 0, 1));
      where.OR = [
        { startAt: { gte: start, lt: end } },
        { AND: [{ startAt: null }, { createdAt: { gte: start, lt: end } }] },
      ];
    }
  }

  const [items, total] = await Promise.all([
    prisma.flight.findMany({
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
    }),
    prisma.flight.count({ where }),
  ]);

  // Derive start time from IGC when missing (limited to current page)
  const missingIds = items.filter((f) => f.processed && !f.startAt).map((f) => f.id);
  const rawMap: Record<string, string> = {};
  if (missingIds.length > 0) {
    const raws = await prisma.flight.findMany({
      where: { id: { in: missingIds } },
      select: { id: true, rawIgc: true },
    });
    for (const r of raws) {
      rawMap[r.id] = r.rawIgc;
    }
  }

  const rows = items.map((f) => {
    let start = f.startAt;
    if (!start && f.processed) {
      const raw = rawMap[f.id];
      if (raw) {
        try {
          const parsed = IGCParser.parse(raw, { lenient: true });
          const fixes = parsed.fixes ?? [];
          if (fixes.length > 0) {
            const ts = (fixes[0] as any).timestamp;
            start = ts instanceof Date ? ts : new Date(ts);
          }
        } catch {
          // ignore
        }
      }
    }
    return {
      id: f.id,
      dateIso: (start ?? f.createdAt).toISOString(),
      processed: f.processed,
      filename: f.filename,
      location: f.location,
      durationSeconds: f.durationSeconds,
      distanceMeters: f.distanceMeters,
      altitudeMaxMeters: f.altitudeMaxMeters,
    };
  });
  const nextCursor = items.length === limit ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({ items: rows, nextCursor, total });
}


