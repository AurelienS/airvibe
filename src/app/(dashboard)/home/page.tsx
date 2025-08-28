import { auth, signOut } from "@/auth";
import { FlightsSection } from "./sections/FlightsSection";
import UploadFlightsForm from "./UploadFlightsForm";
import { getUserFlightStats } from "@/services/flightStats";
import { HomeStats } from "./sections/HomeStats";
import { getCurrentUserOrThrow } from "@/lib/users";

export default async function HomePage() {
  const user = await getCurrentUserOrThrow();
  const stats = await getUserFlightStats(user.id);
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
        <FlightsSection email={user.email} limit={10} />
      </div>
    </div>
  );
}

