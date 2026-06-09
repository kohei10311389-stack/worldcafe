# World Cafe 付箋写真収集PWA — 設計仕様書

- 作成日: 2026-06-10
- ステータス: 設計確定（実装計画 未作成）

## 1. 目的とスコープ

World Cafe（ワールドカフェ形式のワークショップ）で、A〜Rの各テーブルに掲示した
QRコードをスマホで読み取り、付箋写真を **テーブル別に撮影・保存・整理し、最後にExcelとZIPで
書き出す** ためのPWA。

- 完成アプリで **有料APIを一切使わない**（Claude / OpenAI / Google Vision 等は不使用）。
- サーバーレス・**追加費用0円**。すべてブラウザ内（クライアントサイド）で完結する。
- **OCRは本リリースでは実装しない**。将来ローカルOCRを追加できる差し込み口だけ用意する。

### やること（In Scope）
- A〜R（最大18テーブル）対応。初期は A のみで通しを動かす段階リリース。
- アプリ内で各テーブル用QRコードを生成・表示。
- QRから撮影画面を開き、写真を撮影/選択 → テーブルに紐づけて IndexedDB 保存。
- 写真一覧をテーブル別に表示、各写真にメモ、削除可能。
- Excel（メタデータ）出力 と 画像ZIP 一括ダウンロード。

### やらないこと（Out of Scope / YAGNI）
- OCR（文字起こし）の実機能。インターフェースのスタブのみ用意。
- クラウド同期・ログイン・複数端末間の自動共有。
- ライブ映像プレビュー方式の撮影（`getUserMedia`）。`<input capture>` 方式を採用。
- サーバー側処理・有料ホスティング。

## 2. ホスティングと前提制約

- 配信先: **GitHub Pages（プロジェクトサイト）**。固定URL + HTTPS → 真のPWA（インストール可能）。
  - Vite `base: '/worldcafe/'`（リポジトリ名に合わせる。変わる場合はここを直す）。
- **ルーティングは HashRouter**（例: `/#/camera?table=A`）。
  - 理由: GitHub Pages でも 404 にならず、SPAフォールバック設定が不要。ホスティング非依存。
- **撮影は `<input type="file" accept="image/*" capture="environment">` 方式**。
  - 理由: OS標準カメラが開き、http/https どちらでも動作。HTTPS必須の縛りを回避。
  - 「写真を撮影または選択できる」要件を1コンポーネントで満たす。

## 3. データモデル（IndexedDB）

- DB名: `worldcafe-db`（version 1）
- object store: `photos`（keyPath: `id`）
- インデックス: `by_table`(`table`), `by_createdAt`(`createdAt`)

| フィールド | 型 | 説明 |
|---|---|---|
| `id` | string | `crypto.randomUUID()` で生成する一意キー |
| `table` | string | テーブル名 "A"〜"R" |
| `blob` | Blob | 画像本体（IndexedDB に直接保存。structured clone 対応） |
| `mime` | string | 例: `image/jpeg` |
| `createdAt` | number | 撮影/保存日時（epoch ミリ秒） |
| `memo` | string | メモ。初期は空文字、一覧画面で後から編集可 |

### 写真No・画像名の採番ルール
- **保存時には No を持たせない**。エクスポート時（および一覧表示時）に算出する。
- 採番方法: テーブルごとに `createdAt` 昇順で並べ、1, 2, 3 … と連番（1始まり）。
  - 削除しても欠番が出ず、常に一意。
- 画像名: `<テーブル名>-<3桁ゼロ詰めNo>.jpg`（例: `A-001.jpg`）。
  - Excel の「画像名」列と ZIP 内ファイル名は完全一致させる。

## 4. 画面仕様とルート

| 画面 | ルート | 内容 |
|---|---|---|
| ホーム | `/#/` | 各画面への大きなタップ導線（モバイル優先の縦並び）。 |
| QR生成 | `/#/qrcodes` | 対象テーブルのQRを生成・表示。印刷向けグリッド。各QRの下にテーブル名。 |
| 撮影 | `/#/camera?table=A` | `?table` を読み、見出しに「テーブル A」。撮影/選択→プレビュー→メモ入力→保存。連続撮影可。`table` 不正/未指定時はテーブル選択にフォールバック。 |
| 写真一覧 | `/#/photos` | テーブル別グルーピング表示。サムネ・撮影日時・写真No・メモ編集・削除。 |
| 出力 | `/#/export` | ① Excel（メタデータ）出力ボタン ② 画像ZIP（テーブル別フォルダ）ボタン。件数サマリ表示。 |

### QRコードのURL生成
- ベースURL = `window.location.origin + import.meta.env.BASE_URL`（実行時に自動算出）。
- 撮影URL = `` `${baseUrl}#/camera?table=${table}` ``（`buildCameraUrl(table)` に集約）。
- これにより dev（localhost）でも GitHub Pages でも、そのホストの正しいURLが埋め込まれる。

## 5. Excel / ZIP 出力

### Excel（SheetJS / `xlsx`）
- 列: `テーブル名 / 写真No / 画像名 / 撮影日時 / メモ`。
- 並び順: テーブル名 昇順 → 写真No 昇順。全テーブルを1シートに集約。
- 撮影日時はローカル日時の読みやすい文字列（例: `2026-06-10 14:32`）で出力。
- ファイル名例: `worldcafe-YYYYMMDD-HHmm.xlsx`。

### 画像ZIP（JSZip）
- 構造: `<テーブル名>/<画像名>`（例: `A/A-001.jpg`, `A/A-002.jpg`, `B/B-001.jpg`）。
- 画像名は Excel の「画像名」列と完全一致。
- ファイル名例: `worldcafe-images-YYYYMMDD-HHmm.zip`。
- ダウンロードは Blob から `<a download>` を生成するヘルパで実施（外部依存なし）。

## 6. ファイル構成

```
worldcafe/
├─ index.html
├─ vite.config.ts          # base:'/worldcafe/', vite-plugin-pwa 設定
├─ package.json
├─ tsconfig.json
├─ public/
│  └─ icons/               # PWAアイコン(192/512 等)
└─ src/
   ├─ main.tsx
   ├─ App.tsx              # HashRouter + ルート定義
   ├─ routes/
   │  ├─ Home.tsx
   │  ├─ QrCodes.tsx
   │  ├─ Camera.tsx
   │  ├─ Photos.tsx
   │  └─ Export.tsx
   ├─ lib/
   │  ├─ db.ts             # IndexedDB CRUD（idb 使用）
   │  ├─ tables.ts         # TABLES 配列, buildCameraUrl(), 採番ユーティリティ
   │  ├─ excel.ts          # SheetJS によるメタデータ出力
   │  ├─ zip.ts            # JSZip による画像ZIP出力
   │  ├─ download.ts       # Blob ダウンロードヘルパ
   │  └─ ocrService.ts     # 空実装スタブ（将来のローカルOCR用）
   └─ components/
      ├─ PhotoCard.tsx     # サムネ/メモ編集/削除
      └─ (必要に応じ TablePicker 等)
```

## 7. lib/db.ts のインターフェース（想定）

```ts
export interface Photo {
  id: string;
  table: string;
  blob: Blob;
  mime: string;
  createdAt: number;
  memo: string;
}

addPhoto(input: { table: string; blob: Blob; mime: string; memo?: string }): Promise<Photo>;
getPhotosByTable(table: string): Promise<Photo[]>;   // createdAt 昇順
getAllPhotos(): Promise<Photo[]>;                     // table→createdAt 昇順
updateMemo(id: string, memo: string): Promise<void>;
deletePhoto(id: string): Promise<void>;
```

表示用のオブジェクトURLは都度 `URL.createObjectURL` で生成し、不要時に `revokeObjectURL` する。

## 8. 将来のOCR拡張ポイント

`src/lib/ocrService.ts` は最初から以下のインターフェースで空実装：

```ts
export interface OcrResult { text: string; }

/** 将来: ローカルOCR(例 Tesseract.js)をここに実装。現状は常に空文字を返す。 */
export async function recognize(_blob: Blob): Promise<OcrResult> {
  return { text: "" };
}
```

将来は Tesseract.js（ローカル・無料）等を内部に実装し、撮影時 or 一覧から呼ぶだけにする。

## 9. 段階リリース

- **Phase 1（最小構成）**: `TABLES = ["A"]` のまま、5画面すべてを通しで動かす。
  - 撮影 → IndexedDB保存 → 一覧表示/メモ/削除 → Excel出力 → ZIP出力 が一気通貫で動くこと。
- **Phase 2（A〜R拡張）**: `TABLES` を A〜R の18個に拡張するのみ。
  - QR生成は18個グリッド、一覧は18グループに自動対応する設計。

## 10. 採用ライブラリ（すべて無料・API不要）

| ライブラリ | 用途 |
|---|---|
| `react-router-dom` | HashRouter ルーティング |
| `qrcode.react` | QRコード生成 |
| `xlsx`（SheetJS） | Excelメタデータ出力 |
| `jszip` | 画像ZIP出力 |
| `idb` | 軽量 IndexedDB ラッパ |
| `vite-plugin-pwa` | Service Worker + manifest（PWA化） |

## 11. テスト方針（概要）

- `lib/tables.ts`: `buildCameraUrl`、テーブル別採番ロジックの単体テスト。
- `lib/db.ts`: 追加→取得→メモ更新→削除の往復、テーブル別取得順序の単体テスト（fake-indexeddb）。
- `lib/excel.ts` / `lib/zip.ts`: 入力データ→出力構造（列・ファイルパス・採番一致）の単体テスト。
- 実機確認: スマホで QR読取 → 撮影画面が該当テーブルで開く → 保存 → 一覧 → Excel/ZIP の通し。

## 12. 受け入れ基準

- QR生成画面で対象テーブルのQRが表示され、スマホで読むと該当テーブルの撮影画面が開く。
- 撮影/選択した写真がテーブルに紐づいて保存され、一覧でテーブル別に確認できる。
- 各写真のメモを編集・保存でき、写真を削除できる。
- Excelが `テーブル名/写真No/画像名/撮影日時/メモ` の列で出力される。
- 画像ZIPがテーブル別フォルダ構成で出力され、ファイル名がExcelの画像名と一致する。
- ネットワーク遮断状態でも（初回ロード後は）アプリが起動し、保存・出力ができる。
