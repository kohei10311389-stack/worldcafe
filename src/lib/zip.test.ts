import { describe, it, expect } from "vitest";
import { buildZipEntries } from "./zip";
import type { Photo } from "./db";

function photo(p: Partial<Photo>): Photo {
  return { id: "x", table: "A", blob: new Blob(["x"]), mime: "image/jpeg",
    createdAt: 0, memo: "", ...p } as Photo;
}

describe("buildZipEntries", () => {
  it("テーブル別フォルダ + 採番ファイル名でパスを作る", () => {
    const entries = buildZipEntries([
      photo({ id: "b", table: "A", createdAt: 200 }),
      photo({ id: "a", table: "A", createdAt: 100 }),
      photo({ id: "c", table: "B", createdAt: 50 })
    ]);
    expect(entries.map((e) => e.path)).toEqual([
      "A/A-001.jpg", "A/A-002.jpg", "B/B-001.jpg"
    ]);
    expect(entries[0].blob).toBeInstanceOf(Blob);
  });
});
