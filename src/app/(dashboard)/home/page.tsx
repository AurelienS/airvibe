import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import UploadFlightsForm from "./UploadFlightsForm";
import { revalidatePath } from "next/cache";

export default async function HomePage() {
  const session = await auth();
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Airvibe</h1>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-sm px-3 py-2 bg-gray-100 rounded-md">
            Se déconnecter
          </button>
        </form>
      </div>
      <div className="mt-8 space-y-2">
        <p>Connecté en tant que: {session?.user?.email ?? "inconnu"}</p>
        <FlightsSection email={session?.user?.email} />
        <div className="rounded-lg border p-4">
          <UploadFlightsForm />
        </div>
      </div>
    </div>
  );
}

async function FlightsSection({ email }: { email: string | null | undefined }) {
  if (!email) return null;
  const flights = await prisma.flight.findMany({
    where: { user: { email } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, createdAt: true, processed: true, filename: true },
  });

  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Vos vols</h2>
        <form
          action={async () => {
            'use server';
            await prisma.flight.deleteMany({ where: { user: { email } } });
            revalidatePath('/home');
          }}
        >
          <button
            type="submit"
            className="text-xs px-3 py-2 bg-red-600 text-white rounded-md disabled:opacity-60"
            disabled={flights.length === 0}
          >
            Supprimer tous les vols
          </button>
        </form>
      </div>
      {flights.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun vol importé.</p>
      ) : (
        <ul className="divide-y">
          {flights.map((f) => (
            <li key={f.id} className="py-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{f.filename}</p>
                <p className="text-xs text-gray-500">Ajouté: {fmt.format(f.createdAt)}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md ${f.processed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                {f.processed ? "Traité" : "Non traité"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


