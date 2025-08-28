'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlightListItem } from "@/components/FlightListItem";

type FlightRow = {
  id: string;
  dateIso: string;
  processed: boolean;
  filename: string;
  location: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  altitudeMaxMeters: number | null;
};

async function fetchFlights(params: { year?: string; location?: string; cursor?: string | null; limit?: number }): Promise<{ items: Array<FlightRow>; nextCursor: string | null; total: number }> {
  const sp = new URLSearchParams();
  if (params.year) sp.set('year', params.year);
  if (params.location) sp.set('location', params.location);
  if (params.cursor) sp.set('cursor', params.cursor);
  if (params.limit) sp.set('limit', String(params.limit));
  const res = await fetch(`/api/flights/list?${sp.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load flights');
  return res.json();
}

export function FlightsList({ flights }: { flights: Array<FlightRow> }) {
  const sp = useSearchParams();
  const year = sp.get('year') ?? undefined;
  const location = sp.get('location') ?? undefined;

  const [items, setItems] = useState<Array<FlightRow>>(flights);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(flights.length);

  useEffect(() => {
    // initial load from API with limit
    fetchFlights({ year, location, limit: 100 }).then((data) => {
      setItems(data.items);
      setNextCursor(data.nextCursor);
      setTotal(data.total);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, location]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="border rounded-lg" style={{ height: '70vh', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((vi) => {
          const f = items[vi.index];
          const displayProcessed = Boolean(f.processed || f.location || f.durationSeconds || f.distanceMeters || f.altitudeMaxMeters);
          return (
            <div
              key={f.id}
              className="px-4"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <FlightListItem
                processed={displayProcessed}
                filename={f.filename}
                location={f.location}
                dateIso={f.dateIso}
                durationSeconds={f.durationSeconds}
                distanceMeters={f.distanceMeters}
                altitudeMaxMeters={f.altitudeMaxMeters}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}


