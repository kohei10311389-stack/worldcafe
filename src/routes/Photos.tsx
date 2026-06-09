import { useCallback, useEffect, useState } from "react";
import { getAllPhotos, type Photo } from "../lib/db";
import { TABLES } from "../lib/tables";
import PhotoCard from "../components/PhotoCard";

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const load = useCallback(async () => setPhotos(await getAllPhotos()), []);
  useEffect(() => { load(); }, [load]);

  const tablesWithPhotos = TABLES.filter((t) => photos.some((p) => p.table === t));

  return (
    <div>
      <h1 className="h1">写真一覧（{photos.length}枚）</h1>
      {tablesWithPhotos.length === 0 && <p className="muted">まだ写真がありません。</p>}
      {tablesWithPhotos.map((t) => {
        const list = photos.filter((p) => p.table === t)
          .sort((a, b) => a.createdAt - b.createdAt);
        return (
          <section key={t}>
            <div className="tablehead">テーブル {t}（{list.length}枚）</div>
            {list.map((p, i) => (
              <PhotoCard key={p.id} photo={p} no={i + 1} onChanged={load} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
