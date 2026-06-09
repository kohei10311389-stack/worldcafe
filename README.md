# World Cafe 付箋写真収集PWA

A〜R の18テーブルごとにQRコードで撮影画面を開き、付箋写真をテーブル別に保存して、最後に
**Excel（メタデータ）** と **画像ZIP** で書き出すPWA。サーバー・有料APIなし（追加費用0円）、
すべてブラウザ内（IndexedDB）で完結します。

## 画面
1. ホーム — 各画面への入口
2. QRコード生成 — A〜RのQRを表示／印刷（読むと該当テーブルの撮影画面が開く）
3. 撮影 — `?table=A` 等のテーブルに紐づけて撮影/選択→メモ→保存
4. 写真一覧 — テーブル別に表示、メモ編集・削除
5. Excel / ZIP 出力 — メタデータExcelと画像ZIP（テーブル別フォルダ）

## ローカル開発
```bash
npm install
npm run dev        # http://localhost:5173/worldcafe/
npm test           # ロジック層のユニットテスト
npm run build      # 本番ビルド(dist/)
npm run preview    # ビルド結果を確認
```
> アイコンを作り直す場合: `node scripts/gen-icons.mjs`

## GitHub Pages へ公開（初回のみ）
リポジトリ名は **`worldcafe`**（`vite.config.ts` の `base: '/worldcafe/'` と一致させること。
別名にする場合は base も変更）。

1. GitHubにリポジトリ `worldcafe` を作成して push:
   ```bash
   gh repo create worldcafe --public --source=. --remote=origin --push
   ```
   （`gh` を使わない場合: GitHubで空リポジトリ作成 → `git remote add origin <URL>` → `git push -u origin main`）
2. GitHub → リポジトリ → **Settings → Pages → Source** を **「GitHub Actions」** に設定。
3. `main` への push で `.github/workflows/deploy.yml` が走り、数分後に
   `https://<ユーザー名>.github.io/worldcafe/` で公開されます。

## 当日の使い方（2人・2端末）
- 2人で **テーブルを分担**（例: 人1=A〜I、人2=J〜R）。同じテーブルを両者で撮らない。
- 各自スマホで公開URLを開く（ホーム画面に追加すればPWAとして使える）。
- QR生成画面のQRを掲示／表示 → 各自が担当テーブルのQRを読んで撮影・メモ・保存。
- 終了後、**各自が** 出力画面で Excel と 画像ZIP をダウンロード。
- PC上で結合: 2つのZIPを展開して重ねる（テーブルフォルダが別々なので衝突なし）＋
  2つのExcelの行を1つに連結。

## データの保存先と注意
- 写真は端末ブラウザの **IndexedDB** に保存され、端末間で自動共有されません。
- 同じ端末・同じブラウザで開けば残っています（プライベートタブやキャッシュ削除で消えます）。
- 写真No・画像名は出力時にテーブル内の撮影日時順で 1 始まり連番（`A-001.jpg` 形式）。

## 技術
Vite / React / TypeScript / HashRouter / qrcode.react / idb(IndexedDB) /
SheetJS(xlsx) / JSZip / vite-plugin-pwa / vitest。

## 将来のOCR拡張
`src/lib/ocrService.ts` に空実装の `recognize(blob)` を用意済み。将来 Tesseract.js（ローカル・無料）
等をここに実装すれば、撮影時や一覧から呼び出すだけで文字起こしを追加できます。

## 設計・計画ドキュメント
- 設計仕様: `docs/superpowers/specs/2026-06-10-worldcafe-photo-pwa-design.md`
- 実装計画: `docs/superpowers/plans/2026-06-10-worldcafe-photo-pwa.md`
