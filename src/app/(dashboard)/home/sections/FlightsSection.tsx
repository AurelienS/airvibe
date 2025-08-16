import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { processUnprocessedFlightsForUser } from "@/services/flightProcessing";
import { formatAltitude, formatDistance, formatDuration } from "@/lib/format";

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
            <li key={f.id} className="py-2 flex items-center justify-between">
              <div className="min-w-0">
                {f.processed ? (
                  <>
                    <p className="text-sm font-medium truncate">
                      {f.location ?? 'Lieu inconnu'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fmt.format(f.createdAt)} • {formatDuration(f.durationSeconds)} • {formatDistance(f.distanceMeters)} • {formatAltitude(f.altitudeMaxMeters)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium truncate">{f.filename}</p>
                    <p className="text-xs text-gray-500">{fmt.format(f.createdAt)}</p>
                  </>
                )}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-md ${
                  f.processed
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {f.processed ? "Traité" : "Non traité"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


