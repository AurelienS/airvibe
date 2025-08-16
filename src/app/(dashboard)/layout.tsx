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
        <Link href="/home" className="font-semibold">
          Airvibe
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}


