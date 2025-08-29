import { FlightStats } from "@/services/flightStats";
import { StatList } from "@/components/StatList";

export function HomeStats({ stats }: { stats: { allTime: FlightStats; currentYear: FlightStats } | null }) {
  if (!stats) return null;
  const { allTime, currentYear } = stats;
  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`;
  };
  return (
    <div className="card p-4 rounded-xl">
      <h2 className="text-lg font-semibold mb-3">Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="chip mb-2">Cette année</h3>
          <StatList
            items={[
              { label: 'Total vols', value: currentYear.totalFlights, kind: 'number' },
              { label: 'Temps de vol', value: currentYear.totalFlightTimeSeconds, kind: 'duration' },
              { label: 'Distance max', value: currentYear.maxDistanceMeters, kind: 'distance' },
              { label: 'Durée max', value: currentYear.maxDurationSeconds, kind: 'duration' },
              { label: 'Altitude max', value: currentYear.altitudeMaxMeters, kind: 'altitude' },
            ]}
          />
        </div>
        <div>
          <h3 className="chip mb-2">Depuis le début</h3>
          <StatList
            items={[
              { label: 'Total vols', value: allTime.totalFlights, kind: 'number' },
              { label: 'Temps de vol', value: allTime.totalFlightTimeSeconds, kind: 'duration' },
              { label: 'Distance max', value: allTime.maxDistanceMeters, kind: 'distance' },
              { label: 'Durée max', value: allTime.maxDurationSeconds, kind: 'duration' },
              { label: 'Altitude max', value: allTime.altitudeMaxMeters, kind: 'altitude' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}


