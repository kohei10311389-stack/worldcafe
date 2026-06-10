import { useEffect, useState } from "react";
import type { Photo } from "../lib/db";
import { updateMemo, deletePhoto } from "../lib/db";
import { formatDateTime } from "../lib/datetime";

export default function PhotoCard({ photo, no, onChanged }: {
  photo: Photo; no: number; onChanged: () => void;
}) {
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState(photo.memo);
  // iOS Safari/PWAはconfirm()がダイアログを出さずfalseを返すことがあるため、
  // 確認は2タップ方式（1回目で確認状態に切替→2回目で実行）にする。
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.blob]);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  async function onDelete() {
    if (!confirming) { setConfirming(true); return; }
    try {
      await deletePhoto(photo.id);
      onChanged();
    } catch (e) {
      setError(`削除に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="card">
      <div className="muted">
        No.{no} ・ {formatDateTime(photo.createdAt)}
        {photo.theme && <> ・ {photo.theme}</>}
      </div>
      {url && <img className="thumb" src={url} alt={`${photo.table}-${no}`} />}
      <textarea className="memo" value={memo}
        onChange={(e) => setMemo(e.target.value)}
        onBlur={async () => { await updateMemo(photo.id, memo); onChanged(); }} />
      {error && <p style={{ color: "#d33" }}>{error}</p>}
      <button className="btn danger" onClick={onDelete}>
        {confirming ? "もう一度押すと削除します" : "削除"}
      </button>
    </div>
  );
}
