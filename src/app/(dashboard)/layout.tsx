import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div className="min-h-svh">
      <nav className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/home" className="font-semibold">Airvibe</Link>
          <div className="text-sm text-gray-700 flex items-center gap-4">
            <Link href="/home">Accueil</Link>
            <Link href="/flights">Vols</Link>
            <Link href="/stats">Stats</Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}


