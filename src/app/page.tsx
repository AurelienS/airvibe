import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Airvibe</h1>
        <p className="text-gray-600">Parapente logbook</p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-md bg-black text-white hover:opacity-90"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
