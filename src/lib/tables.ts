// 本番構成: A〜S の18テーブル（Cは使わない）。
export const TABLES: string[] = "ABDEFGHIJKLMNOPQRS".split("");

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
