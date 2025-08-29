import { FlightsList } from './FlightsList';
import { getCurrentUserOrThrow } from '@/lib/users';
import { listFlightsForUser } from '@/services/flights';

export default async function FlightsListServer({ year, location }: { year?: string; location?: string }) {
  const user = await getCurrentUserOrThrow();
  const { items: rows } = await listFlightsForUser(user.id, { year, location, limit: 100 }).catch(() => ({ items: [] } as any));

  return <FlightsList flights={rows} />;
}


