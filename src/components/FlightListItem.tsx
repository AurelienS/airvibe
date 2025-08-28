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

export function FlightListItem({ processed, filename, location, dateIso, durationSeconds, distanceMeters, altitudeMaxMeters }: Props & { id?: string }) {
  const dateStr = new Date(dateIso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <li className="py-2 flex items-center justify-between">
      <div className="min-w-0">
        {processed ? (
          <>
            <p className="text-sm font-medium truncate">{location ?? 'Lieu inconnu'}</p>
            <p className="text-xs text-gray-500">
              {dateStr} • {formatDuration(durationSeconds)} • {formatDistance(distanceMeters)} • {formatAltitude(altitudeMaxMeters)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium truncate">{filename}</p>
            <p className="text-xs text-gray-500">{dateStr}</p>
          </>
        )}
      </div>
      {!processed ? (
        <span className="text-xs px-2 py-1 rounded-md bg-orange-100 text-orange-800">
          Non traité
        </span>
      ) : null}
    </li>
  );
}


