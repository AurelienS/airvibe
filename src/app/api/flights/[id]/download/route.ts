import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const flight = await prisma.flight.findFirst({
    where: { id: params.id, user: { email: session.user.email } },
    select: { filename: true, rawIgc: true },
  });
  if (!flight) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const filename = flight.filename?.endsWith(".igc") ? flight.filename : `${flight.filename || "flight"}.igc`;

  return new Response(flight.rawIgc, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, '')}"`,
      "Cache-Control": "no-store",
    },
  });
}


