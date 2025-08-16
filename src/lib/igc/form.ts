import type { IgcFile } from "@/types/igc";
import { extractIgcFilesFromZip } from "./zip";

export async function getIgcFilesFromFormData(formData: FormData): Promise<Array<IgcFile>> {
  const items = formData.getAll("files");
  const tasks = items.map(async (item) => {
    if (!(item instanceof File)) return [] as Array<IgcFile>;
    const name = item.name;
    const arrayBuffer = await item.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const lower = name.toLowerCase();
    if (lower.endsWith(".zip")) {
      return await extractIgcFilesFromZip(buffer);
    }
    if (lower.endsWith(".igc")) {
      return [{ name, content: buffer.toString("utf8") }];
    }
    return [] as Array<IgcFile>;
  });
  const nested = await Promise.all(tasks);
  return nested.flat();
}


