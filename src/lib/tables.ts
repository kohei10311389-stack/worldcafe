// 本番構成: A〜R の18テーブル。
export const TABLES: string[] = "ABCDEFGHIJKLMNOPQR".split("");

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
