import { describe, it, expect, beforeEach } from "vitest";
import { addPhoto, getPhotosByTable, getAllPhotos, updateMemo, deletePhoto, clearAll } from "./db";

const blob = () => new Blob(["x"], { type: "image/jpeg" });

describe("db", () => {
  beforeEach(async () => { await clearAll(); });

  it("追加した写真をテーブル別に取得できる（createdAt昇順）", async () => {
    await addPhoto({ table: "A", blob: blob(), mime: "image/jpeg" });
    await new Promise((r) => setTimeout(r, 2));
    await addPhoto({ table: "A", blob: blob(), mime: "image/jpeg" });
    await addPhoto({ table: "B", blob: blob(), mime: "image/jpeg" });

    const a = await getPhotosByTable("A");
    expect(a).toHaveLength(2);
    expect(a[0].createdAt).toBeLessThanOrEqual(a[1].createdAt);
    expect((await getPhotosByTable("B"))).toHaveLength(1);
  });

  it("メモ更新と削除ができる", async () => {
    const p = await addPhoto({ table: "A", blob: blob(), mime: "image/jpeg" });
    await updateMemo(p.id, "重要");
    expect((await getAllPhotos()).find((x) => x.id === p.id)!.memo).toBe("重要");
    await deletePhoto(p.id);
    expect(await getAllPhotos()).toHaveLength(0);
  });

  it("getAllPhotos は table→createdAt 昇順", async () => {
    await addPhoto({ table: "B", blob: blob(), mime: "image/jpeg" });
    await addPhoto({ table: "A", blob: blob(), mime: "image/jpeg" });
    const all = await getAllPhotos();
    expect(all.map((p) => p.table)).toEqual(["A", "B"]);
  });
});
