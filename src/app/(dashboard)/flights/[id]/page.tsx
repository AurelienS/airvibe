import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import IGCParser from "igc-parser";
import { FlightMap } from "@/components/FlightMap";
import { Button } from "@/components/ui/Button";

export default async function FlightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) return notFound();

  const p = await params;

  const flight = await prisma.flight.findFirst({
    where: { id: p.id, user: { email } },
    select: {
      id: true,
      filename: true,
      createdAt: true,
      startAt: true,
      endAt: true,
      processed: true,
      location: true,
      durationSeconds: true,
      distanceMeters: true,
      altitudeMaxMeters: true,
      faiDistanceMeters: true,
      rawIgc: true,
    },
  });
  if (!flight) return notFound();

  // Parse additional metadata from IGC
  let meta: Record<string, unknown> = {};
  let fixesCount = 0;
  let takeoff: { lat: number; lon: number } | null = null;
  let landing: { lat: number; lon: number } | null = null;
  let path: Array<{ lat: number; lon: number }> = [];
  try {
    const parsed = IGCParser.parse(flight.rawIgc, { lenient: true });
    const { headers, pilot, gliderType, site, fixes } = parsed as any;
    fixesCount = Array.isArray(fixes) ? fixes.length : 0;
    if (fixesCount > 0) {
      const first = fixes[0];
      const last = fixes[fixes.length - 1];
      takeoff = { lat: first.latitude, lon: first.longitude };
      landing = { lat: last.latitude, lon: last.longitude };
      path = fixes.map((f: any) => ({ lat: f.latitude, lon: f.longitude }));
    }
    meta = {
      pilot: pilot ?? headers?.HFPLTPILOT ?? null,
      glider: gliderType ?? headers?.HFGTYGLIDERTYPE ?? null,
      site: site ?? headers?.HFFTY?.site ?? flight.location ?? null,
      manufacturer: headers?.HFGIDGLIDERID ?? null,
      competitionId: headers?.HFCIDCOMPETITIONID ?? null,
      recorder: headers?.HFDTE?.date ?? headers?.HFFXA ?? null,
    };
  } catch {}

  const dateStr = new Date((flight.startAt ?? flight.createdAt)).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Résumé</h2>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="text-[--color-muted-foreground]">Lieu:</span> {flight.location ?? 'Lieu inconnu'}</p>
              <p><span className="text-[--color-muted-foreground]">Date:</span> {dateStr}</p>
              <p><span className="text-[--color-muted-foreground]">Durée:</span> {formatDuration(flight.durationSeconds)}</p>
              <p><span className="text-[--color-muted-foreground]">Distance:</span> {formatDistance(flight.distanceMeters)}</p>
              <p><span className="text-[--color-muted-foreground]">Altitude max:</span> {formatAltitude(flight.altitudeMaxMeters)}</p>
            </div>
          </div>

          <div className="card p-4 rounded-xl">
            <h2 className="text-lg font-semibold mb-2">Carte</h2>
            {path.length > 1 ? (
              <FlightMap points={path} />
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-[--color-muted-foreground]">Pas de trace disponible</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Fichier</h3>
              <a href={`/api/flights/${flight.id}/download`} className="btn btn--ghost text-xs">Télécharger</a>
            </div>
            <p className="text-sm break-words">{flight.filename}</p>
          </div>
          <div className="card p-4 rounded-xl">
            <h3 className="text-sm font-semibold mb-2">Détails techniques</h3>
            <ul className="text-sm space-y-1">
              <li><span className="text-[--color-muted-foreground]">Points GPS:</span> {fixesCount}</li>
              <li><span className="text-[--color-muted-foreground]">Décollage:</span> {takeoff ? `${takeoff.lat.toFixed(5)}, ${takeoff.lon.toFixed(5)}` : '—'}</li>
              <li><span className="text-[--color-muted-foreground]">Atterrissage:</span> {landing ? `${landing.lat.toFixed(5)}, ${landing.lon.toFixed(5)}` : '—'}</li>
              <li><span className="text-[--color-muted-foreground]">Début:</span> {flight.startAt ? new Date(flight.startAt).toLocaleString('fr-FR') : '—'}</li>
              <li><span className="text-[--color-muted-foreground]">Fin:</span> {flight.endAt ? new Date(flight.endAt).toLocaleString('fr-FR') : '—'}</li>
            </ul>
          </div>
          <div className="card p-4 rounded-xl">
            <h3 className="text-sm font-semibold mb-2">Métadonnées</h3>
            <ul className="text-sm space-y-1">
              <li><span className="text-[--color-muted-foreground]">Pilote:</span> {toText(meta.pilot)}</li>
              <li><span className="text-[--color-muted-foreground]">Aile:</span> {toText(meta.glider)}</li>
              <li><span className="text-[--color-muted-foreground]">Fabricant:</span> {toText(meta.manufacturer)}</li>
              <li><span className="text-[--color-muted-foreground]">Compétition ID:</span> {toText(meta.competitionId)}</li>
              <li><span className="text-[--color-muted-foreground]">Site (IGC):</span> {toText((meta as any).site)}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function toText(value: unknown): string {
  if (value == null) return '—';
  const s = String(value).trim();
  return s.length ? s : '—';
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m.toString().padStart(2, "0")} min`;
  return `${m} min`;
}

function formatDistance(meters: number | null): string {
  if (!meters || meters <= 0) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatAltitude(meters: number | null): string {
  if (!meters || meters <= 0) return "—";
  return `${Math.round(meters)} m`;
}


