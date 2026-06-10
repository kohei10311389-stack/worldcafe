import { useEffect, useState } from "react";
import { getAllPhotos, type Photo } from "../lib/db";
import { buildExcelBlob, excelFileName } from "../lib/excel";
import { generateZipBlob, zipFileName } from "../lib/zip";
import { saveBlob } from "../lib/download";

// 共有シート（iOSで保存先やアプリを選べる）が使えればそちらを開き、
// 使えない環境では従来どおりダウンロードする。
async function shareOrDownload(blob: Blob, name: string, mime: string) {
  const file = new File([blob], name, { type: mime });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // ユーザーが共有をキャンセル
    }
  }
  saveBlob(blob, name);
}

export default function Export() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getAllPhotos().then(setPhotos); }, []);

  const counts = photos.reduce<Record<string, number>>((m, p) => {
    m[p.table] = (m[p.table] ?? 0) + 1; return m;
  }, {});

  // iOS Safariはユーザータップ直後でないとダウンロード/共有を発火できないため、
  // 生成に時間のかかるZIPは「生成」と「保存/共有」を別タップに分ける。
  async function makeZip() {
    setBusy(true);
    setError(null);
    setZipBlob(null);
    try {
      setZipBlob(await generateZipBlob(photos));
    } catch (e) {
      setError(`ZIP生成に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

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
        onClick={() => shareOrDownload(
          buildExcelBlob(photos), excelFileName(),
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )}>Excel（メタデータ）を保存 / 共有</button>
      {error && <p style={{ color: "#d33" }}>{error}</p>}
      {!zipBlob ? (
        <button className="btn" disabled={!photos.length || busy} onClick={makeZip}>
          {busy ? "ZIP生成中…" : "① 画像ZIPを生成"}
        </button>
      ) : (
        <button className="btn"
          onClick={() => shareOrDownload(zipBlob, zipFileName(), "application/zip")}>
          ② ZIPを保存 / 共有（{(zipBlob.size / 1024 / 1024).toFixed(1)} MB）
        </button>
      )}
      <p className="muted">※2人で分担した場合は、各自で出力した Excel と ZIP をPC上でまとめてください。</p>
    </div>
  );
}
