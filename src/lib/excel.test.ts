import { describe, it, expect } from "vitest";
import { buildExcelRows } from "./excel";
import type { Photo } from "./db";

function photo(p: Partial<Photo>): Photo {
  return { id: "x", table: "A", blob: new Blob(), mime: "image/jpeg",
    createdAt: Date.UTC(2026, 5, 11, 5, 32), memo: "", ...p } as Photo;
}

describe("buildExcelRows", () => {
  it("ヘッダ + テーブル/写真No順の行を返す", () => {
    const rows = buildExcelRows([
      photo({ id: "b", table: "A", createdAt: 200, memo: "二番" }),
      photo({ id: "a", table: "A", createdAt: 100, memo: "一番" }),
      photo({ id: "c", table: "B", createdAt: 50, memo: "別表" })
    ]);
    expect(rows[0]).toEqual(["テーブル名", "写真No", "画像名", "撮影日時", "メモ"]);
    // A-1(一番), A-2(二番), B-1(別表)
    expect(rows[1].slice(0, 3)).toEqual(["A", 1, "A-001.jpg"]);
    expect(rows[1][4]).toBe("一番");
    expect(rows[2].slice(0, 3)).toEqual(["A", 2, "A-002.jpg"]);
    expect(rows[3].slice(0, 3)).toEqual(["B", 1, "B-001.jpg"]);
  });
});
