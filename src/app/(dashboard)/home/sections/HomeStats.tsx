import { FlightStats } from "@/services/flightStats";

export function HomeStats({ stats }: { stats: { allTime: FlightStats; currentYear: FlightStats } | null }) {
  if (!stats) return null;
  const { allTime, currentYear } = stats;
  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`;
  };
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-medium mb-3">Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Cette année</h3>
          <ul className="text-sm space-y-1">
            <li>Total vols: {currentYear.totalFlights}</li>
            <li>Temps de vol: {fmtTime(currentYear.totalFlightTimeSeconds)}</li>
            <li>Distance max: {currentYear.maxDistanceMeters ? `${(currentYear.maxDistanceMeters/1000).toFixed(1)} km` : '—'}</li>
            <li>Durée max: {currentYear.maxDurationSeconds ? fmtTime(currentYear.maxDurationSeconds) : '—'}</li>
            <li>Altitude max: {currentYear.altitudeMaxMeters ? `${Math.round(currentYear.altitudeMaxMeters)} m` : '—'}</li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2">Depuis le début</h3>
          <ul className="text-sm space-y-1">
            <li>Total vols: {allTime.totalFlights}</li>
            <li>Temps de vol: {fmtTime(allTime.totalFlightTimeSeconds)}</li>
            <li>Distance max: {allTime.maxDistanceMeters ? `${(allTime.maxDistanceMeters/1000).toFixed(1)} km` : '—'}</li>
            <li>Durée max: {allTime.maxDurationSeconds ? fmtTime(allTime.maxDurationSeconds) : '—'}</li>
            <li>Altitude max: {allTime.altitudeMaxMeters ? `${Math.round(allTime.altitudeMaxMeters)} m` : '—'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


