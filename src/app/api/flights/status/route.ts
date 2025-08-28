import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [total, unprocessed] = await Promise.all([
    prisma.flight.count({ where: { userId: user.id } }),
    prisma.flight.count({ where: { userId: user.id, processed: false } }),
  ]);

  return NextResponse.json({ total, unprocessed });
}


