'use client';

import { formatAltitude, formatDistance, formatDuration } from "@/lib/format";
import Link from "next/link";

type Props = {
  processed: boolean;
  filename: string;
  location: string | null;
  dateIso: string; // ISO string for correct client TZ formatting
  durationSeconds: number | null;
  distanceMeters: number | null;
  altitudeMaxMeters: number | null;
};

import React from 'react';

function FlightListItemBase({ processed, filename, location, dateIso, durationSeconds, distanceMeters, altitudeMaxMeters, className = "" }: Props & { id?: string; className?: string }) {
  const dateStr = new Date(dateIso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <li className={`py-3 px-4 flex items-center justify-between ${className}`}>
      <div className="min-w-0">
        {processed ? (
          <>
            <p className="text-sm font-medium truncate">{location ?? 'Lieu inconnu'}</p>
            <p className="text-xs text-[--color-muted-foreground]">
              {dateStr} • {formatDuration(durationSeconds)} • {formatDistance(distanceMeters)} • {formatAltitude(altitudeMaxMeters)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium truncate">{filename}</p>
            <p className="text-xs text-[--color-muted-foreground]">{dateStr}</p>
          </>
        )}
      </div>
      {!processed ? (
        <span className="text-xs px-2 py-1 rounded-md chip" style={{ background: 'color-mix(in oklab, var(--accent) 14%, transparent)', color: 'var(--accent-foreground)' }}>
          Non traité
        </span>
      ) : null}
    </li>
  );
}

export const FlightListItem = React.memo(FlightListItemBase);


