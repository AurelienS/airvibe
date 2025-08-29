import { headers } from 'next/headers';
import { FlightsList } from './FlightsList';

export default async function FlightsListServer({ year, location }: { year?: string; location?: string }) {
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const base = host ? `${proto}://${host}` : '';

  const sp = new URLSearchParams();
  if (year) sp.set('year', year);
  if (location) sp.set('location', location);
  sp.set('limit', '100');

  const res = await fetch(`${base}/api/flights/list?${sp.toString()}`, { cache: 'no-store' });
  const json = await res.json().catch(() => ({ items: [] }));
  const rows = (Array.isArray(json.items) ? json.items : []) as any[];

  return <FlightsList flights={rows} />;
}


