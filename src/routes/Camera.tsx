import { useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { TABLES } from "../lib/tables";
import { addPhoto } from "../lib/db";

export default function Camera() {
  const [params] = useSearchParams();
  const table = params.get("table");
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [memo, setMemo] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // table未指定/不正ならテーブル選択を表示
  if (!table || !TABLES.includes(table)) {
    return (
      <div>
        <h1 className="h1">テーブルを選択</h1>
        <div className="grid">
          {TABLES.map((t) => (
            <Link className="btn" key={t} to={`/camera?table=${t}`}>テーブル {t}</Link>
          ))}
        </div>
      </div>
    );
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  async function save() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await addPhoto({ table: table!, blob: file, mime: file.type || "image/jpeg", memo });
      setSavedCount((n) => n + 1);
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setMemo("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(`保存に失敗しました: ${e instanceof Error ? e.message : String(e)}。プライベートブラウズ中や空き容量不足では保存できないことがあります。`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="h1">テーブル {table} 撮影</h1>
      {savedCount > 0 && <p className="muted">このセッションで保存: {savedCount}枚</p>}
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={onPick} style={{ display: "none" }} />
      <button className="btn" onClick={() => fileRef.current?.click()}>
        📷 写真を撮影 / 選択
      </button>
      {error && <p style={{ color: "#d33" }}>{error}</p>}
      {preview && (
        <div className="card">
          <img className="thumb" src={preview} alt="preview" />
          <textarea className="memo" placeholder="メモ（任意）"
            value={memo} onChange={(e) => setMemo(e.target.value)} />
          <button className="btn" disabled={busy} onClick={save}>
            {busy ? "保存中…" : "この写真を保存"}
          </button>
        </div>
      )}
      <Link className="btn secondary" to="/photos">写真一覧を見る</Link>
    </div>
  );
}
