'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FlightListItem } from '@/components/FlightListItem';

type Row = {
  id: string;
  dateIso: string;
  processed: boolean;
  filename: string;
  location: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  altitudeMaxMeters: number | null;
};

export function FlightsSectionClient({ initial, email }: { initial: Row[]; email: string | null }) {
  const [rows, setRows] = useState<Row[]>(initial);
  useEffect(() => {
    const handler = () => {
      fetch(`/api/flights/list?limit=10`).then(r => r.json()).then(json => {
        const items = Array.isArray(json.items) ? json.items : [];
        setRows(items);
      }).catch(() => {});
    };
    window.addEventListener('flights:data-changed', handler);
    return () => window.removeEventListener('flights:data-changed', handler);
  }, []);

  if (!email) return null;
  if (!rows.length) return <p className="text-sm text-[--color-muted-foreground]">Aucun vol importé.</p>;
  return (
    <ul>
      {rows.map((f) => (
        <Link key={f.id} href={`/flights/${f.id}`} className="block rounded">
          <FlightListItem
            className="relative pl-4 pr-4 row-hover"
            processed={f.processed}
            filename={f.filename}
            location={f.location}
            dateIso={f.dateIso}
            durationSeconds={f.durationSeconds}
            distanceMeters={f.distanceMeters}
            altitudeMaxMeters={f.altitudeMaxMeters}
          />
        </Link>
      ))}
    </ul>
  );
}


