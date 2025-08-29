import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { broadcast } from "@/lib/sse";
import Link from "next/link";
import { backfillStartAtForUser, processUnprocessedFlightsForUser } from "@/services/flightProcessing";
import { FlightListItem } from "@/components/FlightListItem";
import { FlightsSectionClient } from './FlightsSectionClient';
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
      startAt: true,
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
    const uid = await prisma.user.findFirst({ where: { email: email ?? undefined }, select: { id: true } });
    if (uid?.id) broadcast({ type: 'flights:deleted_all', userId: uid.id });
    revalidatePath('/home');
  }

  return (
    <div className="card p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Vos derniers vols</h2>
        <div className="flex items-center gap-2">
          <form action={deleteAllFlights}>
            <button
              type="submit"
              className="text-xs px-3 py-2 rounded-md btn btn--primary disabled:opacity-60"
              disabled={flights.length === 0}
            >
              Supprimer tous les vols
            </button>
          </form>
        </div>
      </div>
      <FlightsSectionClient initial={flights.map(f => {
        let date: Date = f.startAt ?? f.createdAt;
        if (!f.startAt && f.processed && f.rawIgc) {
          try {
            const parsed = IGCParser.parse(f.rawIgc, { lenient: true });
            const points = (parsed as any).fixes ?? [];
            if (points.length > 0) {
              const ts = points[0]?.timestamp;
              const d = ts instanceof Date ? ts : new Date(ts);
              if (!Number.isNaN(d.getTime())) date = d;
            }
          } catch {}
        }
        return {
          id: f.id,
          dateIso: date.toISOString(),
          processed: f.processed,
          filename: f.filename,
          location: f.location,
          durationSeconds: f.durationSeconds,
          distanceMeters: f.distanceMeters,
          altitudeMaxMeters: f.altitudeMaxMeters,
        };
      })} email={email}
      />
    </div>
  );
}


