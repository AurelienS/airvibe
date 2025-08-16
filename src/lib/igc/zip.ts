import JSZip from "jszip";
import type { IgcFile } from "@/types/igc";

export async function extractIgcFilesFromZip(buffer: Buffer): Promise<Array<IgcFile>> {
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files).filter((entry) => {
    if (entry.dir) return false;
    return entry.name.toLowerCase().endsWith(".igc");
  });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const content = await entry.async("string");
      return { name: entry.name.split("/").pop() || entry.name, content } as IgcFile;
    })
  );
  return files;
}


