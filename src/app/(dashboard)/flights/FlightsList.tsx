'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from "@/lib/apiClient";
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
  return apiClient.listFlights(params) as any;
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
      try { window.dispatchEvent(new CustomEvent('flights:total', { detail: data.total })); } catch {}
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, location]);

  // Refresh list when processing ends
  useEffect(() => {
    const onChanged = () => {
      fetchFlights({ year, location, limit: 100 }).then((data) => {
        setItems(data.items);
        setNextCursor(data.nextCursor);
        setTotal(data.total);
      }).catch(() => {});
    };
    window.addEventListener('flights:data-changed', onChanged as EventListener);
    return () => window.removeEventListener('flights:data-changed', onChanged as EventListener);
  }, [year, location]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  // Infinite scroll: load next page when near end
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!nextCursor) return;
      const threshold = el.scrollHeight - el.clientHeight - 400;
      if (el.scrollTop > threshold) {
        const c = nextCursor; // snapshot
        setNextCursor(null); // prevent duplicate loads
        fetchFlights({ year, location, cursor: c, limit: 100 }).then((data) => {
          setItems((prev) => [...prev, ...data.items]);
          setNextCursor(data.nextCursor);
          setTotal(data.total);
          try { window.dispatchEvent(new CustomEvent('flights:total', { detail: data.total })); } catch {}
        }).catch(() => {
          setNextCursor(c); // restore so we can retry
        });
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [nextCursor, year, location]);

  return (
    <div ref={parentRef} className="card rounded-xl" style={{ height: '70vh', overflow: 'auto' ,padding: '0.5rem 0'}}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative',}}>
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
              <Link href={`/flights/${f.id}`} className="block rounded" style={{ paddingTop: 0, paddingBottom: 0 }}>
                <FlightListItem
                  className="relative pl-4 pr-4 row-hover"
                  processed={displayProcessed}
                  filename={f.filename}
                  location={f.location}
                  dateIso={f.dateIso}
                  durationSeconds={f.durationSeconds}
                  distanceMeters={f.distanceMeters}
                  altitudeMaxMeters={f.altitudeMaxMeters}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}


