import { auth } from "@/auth";
import { notFound } from "next/navigation";

export async function requireUser(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) notFound();
  return { id: "", email };
}


