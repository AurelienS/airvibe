import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import JSZip from "jszip";
import IGCParser from "igc-parser";

export const runtime = "nodejs";

async function extractIgcFilesFromZip(buffer: Buffer): Promise<Array<{ name: string; content: string }>> {
  const zip = await JSZip.loadAsync(buffer);
  const files: Array<{ name: string; content: string }> = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const lower = entry.name.toLowerCase();
    if (!lower.endsWith(".igc")) continue;
    const content = await entry.async("string");
    files.push({ name: entry.name.split("/").pop() || entry.name, content });
  }
  return files;
}

async function getIgcFilesFromFormData(formData: FormData): Promise<Array<{ name: string; content: string }>> {
  const filesField = formData.getAll("files");
  const igcFiles: Array<{ name: string; content: string }> = [];

  for (const item of filesField) {
    if (!(item instanceof File)) continue;
    const name = item.name;
    const arrayBuffer = await item.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const lower = name.toLowerCase();
    if (lower.endsWith(".zip")) {
      const fromZip = await extractIgcFilesFromZip(buffer);
      igcFiles.push(...fromZip);
    } else if (lower.endsWith(".igc")) {
      igcFiles.push({ name, content: buffer.toString("utf8") });
    }
  }

  return igcFiles;
}

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

  const created: Array<{ id: string; filename: string }> = [];
  for (const file of igcFiles) {
    try {
      // Validate file parses as IGC before storing
      IGCParser.parse(file.content, { lenient: true });
    } catch {
      continue;
    }

    const flight = await prisma.flight.create({
      data: {
        userId: user.id,
        filename: file.name,
        rawIgc: file.content,
        processed: false,
      },
      select: { id: true, filename: true },
    });
    created.push(flight);
  }

  if (created.length === 0) {
    return NextResponse.json({ error: "No valid IGC files" }, { status: 400 });
  }

  return NextResponse.json({ flights: created }, { status: 201 });
}


