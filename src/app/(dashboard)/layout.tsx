import { auth, signOut } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProcessingNotice } from "@/components/ProcessingNotice";
import { NavLinks } from "@/components/NavLinks";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";

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
          <NavLinks />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{session.user?.email ?? 'inconnu'}</span>
          <form action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}>
            <button className="text-xs px-3 py-2 bg-gray-100 rounded-md">Se déconnecter</button>
          </form>
        </div>
      </nav>
      <ProcessingNotice />
      <CurrentUserProvider value={{ id: null, email: session.user?.email ?? null }}>
        <main>{children}</main>
      </CurrentUserProvider>
    </div>
  );
}


