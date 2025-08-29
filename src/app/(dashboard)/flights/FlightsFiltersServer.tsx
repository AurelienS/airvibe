import { FlightsFilters } from './FlightsFilters';
import { getCurrentUserOrThrow } from '@/lib/users';
import { listLocationsForUser } from '@/services/flights';

export default async function FlightsFiltersServer({ year }: { year?: string }) {
  const user = await getCurrentUserOrThrow();
  const locations = await listLocationsForUser(user.id, { year });
  return <FlightsFilters locations={locations} />;
}


