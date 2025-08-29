import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ProcessingNotice } from "@/components/ProcessingNotice";
import { NavLinks } from "@/components/NavLinks";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div className="min-h-svh">
      <Navbar
        left={<NavLinks />}
        right={
          <div className="navbar__section">
            <span className="text-sm text-[--color-muted-foreground]">{session.user?.email ?? 'inconnu'}</span>
            <form action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}>
              <Button variant="ghost" className="text-xs">Se déconnecter</Button>
            </form>
          </div>
        }
      />
      <ProcessingNotice />
      <CurrentUserProvider value={{ id: null, email: session.user?.email ?? null }}>
        <main className="container py-6">{children}</main>
      </CurrentUserProvider>
    </div>
  );
}


