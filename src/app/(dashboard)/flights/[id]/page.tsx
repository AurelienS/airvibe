import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import IGCParser from "igc-parser";
import { FlightMap } from "@/components/FlightMap";

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
      <div className="flex items-center justify-end">
        <a
          href={`/api/flights/${flight.id}/download`}
          className="text-sm px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
        >
          Télécharger IGC
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-2">Résumé</h2>
            <div className="text-sm text-gray-800 space-y-1">
              <p><span className="text-gray-500">Lieu:</span> {flight.location ?? 'Lieu inconnu'}</p>
              <p><span className="text-gray-500">Date:</span> {dateStr}</p>
              <p><span className="text-gray-500">Durée:</span> {formatDuration(flight.durationSeconds)}</p>
              <p><span className="text-gray-500">Distance:</span> {formatDistance(flight.distanceMeters)}</p>
              <p><span className="text-gray-500">Altitude max:</span> {formatAltitude(flight.altitudeMaxMeters)}</p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="text-lg font-medium mb-2">Carte</h2>
            {path.length > 1 ? (
              <FlightMap points={path} />
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-gray-500">Pas de trace disponible</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-2">Fichier</h3>
            <p className="text-sm break-words">{flight.filename}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-2">Détails techniques</h3>
            <ul className="text-sm text-gray-800 space-y-1">
              <li><span className="text-gray-500">Points GPS:</span> {fixesCount}</li>
              <li><span className="text-gray-500">Décollage:</span> {takeoff ? `${takeoff.lat.toFixed(5)}, ${takeoff.lon.toFixed(5)}` : '—'}</li>
              <li><span className="text-gray-500">Atterrissage:</span> {landing ? `${landing.lat.toFixed(5)}, ${landing.lon.toFixed(5)}` : '—'}</li>
              <li><span className="text-gray-500">Début:</span> {flight.startAt ? new Date(flight.startAt).toLocaleString('fr-FR') : '—'}</li>
              <li><span className="text-gray-500">Fin:</span> {flight.endAt ? new Date(flight.endAt).toLocaleString('fr-FR') : '—'}</li>
            </ul>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-2">Métadonnées</h3>
            <ul className="text-sm text-gray-800 space-y-1">
              <li><span className="text-gray-500">Pilote:</span> {toText(meta.pilot)}</li>
              <li><span className="text-gray-500">Aile:</span> {toText(meta.glider)}</li>
              <li><span className="text-gray-500">Fabricant:</span> {toText(meta.manufacturer)}</li>
              <li><span className="text-gray-500">Compétition ID:</span> {toText(meta.competitionId)}</li>
              <li><span className="text-gray-500">Site (IGC):</span> {toText((meta as any).site)}</li>
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


