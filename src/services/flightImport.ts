import crypto from "node:crypto";
import IGCParser from "igc-parser";
import { prisma } from "@/lib/db";

type ValidFlight = { name: string; content: string; contentHash: string };

export function validateAndHash(files: Array<{ name: string; content: string }>): Array<ValidFlight> {
  const result: Array<ValidFlight> = [];
  for (const f of files) {
    try {
      IGCParser.parse(f.content, { lenient: true });
    } catch {
      continue;
    }
    const contentHash = crypto.createHash("sha256").update(f.content).digest("hex");
    result.push({ name: f.name, content: f.content, contentHash });
  }
  return result;
}

export async function persistFlightsForUser(userId: string, validWithHash: Array<ValidFlight>): Promise<{ createdCount: number; skippedDuplicates: number }> {
  if (validWithHash.length === 0) return { createdCount: 0, skippedDuplicates: 0 };

  const uniqueHashes = Array.from(new Set(validWithHash.map((f) => f.contentHash)));
  const existing = uniqueHashes.length
    ? await prisma.flight.findMany({
        where: { userId, contentHash: { in: uniqueHashes } },
        select: { contentHash: true },
      })
    : [];
  const existingSet = new Set(
    existing.map((e) => e.contentHash).filter(Boolean) as Array<string>
  );
  const toInsert = validWithHash.filter((f) => !existingSet.has(f.contentHash));

  let createdCount = 0;
  if (toInsert.length > 0) {
    const createManyResult = await prisma.flight.createMany({
      data: toInsert.map((f) => ({
        userId,
        filename: f.name,
        rawIgc: f.content,
        contentHash: f.contentHash,
        processed: false,
      })),
    });
    createdCount = createManyResult.count;
  }
  const skippedDuplicates = validWithHash.length - createdCount;
  return { createdCount, skippedDuplicates };
}


