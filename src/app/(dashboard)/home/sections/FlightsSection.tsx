import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { processUnprocessedFlightsForUser } from "@/services/flightProcessing";
import { FlightListItem } from "./FlightListItem";

type FlightsSectionProps = {
  email: string | null | undefined;
};

export async function FlightsSection({ email }: FlightsSectionProps) {
  if (!email) return null;
  const flights = await prisma.flight.findMany({
    where: { user: { email } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      processed: true,
      filename: true,
      location: true,
      durationSeconds: true,
      distanceMeters: true,
      altitudeMaxMeters: true,
      startAt: true,
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
          <form action={async () => {
            'use server';
            const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
            if (user) {
              await processUnprocessedFlightsForUser(user.id, 50);
            }
            revalidatePath('/home');
          }}>
            <button
              type="submit"
              className="text-xs px-3 py-2 bg-green-600 text-white rounded-md disabled:opacity-60"
              disabled={flights.length === 0}
            >
              Traiter les vols
            </button>
          </form>
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
          {flights.map((f) => (
            <FlightListItem
              key={f.id}
              processed={f.processed}
              filename={f.filename}
              location={f.location}
              dateIso={(f.processed ? (f.startAt ?? f.createdAt) : f.createdAt).toISOString()}
              durationSeconds={f.durationSeconds}
              distanceMeters={f.distanceMeters}
              altitudeMaxMeters={f.altitudeMaxMeters}
            />
          ))}
        </ul>
      )}
    </div>
  );
}


