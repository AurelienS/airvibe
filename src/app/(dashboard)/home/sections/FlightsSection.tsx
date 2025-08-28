import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { backfillStartAtForUser, processUnprocessedFlightsForUser } from "@/services/flightProcessing";
import { FlightListItem } from "@/components/FlightListItem";
import IGCParser from "igc-parser";

type FlightsSectionProps = {
  email: string | null | undefined;
};

export async function FlightsSection({ email, limit = 50 }: FlightsSectionProps & { limit?: number }) {
  if (!email) return null;
  const flights = await prisma.flight.findMany({
    where: { user: { email } },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      createdAt: true,
      processed: true,
      filename: true,
      location: true,
      durationSeconds: true,
      distanceMeters: true,
      altitudeMaxMeters: true,
      rawIgc: true,
    },
  });

  const fmt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function deleteAllFlights() {
    'use server';
    await prisma.flight.deleteMany({ where: { user: { email } } });
    revalidatePath('/home');
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Vos vols</h2>
        <div className="flex items-center gap-2">
          <form action={deleteAllFlights}>
            <button
              type="submit"
              className="text-xs px-3 py-2 bg-red-600 text-white rounded-md disabled:opacity-60"
              disabled={flights.length === 0}
            >
              Supprimer tous les vols
            </button>
          </form>
        </div>
      </div>
      {flights.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun vol importé.</p>
      ) : (
        <ul className="divide-y">
          {(() => {
            const withDate = flights.map((f) => {
              let startAt: Date | null = null;
              if (f.processed && f.rawIgc) {
                try {
                  const parsed = IGCParser.parse(f.rawIgc, { lenient: true });
                  const points = parsed.fixes ?? [];
                  if (points.length > 0) {
                    const ts = (points[0] as any).timestamp;
                    startAt = ts instanceof Date ? ts : new Date(ts);
                  }
                } catch {
                  startAt = null;
                }
              }
              const date = startAt ?? f.createdAt;
              return { f, date };
            });
            withDate.sort((a, b) => b.date.getTime() - a.date.getTime());
            return withDate.map(({ f, date }) => (
              <a key={f.id} href={`/flights/${f.id}`} className="block hover:bg-gray-50 rounded">
                <FlightListItem
                  processed={f.processed}
                  filename={f.filename}
                  location={f.location}
                  dateIso={date.toISOString()}
                  durationSeconds={f.durationSeconds}
                  distanceMeters={f.distanceMeters}
                  altitudeMaxMeters={f.altitudeMaxMeters}
                />
              </a>
            ));
          })()}
        </ul>
      )}
    </div>
  );
}


