import { describe, it, expect } from "vitest";
import { TABLES, assignPhotoNumbers, imageFileName } from "./tables";

describe("tables", () => {
  it("A〜S（C抜き）の18テーブルを持つ", () => {
    expect(TABLES).toHaveLength(18);
    expect(TABLES[0]).toBe("A");
    expect(TABLES[17]).toBe("S");
    expect(TABLES).not.toContain("C");
  });

  it("assignPhotoNumbers は createdAt 昇順で 1 始まり連番を振る", () => {
    const photos = [
      { id: "b", createdAt: 200 },
      { id: "a", createdAt: 100 },
      { id: "c", createdAt: 300 }
    ];
    const result = assignPhotoNumbers(photos);
    expect(result.map((p) => [p.id, p.no])).toEqual([
      ["a", 1], ["b", 2], ["c", 3]
    ]);
  });

  it("imageFileName は3桁ゼロ詰め", () => {
    expect(imageFileName("A", 1)).toBe("A-001.jpg");
    expect(imageFileName("R", 42)).toBe("R-042.jpg");
  });
});
