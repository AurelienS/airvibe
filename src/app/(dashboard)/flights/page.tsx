import { auth } from "@/auth"; // kept for route gating by middleware
import { getCurrentUserOrThrow } from "@/lib/users";
import { FlightsFilters } from "./FlightsFilters";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { SkeletonList } from '@/components/SkeletonList';
const FlightsListServer = dynamic(() => import('./FlightsListServer'));
import { listFlightsForUser } from '@/services/flights';
import { createApiClient } from '@/lib/apiClient';
import type { Prisma } from "@prisma/client";
import { Suspense as ReactSuspense } from 'react';

export default async function FlightsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUserOrThrow();

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

  // Preload minimal data: just enough to render filters quickly

  return (
    <div className="p-6">
      <div className="space-y-4">
        <FlightsFilters locations={[]} />
        <Suspense fallback={<SkeletonList rows={10} />}>
          <FlightsListServer year={yearParam} location={locationParam} />
        </Suspense>
      </div>
    </div>
  );
}


