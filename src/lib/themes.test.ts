import { describe, it, expect } from "vitest";
import { GROUP_A_TABLES, GROUP_B_TABLES, THEMES_A, THEMES_B, themesForTable } from "./themes";
import { TABLES } from "./tables";

describe("themes", () => {
  it("全テーブルがどちらか一方のグループに属する", () => {
    for (const t of TABLES) {
      const inA = GROUP_A_TABLES.includes(t);
      const inB = GROUP_B_TABLES.includes(t);
      expect(inA !== inB, `table ${t}`).toBe(true);
    }
    expect(GROUP_A_TABLES.length + GROUP_B_TABLES.length).toBe(TABLES.length);
  });

  it("各グループは5テーマ持つ", () => {
    expect(THEMES_A).toHaveLength(5);
    expect(THEMES_B).toHaveLength(5);
  });

  it("themesForTable はグループに応じたテーマを返す", () => {
    expect(themesForTable("A")).toBe(THEMES_A);
    expect(themesForTable("P")).toBe(THEMES_A);
    expect(themesForTable("S")).toBe(THEMES_B);
    expect(themesForTable("C")).toEqual([]);
  });
});
