// Phase1: ["A"] のまま通しを確認。Phase2(本番)で下行を A〜R に差し替える。
export const TABLES: string[] = ["A"];
// Phase2 で使う全18テーブル（差し替え用）:
// export const TABLES: string[] = "ABCDEFGHIJKLMNOPQR".split("");

export function buildCameraUrl(baseUrl: string, table: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  return `${base}#/camera?table=${table}`;
}

export function imageFileName(table: string, no: number): string {
  return `${table}-${String(no).padStart(3, "0")}.jpg`;
}

export function assignPhotoNumbers<T extends { createdAt: number }>(
  photos: T[]
): (T & { no: number })[] {
  return [...photos]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((p, i) => ({ ...p, no: i + 1 }));
}
