import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface Photo {
  id: string;
  table: string;
  blob: Blob;
  mime: string;
  createdAt: number;
  memo: string;
}

interface WCDB extends DBSchema {
  photos: {
    key: string;
    value: Photo;
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

export async function addPhoto(input: {
  table: string; blob: Blob; mime: string; memo?: string;
}): Promise<Photo> {
  const photo: Photo = {
    id: crypto.randomUUID(),
    table: input.table,
    blob: input.blob,
    mime: input.mime,
    createdAt: Date.now(),
    memo: input.memo ?? ""
  };
  await (await db()).put("photos", photo);
  return photo;
}

export async function getPhotosByTable(table: string): Promise<Photo[]> {
  const all = await (await db()).getAllFromIndex("photos", "by_table", table);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getAllPhotos(): Promise<Photo[]> {
  const all = await (await db()).getAll("photos");
  return all.sort((a, b) =>
    a.table === b.table ? a.createdAt - b.createdAt : a.table < b.table ? -1 : 1
  );
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
