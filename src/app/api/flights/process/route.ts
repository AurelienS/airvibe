import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { processUnprocessedFlightsForUser } from "@/services/flightProcessing";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const processed = await processUnprocessedFlightsForUser(user.id, 50);
  return NextResponse.json({ processed });
}


