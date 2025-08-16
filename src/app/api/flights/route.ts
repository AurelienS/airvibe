import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getIgcFilesFromFormData } from "@/lib/igc/form";
import { validateAndHash, persistFlightsForUser } from "@/services/flightImport";

export const runtime = "nodejs";

// helpers moved to lib/services

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const igcFiles = await getIgcFilesFromFormData(formData);

  if (igcFiles.length === 0) {
    return NextResponse.json({ error: "No IGC files found" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const validWithHash = validateAndHash(igcFiles);

  if (validWithHash.length === 0) {
    return NextResponse.json({ error: "No valid IGC files" }, { status: 400 });
  }

  const { createdCount, skippedDuplicates } = await persistFlightsForUser(user.id, validWithHash);

  return NextResponse.json({ createdCount, skippedDuplicates }, { status: 201 });
}


