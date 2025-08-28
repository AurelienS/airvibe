import { auth, signOut } from "@/auth";
import { FlightsSection } from "./sections/FlightsSection";
import UploadFlightsForm from "./UploadFlightsForm";
import { prisma } from "@/lib/db";
import { getUserFlightStats } from "@/services/flightStats";
import { HomeStats } from "./sections/HomeStats";

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null;
  const stats = user ? await getUserFlightStats(user.id) : null;
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Airvibe</h1>
      </div>
      <div className="mt-8 space-y-2">

        <div className="rounded-lg border p-4">
          <UploadFlightsForm />
        </div>
        <HomeStats stats={stats} />
        <FlightsSection email={session?.user?.email} limit={10} />
      </div>
    </div>
  );
}

