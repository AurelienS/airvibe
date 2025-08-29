import { auth, signOut } from "@/auth";
import { FlightsSection } from "./sections/FlightsSection";
import UploadFlightsForm from "./UploadFlightsForm";
import { getUserFlightStats } from "@/services/flightStats";
import { HomeStats } from "./sections/HomeStats";
import { getCurrentUserOrThrow } from "@/lib/users";

export default async function HomePage() {
  const user = await getCurrentUserOrThrow();
  const statsPromise = getUserFlightStats(user.id);
  return (
    <div className="p-6">
      <div className="space-y-4">
        <div className="card p-4 rounded-xl">
          <UploadFlightsForm />
        </div>
        {/* Render quickly, stats load asynchronously */}
        <HomeStats stats={await statsPromise} />
        <FlightsSection email={user.email} limit={10} />
      </div>
    </div>
  );
}

