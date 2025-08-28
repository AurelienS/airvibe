'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';
import { FlightListItem } from "../home/sections/FlightListItem";
import IGCParser from "igc-parser";

type FlightRow = {
  id: string;
  createdAtIso: string;
  processed: boolean;
  filename: string;
  location: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  altitudeMaxMeters: number | null;
  rawIgc: string | null;
};

export function FlightsList({ flights }: { flights: Array<FlightRow> }) {
  const rows = useMemo(() => {
    return flights.map((f) => {
      let startAt: Date | null = null;
      if (f.processed && f.rawIgc) {
        try {
          const parsed = IGCParser.parse(f.rawIgc, { lenient: true });
          const points = parsed.fixes ?? [];
          if (points.length > 0) {
            const ts = (points[0] as any).timestamp;
            startAt = ts instanceof Date ? ts : new Date(ts);
          }
        } catch {
          startAt = null;
        }
      }
      const dateIso = (startAt ?? new Date(f.createdAtIso)).toISOString();
      return { f, dateIso };
    }).sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  }, [flights]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="border rounded-lg" style={{ height: '70vh', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((vi) => {
          const { f, dateIso } = rows[vi.index];
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
                processed={f.processed}
                filename={f.filename}
                location={f.location}
                dateIso={dateIso}
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


