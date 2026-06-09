import { useEffect, useState } from "react";
import { getAllPhotos, type Photo } from "../lib/db";
import { exportExcel } from "../lib/excel";
import { exportZip } from "../lib/zip";

export default function Export() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getAllPhotos().then(setPhotos); }, []);

  const counts = photos.reduce<Record<string, number>>((m, p) => {
    m[p.table] = (m[p.table] ?? 0) + 1; return m;
  }, {});

  return (
    <div>
      <h1 className="h1">Excel / ZIP 出力</h1>
      <div className="card">
        <div>合計 {photos.length}枚</div>
        {Object.keys(counts).sort().map((t) => (
          <div className="muted" key={t}>テーブル {t}: {counts[t]}枚</div>
        ))}
      </div>
      <button className="btn" disabled={!photos.length}
        onClick={() => exportExcel(photos)}>Excel（メタデータ）を出力</button>
      <button className="btn" disabled={!photos.length || busy}
        onClick={async () => { setBusy(true); await exportZip(photos); setBusy(false); }}>
        {busy ? "ZIP生成中…" : "画像ZIPを出力"}
      </button>
      <p className="muted">※2人で分担した場合は、各自で出力した Excel と ZIP をPC上でまとめてください。</p>
    </div>
  );
}
