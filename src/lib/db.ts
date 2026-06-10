import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface Photo {
  id: string;
  table: string;
  blob: Blob;
  mime: string;
  createdAt: number;
  memo: string;
  theme: string;
}

// iOS SafariはIndexedDBへのBlob保存が失敗・ハングすることがあるため、
// 実体はArrayBufferで保存する。旧バージョンが保存したBlobも読める。
interface StoredPhoto {
  id: string;
  table: string;
  data?: ArrayBuffer;
  blob?: Blob;
  mime: string;
  createdAt: number;
  memo: string;
  theme?: string;
}

interface WCDB extends DBSchema {
  photos: {
    key: string;
    value: StoredPhoto;
    indexes: { by_table: string; by_createdAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<WCDB>> | null = null;
function db() {
  if (!dbPromise) {
    dbPromise = openDB<WCDB>("worldcafe-db", 1, {
      upgrade(d) {
        const store = d.createObjectStore("photos", { keyPath: "id" });
        store.createIndex("by_table", "table");
        store.createIndex("by_createdAt", "createdAt");
      }
    });
  }
  return dbPromise;
}

function toPhoto(s: StoredPhoto): Photo {
  const blob = s.blob instanceof Blob ? s.blob : new Blob([s.data!], { type: s.mime });
  return {
    id: s.id, table: s.table, blob, mime: s.mime,
    createdAt: s.createdAt, memo: s.memo, theme: s.theme ?? ""
  };
}

export async function addPhoto(input: {
  table: string; blob: Blob; mime: string; memo?: string; theme?: string;
}): Promise<Photo> {
  const data = await input.blob.arrayBuffer();
  const stored: StoredPhoto = {
    id: crypto.randomUUID(),
    table: input.table,
    data,
    mime: input.mime,
    createdAt: Date.now(),
    memo: input.memo ?? "",
    theme: input.theme ?? ""
  };
  await (await db()).put("photos", stored);
  return toPhoto(stored);
}

export async function getPhotosByTable(table: string): Promise<Photo[]> {
  const all = await (await db()).getAllFromIndex("photos", "by_table", table);
  return all.sort((a, b) => a.createdAt - b.createdAt).map(toPhoto);
}

export async function getAllPhotos(): Promise<Photo[]> {
  const all = await (await db()).getAll("photos");
  return all
    .sort((a, b) =>
      a.table === b.table ? a.createdAt - b.createdAt : a.table < b.table ? -1 : 1
    )
    .map(toPhoto);
}

export async function updateMemo(id: string, memo: string): Promise<void> {
  const d = await db();
  const p = await d.get("photos", id);
  if (!p) return;
  p.memo = memo;
  await d.put("photos", p);
}

export async function deletePhoto(id: string): Promise<void> {
  await (await db()).delete("photos", id);
}

export async function clearAll(): Promise<void> {
  await (await db()).clear("photos");
}
