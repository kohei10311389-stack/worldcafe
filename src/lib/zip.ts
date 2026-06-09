import JSZip from "jszip";
import type { Photo } from "./db";
import { assignPhotoNumbers, imageFileName } from "./tables";
import { fileStamp } from "./datetime";
import { saveBlob } from "./download";

export interface ZipEntry { path: string; blob: Blob; }

export function buildZipEntries(photos: Photo[]): ZipEntry[] {
  const byTable = new Map<string, Photo[]>();
  for (const p of photos) {
    (byTable.get(p.table) ?? byTable.set(p.table, []).get(p.table)!).push(p);
  }
  const entries: ZipEntry[] = [];
  for (const table of [...byTable.keys()].sort()) {
    for (const p of assignPhotoNumbers(byTable.get(table)!)) {
      entries.push({ path: `${table}/${imageFileName(table, p.no)}`, blob: p.blob });
    }
  }
  return entries;
}

export async function exportZip(photos: Photo[]): Promise<void> {
  const zip = new JSZip();
  for (const e of buildZipEntries(photos)) zip.file(e.path, e.blob);
  const out = await zip.generateAsync({ type: "blob" });
  saveBlob(out, `worldcafe-images-${fileStamp()}.zip`);
}
