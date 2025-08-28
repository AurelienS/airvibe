import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { FlightsFilters } from "./FlightsFilters";
import { FlightsList } from "./FlightsList";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

export default async function FlightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null;
  if (!email || !user) return notFound();

  const sp = await searchParams;
  const yearParam = Array.isArray(sp?.year) ? sp.year[0] : sp?.year;
  const locationParam = Array.isArray(sp?.location) ? sp.location[0] : sp?.location;

  const where: Prisma.FlightWhereInput = { userId: user.id };
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

  const [initial, locationsAgg] = await Promise.all([
    prisma.flight.findMany({
      where,
      take: 50,
      orderBy: [{ createdAt: 'desc' }],
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
    prisma.flight.findMany({
      where: { userId: user.id, location: { not: null } },
      distinct: ['location'],
      select: { location: true },
      orderBy: { location: 'asc' },
    }),
  ]);
  const locations = locationsAgg.map((l) => l.location!).filter(Boolean) as string[];

  const rows = initial.map((f) => ({
    id: f.id,
    dateIso: (f.startAt ?? f.createdAt).toISOString(),
    processed: f.processed,
    filename: f.filename,
    location: f.location,
    durationSeconds: f.durationSeconds,
    distanceMeters: f.distanceMeters,
    altitudeMaxMeters: f.altitudeMaxMeters,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vols</h1>
        <form action={async () => {
          'use server';
          await signOut({ redirectTo: "/" });
        }}>
          <button className="text-sm px-3 py-2 bg-gray-100 rounded-md">
            Se déconnecter
          </button>
        </form>
      </div>
      <div className="mt-8 space-y-4">
        <FlightsFilters locations={locations} total={rows.length} />
        <FlightsList flights={rows} />
      </div>
    </div>
  );
}


