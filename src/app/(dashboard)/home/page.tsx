import { auth, signOut } from "@/auth";
import { FlightsSection } from "./sections/FlightsSection";
import UploadFlightsForm from "./UploadFlightsForm";

export default async function HomePage() {
  const session = await auth();
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Airvibe</h1>
        <form action={async () => {
          'use server';
          await signOut({ redirectTo: "/" });
        }}>
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

