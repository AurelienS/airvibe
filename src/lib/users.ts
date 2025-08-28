import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export async function getCurrentUserOrThrow(): Promise<{ id: string; email: string }>{
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) notFound();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) notFound();
  return { id: user.id, email };
}


