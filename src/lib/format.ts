const numberFr = new Intl.NumberFormat("fr-FR");

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m.toString().padStart(2, "0")} min`;
  return `${m} min`;
}

export function formatDistance(meters: number | null | undefined): string {
  if (!meters || meters <= 0) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${numberFr.format(Math.round(meters))} m`;
}

export function formatAltitude(meters: number | null | undefined): string {
  if (!meters || meters <= 0) return "—";
  return `${numberFr.format(Math.round(meters))} m`;
}


