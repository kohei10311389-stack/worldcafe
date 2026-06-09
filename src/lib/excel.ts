import * as XLSX from "xlsx";
import type { Photo } from "./db";
import { assignPhotoNumbers, imageFileName } from "./tables";
import { formatDateTime, fileStamp } from "./datetime";
import { saveBlob } from "./download";

const HEADER = ["テーブル名", "写真No", "画像名", "撮影日時", "メモ"];

export function buildExcelRows(photos: Photo[]): (string | number)[][] {
  const byTable = new Map<string, Photo[]>();
  for (const p of photos) {
    (byTable.get(p.table) ?? byTable.set(p.table, []).get(p.table)!).push(p);
  }
  const rows: (string | number)[][] = [HEADER];
  for (const table of [...byTable.keys()].sort()) {
    for (const p of assignPhotoNumbers(byTable.get(table)!)) {
      rows.push([
        p.table, p.no, imageFileName(p.table, p.no),
        formatDateTime(p.createdAt), p.memo
      ]);
    }
  }
  return rows;
}

export function exportExcel(photos: Photo[]): void {
  const ws = XLSX.utils.aoa_to_sheet(buildExcelRows(photos));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "photos");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveBlob(
    new Blob([out], { type: "application/octet-stream" }),
    `worldcafe-${fileStamp()}.xlsx`
  );
}
