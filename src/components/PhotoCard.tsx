import { useEffect, useState } from "react";
import type { Photo } from "../lib/db";
import { updateMemo, deletePhoto } from "../lib/db";
import { formatDateTime } from "../lib/datetime";

export default function PhotoCard({ photo, no, onChanged }: {
  photo: Photo; no: number; onChanged: () => void;
}) {
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState(photo.memo);

  useEffect(() => {
    const u = URL.createObjectURL(photo.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo.blob]);

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
      <button className="btn danger" onClick={async () => {
        if (confirm("この写真を削除しますか？")) { await deletePhoto(photo.id); onChanged(); }
      }}>削除</button>
    </div>
  );
}
