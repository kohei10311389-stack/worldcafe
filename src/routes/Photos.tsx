import { useCallback, useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getAllPhotos, type Photo } from "../lib/db";
import { TABLES } from "../lib/tables";
import PhotoCard from "../components/PhotoCard";
import TablePicker from "../components/TablePicker";

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const load = useCallback(async () => setPhotos(await getAllPhotos()), []);
  useEffect(() => { load(); }, [load]);

  const [params] = useSearchParams();
  const table = params.get("table");

  const tablesWithPhotos = TABLES.filter((t) => photos.some((p) => p.table === t));

  // テーブル未指定/不正ならテーブル選択を表示（撮影フローと同じ操作感）
  if (!table || !TABLES.includes(table)) {
    return (
      <div>
        <h1 className="h1">写真一覧（合計{photos.length}枚）</h1>
        {tablesWithPhotos.length === 0 && <p className="muted">まだ写真がありません。</p>}
        <TablePicker
          tables={tablesWithPhotos}
          hrefFor={(t) => `/photos?table=${t}`}
          countFor={(t) => photos.filter((p) => p.table === t).length}
        />
      </div>
    );
  }

  // 個別表示: 選んだテーブルの写真だけ
  const list = photos.filter((p) => p.table === table)
    .sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div>
      <Link className="btn secondary" to="/photos">← テーブル選択に戻る</Link>
      <div className="tablehead">テーブル {table}（{list.length}枚）</div>
      {list.length === 0 && <p className="muted">このテーブルの写真はありません。</p>}
      {list.map((p, i) => (
        <PhotoCard key={p.id} photo={p} no={i + 1} onChanged={load} />
      ))}
    </div>
  );
}
