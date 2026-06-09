import { QRCodeCanvas } from "qrcode.react";
import { TABLES, buildCameraUrl } from "../lib/tables";

export default function QrCodes() {
  const baseUrl = window.location.origin + import.meta.env.BASE_URL;
  return (
    <div>
      <h1 className="h1">QRコード生成</h1>
      <p className="muted">各QRを読み取ると、そのテーブルの撮影画面が開きます。<br />ベース: {baseUrl}</p>
      <div className="grid">
        {TABLES.map((t) => {
          const url = buildCameraUrl(baseUrl, t);
          return (
            <div className="card" key={t} style={{ textAlign: "center" }}>
              <div className="tablehead">テーブル {t}</div>
              <QRCodeCanvas value={url} size={160} marginSize={2} />
              <div className="muted" style={{ wordBreak: "break-all" }}>{url}</div>
            </div>
          );
        })}
      </div>
      <button className="btn secondary" onClick={() => window.print()}>印刷する</button>
    </div>
  );
}
