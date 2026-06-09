import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1 className="h1">World Cafe 写真収集</h1>
      <Link className="btn" to="/qrcodes">QRコード生成</Link>
      <Link className="btn" to="/camera">撮影（テーブル選択）</Link>
      <Link className="btn" to="/photos">写真一覧</Link>
      <Link className="btn" to="/export">Excel / ZIP 出力</Link>
    </div>
  );
}
