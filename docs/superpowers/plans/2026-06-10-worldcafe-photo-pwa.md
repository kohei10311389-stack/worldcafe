# World Cafe 付箋写真収集PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A〜R 18テーブルのQRから撮影画面を開き、写真をテーブル別にIndexedDBへ保存し、Excel(メタデータ)と画像ZIPを出力するPWAを、GitHub Pagesに公開して明日の本番で2人が使える状態にする。

**Architecture:** Vite + React + TypeScript の純クライアントSPA。HashRouterでルーティング、`<input capture>`で撮影、idb経由でIndexedDBにBlob保存、SheetJSでExcel・JSZipでZIP出力。サーバー/有料APIなし。

**Tech Stack:** Vite, React 18, TypeScript, react-router-dom(HashRouter), qrcode.react, xlsx(SheetJS), jszip, idb, vite-plugin-pwa, vitest + fake-indexeddb。

**テスト方針（期日優先の現実配分）:** ロジック/データ層（`tables.ts`/`db.ts`/`excel.ts`/`zip.ts`）はvitestでTDD。UI画面（routes/components）は実機/devサーバーでの動作確認で担保する。

---

## File Structure

```
worldcafe/
├─ index.html                 # エントリHTML
├─ package.json
├─ tsconfig.json / tsconfig.node.json
├─ vite.config.ts             # base:'/worldcafe/', vite-plugin-pwa, vitest設定
├─ public/icons/              # PWAアイコン(pwa-192.png, pwa-512.png)
└─ src/
   ├─ main.tsx                # ReactDOM.createRoot
   ├─ vite-env.d.ts
   ├─ App.tsx                 # HashRouter + Routes
   ├─ styles.css              # モバイル優先の最小スタイル
   ├─ lib/
   │  ├─ tables.ts            # TABLES, buildCameraUrl(), assignPhotoNumbers()
   │  ├─ db.ts                # idbラッパ: Photo型 + CRUD
   │  ├─ excel.ts             # buildExcelRows(), exportExcel()
   │  ├─ zip.ts               # buildZipEntries(), exportZip()
   │  ├─ download.ts          # saveBlob()
   │  ├─ datetime.ts          # formatDateTime(), fileStamp()
   │  └─ ocrService.ts        # 空実装スタブ
   ├─ test/
   │  └─ setup.ts             # fake-indexeddb/auto を読み込む
   └─ routes/
      ├─ Home.tsx
      ├─ QrCodes.tsx
      ├─ Camera.tsx
      ├─ Photos.tsx
      └─ Export.tsx
```

---

## Task 1: プロジェクト雛形と依存関係

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/test/setup.ts`, `src/styles.css`

- [ ] **Step 1: package.json を作成**

```json
{
  "name": "worldcafe",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "idb": "^8.0.0",
    "jszip": "^3.10.1",
    "qrcode.react": "^4.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "fake-indexeddb": "^6.0.0",
    "typescript": "^5.6.3",
    "vite": "^6.0.3",
    "vite-plugin-pwa": "^0.21.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: tsconfig.json / tsconfig.node.json を作成**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: vite.config.ts を作成（PWA + vitest）**

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/worldcafe/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/pwa-192.png", "icons/pwa-512.png"],
      manifest: {
        name: "World Cafe 写真収集",
        short_name: "WC写真",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"]
  }
});
```

- [ ] **Step 4: index.html / src/main.tsx / vite-env.d.ts / test/setup.ts / styles.css を作成**

`index.html`:
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#2563eb" />
    <title>World Cafe 写真収集</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

`src/test/setup.ts`:
```ts
import "fake-indexeddb/auto";
```

`src/styles.css` (モバイル優先・最小):
```css
:root { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; }
* { box-sizing: border-box; }
body { margin: 0; background: #f5f5f5; }
.app { max-width: 640px; margin: 0 auto; padding: 16px; }
.btn { display: block; width: 100%; padding: 16px; margin: 8px 0; font-size: 18px;
  border: none; border-radius: 12px; background: #2563eb; color: #fff; text-align: center;
  text-decoration: none; cursor: pointer; }
.btn.secondary { background: #e5e7eb; color: #111; }
.btn.danger { background: #dc2626; }
.h1 { font-size: 22px; margin: 8px 0 16px; }
.card { background: #fff; border-radius: 12px; padding: 12px; margin: 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.thumb { width: 100%; border-radius: 8px; display: block; }
.memo { width: 100%; min-height: 56px; font-size: 16px; padding: 8px; border: 1px solid #ccc; border-radius: 8px; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.tablehead { font-size: 18px; font-weight: 700; margin: 16px 0 4px; }
.muted { color: #666; font-size: 13px; }
```

- [ ] **Step 5: 依存インストール**

Run: `npm install`
Expected: 正常完了（node_modules 生成）

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "chore: Vite+React+TS+PWA 雛形と依存を追加"
```

---

## Task 2: lib/tables.ts（テーブル定義・URL生成・採番）

**Files:**
- Create: `src/lib/tables.ts`, `src/lib/tables.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/tables.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { TABLES, buildCameraUrl, assignPhotoNumbers, imageFileName } from "./tables";

describe("tables", () => {
  it("Phase1ではAのみ（後でA〜Rに拡張）", () => {
    expect(TABLES[0]).toBe("A");
  });

  it("buildCameraUrl はベースURL末尾に #/camera?table=X を付ける", () => {
    expect(buildCameraUrl("https://u.github.io/worldcafe/", "A"))
      .toBe("https://u.github.io/worldcafe/#/camera?table=A");
  });

  it("assignPhotoNumbers は createdAt 昇順で 1 始まり連番を振る", () => {
    const photos = [
      { id: "b", createdAt: 200 },
      { id: "a", createdAt: 100 },
      { id: "c", createdAt: 300 }
    ];
    const result = assignPhotoNumbers(photos);
    expect(result.map((p) => [p.id, p.no])).toEqual([
      ["a", 1], ["b", 2], ["c", 3]
    ]);
  });

  it("imageFileName は3桁ゼロ詰め", () => {
    expect(imageFileName("A", 1)).toBe("A-001.jpg");
    expect(imageFileName("R", 42)).toBe("R-042.jpg");
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- tables`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 実装**

`src/lib/tables.ts`:
```ts
// Phase1: ["A"] のまま通しを確認。Phase2(本番)で下行を A〜R に差し替える。
export const TABLES: string[] = ["A"];
// Phase2 で使う全18テーブル（差し替え用）:
// export const TABLES: string[] = "ABCDEFGHIJKLMNOPQR".split("");

export function buildCameraUrl(baseUrl: string, table: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  return `${base}#/camera?table=${table}`;
}

export function imageFileName(table: string, no: number): string {
  return `${table}-${String(no).padStart(3, "0")}.jpg`;
}

export function assignPhotoNumbers<T extends { createdAt: number }>(
  photos: T[]
): (T & { no: number })[] {
  return [...photos]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((p, i) => ({ ...p, no: i + 1 }));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- tables`
Expected: PASS（4 tests）

- [ ] **Step 5: コミット**

```bash
git add src/lib/tables.ts src/lib/tables.test.ts
git commit -m "feat: テーブル定義・カメラURL生成・写真採番ユーティリティ"
```

---

## Task 3: lib/db.ts（IndexedDB CRUD）

**Files:**
- Create: `src/lib/db.ts`, `src/lib/db.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/db.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { addPhoto, getPhotosByTable, getAllPhotos, updateMemo, deletePhoto, clearAll } from "./db";

const blob = () => new Blob(["x"], { type: "image/jpeg" });

describe("db", () => {
  beforeEach(async () => { await clearAll(); });

  it("追加した写真をテーブル別に取得できる（createdAt昇順）", async () => {
    await addPhoto({ table: "A", blob: blob(), mime: "image/jpeg" });
    await new Promise((r) => setTimeout(r, 2));
    await addPhoto({ table: "A", blob: blob(), mime: "image/jpeg" });
    await addPhoto({ table: "B", blob: blob(), mime: "image/jpeg" });

    const a = await getPhotosByTable("A");
    expect(a).toHaveLength(2);
    expect(a[0].createdAt).toBeLessThanOrEqual(a[1].createdAt);
    expect((await getPhotosByTable("B"))).toHaveLength(1);
  });

  it("メモ更新と削除ができる", async () => {
    const p = await addPhoto({ table: "A", blob: blob(), mime: "image/jpeg" });
    await updateMemo(p.id, "重要");
    expect((await getAllPhotos()).find((x) => x.id === p.id)!.memo).toBe("重要");
    await deletePhoto(p.id);
    expect(await getAllPhotos()).toHaveLength(0);
  });

  it("getAllPhotos は table→createdAt 昇順", async () => {
    await addPhoto({ table: "B", blob: blob(), mime: "image/jpeg" });
    await addPhoto({ table: "A", blob: blob(), mime: "image/jpeg" });
    const all = await getAllPhotos();
    expect(all.map((p) => p.table)).toEqual(["A", "B"]);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- db`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 実装**

`src/lib/db.ts`:
```ts
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface Photo {
  id: string;
  table: string;
  blob: Blob;
  mime: string;
  createdAt: number;
  memo: string;
}

interface WCDB extends DBSchema {
  photos: {
    key: string;
    value: Photo;
    indexes: { by_table: string; by_createdAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<WCDB>> | null = null;
function db() {
  if (!dbPromise) {
    dbPromise = openDB<WCDB>("worldcafe-db", 1, {
      upgrade(d) {
        const store = d.createObjectStore("photos", { keyPath: "id" });
        store.createIndex("by_table", "table");
        store.createIndex("by_createdAt", "createdAt");
      }
    });
  }
  return dbPromise;
}

export async function addPhoto(input: {
  table: string; blob: Blob; mime: string; memo?: string;
}): Promise<Photo> {
  const photo: Photo = {
    id: crypto.randomUUID(),
    table: input.table,
    blob: input.blob,
    mime: input.mime,
    createdAt: Date.now(),
    memo: input.memo ?? ""
  };
  await (await db()).put("photos", photo);
  return photo;
}

export async function getPhotosByTable(table: string): Promise<Photo[]> {
  const all = await (await db()).getAllFromIndex("photos", "by_table", table);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getAllPhotos(): Promise<Photo[]> {
  const all = await (await db()).getAll("photos");
  return all.sort((a, b) =>
    a.table === b.table ? a.createdAt - b.createdAt : a.table < b.table ? -1 : 1
  );
}

export async function updateMemo(id: string, memo: string): Promise<void> {
  const d = await db();
  const p = await d.get("photos", id);
  if (!p) return;
  p.memo = memo;
  await d.put("photos", p);
}

export async function deletePhoto(id: string): Promise<void> {
  await (await db()).delete("photos", id);
}

export async function clearAll(): Promise<void> {
  await (await db()).clear("photos");
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- db`
Expected: PASS（3 tests）

- [ ] **Step 5: コミット**

```bash
git add src/lib/db.ts src/lib/db.test.ts
git commit -m "feat: IndexedDB(idb)による写真CRUD"
```

---

## Task 4: lib/datetime.ts + lib/excel.ts（Excel行生成）

**Files:**
- Create: `src/lib/datetime.ts`, `src/lib/excel.ts`, `src/lib/excel.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/excel.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildExcelRows } from "./excel";
import type { Photo } from "./db";

function photo(p: Partial<Photo>): Photo {
  return { id: "x", table: "A", blob: new Blob(), mime: "image/jpeg",
    createdAt: Date.UTC(2026, 5, 11, 5, 32), memo: "", ...p } as Photo;
}

describe("buildExcelRows", () => {
  it("ヘッダ + テーブル/写真No順の行を返す", () => {
    const rows = buildExcelRows([
      photo({ id: "b", table: "A", createdAt: 200, memo: "二番" }),
      photo({ id: "a", table: "A", createdAt: 100, memo: "一番" }),
      photo({ id: "c", table: "B", createdAt: 50, memo: "別表" })
    ]);
    expect(rows[0]).toEqual(["テーブル名", "写真No", "画像名", "撮影日時", "メモ"]);
    // A-1(一番), A-2(二番), B-1(別表)
    expect(rows[1].slice(0, 3)).toEqual(["A", 1, "A-001.jpg"]);
    expect(rows[1][4]).toBe("一番");
    expect(rows[2].slice(0, 3)).toEqual(["A", 2, "A-002.jpg"]);
    expect(rows[3].slice(0, 3)).toEqual(["B", 1, "B-001.jpg"]);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- excel`
Expected: FAIL

- [ ] **Step 3: 実装**

`src/lib/datetime.ts`:
```ts
function pad(n: number): string { return String(n).padStart(2, "0"); }

export function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fileStamp(ms: number = Date.now()): string {
  const d = new Date(ms);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
```

`src/lib/excel.ts`:
```ts
import * as XLSX from "xlsx";
import type { Photo } from "./db";
import { assignPhotoNumbers, imageFileName } from "./tables";
import { formatDateTime, fileStamp } from "./datetime";
import { saveBlob } from "./download";

const HEADER = ["テーブル名", "写真No", "画像名", "撮影日時", "メモ"];

export function buildExcelRows(photos: Photo[]): (string | number)[][] {
  const byTable = new Map<string, Photo[]>();
  for (const p of photos) {
    (byTable.get(p.table) ?? byTable.set(p.table, []).get(p.table)!).push(p);
  }
  const rows: (string | number)[][] = [HEADER];
  for (const table of [...byTable.keys()].sort()) {
    for (const p of assignPhotoNumbers(byTable.get(table)!)) {
      rows.push([
        p.table, p.no, imageFileName(p.table, p.no),
        formatDateTime(p.createdAt), p.memo
      ]);
    }
  }
  return rows;
}

export function exportExcel(photos: Photo[]): void {
  const ws = XLSX.utils.aoa_to_sheet(buildExcelRows(photos));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "photos");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveBlob(
    new Blob([out], { type: "application/octet-stream" }),
    `worldcafe-${fileStamp()}.xlsx`
  );
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- excel`
Expected: PASS（注: `download.ts` 未作成なら Task 6 を先に作るか、`exportExcel`のimport行を一時コメントアウト。下記Step5の順序に従えば回避できる）

> 注: `excel.ts` は `download.ts` を import するため、**Task 6 の `download.ts` を先に作成**してから本タスクのテストを実行する。実行順は Task 2 → 3 → 6(download/ocr) → 4 → 5 が安全。

- [ ] **Step 5: コミット**

```bash
git add src/lib/datetime.ts src/lib/excel.ts src/lib/excel.test.ts
git commit -m "feat: Excel(メタデータ)出力と日時整形"
```

---

## Task 5: lib/zip.ts（画像ZIP生成）

**Files:**
- Create: `src/lib/zip.ts`, `src/lib/zip.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/zip.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildZipEntries } from "./zip";
import type { Photo } from "./db";

function photo(p: Partial<Photo>): Photo {
  return { id: "x", table: "A", blob: new Blob(["x"]), mime: "image/jpeg",
    createdAt: 0, memo: "", ...p } as Photo;
}

describe("buildZipEntries", () => {
  it("テーブル別フォルダ + 採番ファイル名でパスを作る", () => {
    const entries = buildZipEntries([
      photo({ id: "b", table: "A", createdAt: 200 }),
      photo({ id: "a", table: "A", createdAt: 100 }),
      photo({ id: "c", table: "B", createdAt: 50 })
    ]);
    expect(entries.map((e) => e.path)).toEqual([
      "A/A-001.jpg", "A/A-002.jpg", "B/B-001.jpg"
    ]);
    expect(entries[0].blob).toBeInstanceOf(Blob);
  });
});
```

- [ ] **Step 2: 失敗を確認**

Run: `npm test -- zip`
Expected: FAIL

- [ ] **Step 3: 実装**

`src/lib/zip.ts`:
```ts
import JSZip from "jszip";
import type { Photo } from "./db";
import { assignPhotoNumbers, imageFileName } from "./tables";
import { fileStamp } from "./datetime";
import { saveBlob } from "./download";

export interface ZipEntry { path: string; blob: Blob; }

export function buildZipEntries(photos: Photo[]): ZipEntry[] {
  const byTable = new Map<string, Photo[]>();
  for (const p of photos) {
    (byTable.get(p.table) ?? byTable.set(p.table, []).get(p.table)!).push(p);
  }
  const entries: ZipEntry[] = [];
  for (const table of [...byTable.keys()].sort()) {
    for (const p of assignPhotoNumbers(byTable.get(table)!)) {
      entries.push({ path: `${table}/${imageFileName(table, p.no)}`, blob: p.blob });
    }
  }
  return entries;
}

export async function exportZip(photos: Photo[]): Promise<void> {
  const zip = new JSZip();
  for (const e of buildZipEntries(photos)) zip.file(e.path, e.blob);
  const out = await zip.generateAsync({ type: "blob" });
  saveBlob(out, `worldcafe-images-${fileStamp()}.zip`);
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- zip`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/zip.ts src/lib/zip.test.ts
git commit -m "feat: 画像ZIP(テーブル別フォルダ)出力"
```

---

## Task 6: lib/download.ts + lib/ocrService.ts（ヘルパとOCRスタブ）

> 実行順の都合上、Task 4/5 の前にこのタスクを完了させること（excel.ts/zip.ts が download.ts を import するため）。

**Files:**
- Create: `src/lib/download.ts`, `src/lib/ocrService.ts`

- [ ] **Step 1: download.ts を作成**

`src/lib/download.ts`:
```ts
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

- [ ] **Step 2: ocrService.ts を作成（空実装スタブ）**

`src/lib/ocrService.ts`:
```ts
export interface OcrResult { text: string; }

/**
 * 将来: ローカルOCR(例 Tesseract.js / 無料・API不要)をここに実装する。
 * 現状は未実装で、常に空文字を返すスタブ。
 */
export async function recognize(_blob: Blob): Promise<OcrResult> {
  return { text: "" };
}
```

- [ ] **Step 3: コミット**

```bash
git add src/lib/download.ts src/lib/ocrService.ts
git commit -m "feat: BlobダウンロードヘルパとOCR空実装スタブ"
```

---

## Task 7: App.tsx ルーティング + Home画面

**Files:**
- Create: `src/App.tsx`, `src/routes/Home.tsx`

- [ ] **Step 1: App.tsx を作成（HashRouter）**

`src/App.tsx`:
```tsx
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./routes/Home";
import QrCodes from "./routes/QrCodes";
import Camera from "./routes/Camera";
import Photos from "./routes/Photos";
import Export from "./routes/Export";

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/qrcodes" element={<QrCodes />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/export" element={<Export />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Link to="/" className="muted" style={{ display: "block", marginTop: 24 }}>← ホーム</Link>
      </div>
    </HashRouter>
  );
}
```

- [ ] **Step 2: Home.tsx を作成**

`src/routes/Home.tsx`:
```tsx
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
```

- [ ] **Step 3: dev起動で表示確認**

Run: `npm run dev`（別ターミナル）→ ブラウザで `http://localhost:5173/worldcafe/` を開く
Expected: ホームに4ボタンが表示。各リンクで遷移できる（子画面はTask8以降で実体化）。

- [ ] **Step 4: コミット**

```bash
git add src/App.tsx src/routes/Home.tsx
git commit -m "feat: HashRouterルーティングとホーム画面"
```

---

## Task 8: QrCodes画面（QR生成）

**Files:**
- Create: `src/routes/QrCodes.tsx`

- [ ] **Step 1: QrCodes.tsx を作成**

`src/routes/QrCodes.tsx`:
```tsx
import { QRCodeCanvas } from "qrcode.react";
import { TABLES, buildCameraUrl } from "../lib/tables";

export default function QrCodes() {
  const baseUrl = window.location.origin + import.meta.env.BASE_URL;
  return (
    <div>
      <h1 className="h1">QRコード生成</h1>
      <p className="muted">各QRを読み取ると、そのテーブルの撮影画面が開きます。<br/>ベース: {baseUrl}</p>
      <div className="grid">
        {TABLES.map((t) => {
          const url = buildCameraUrl(baseUrl, t);
          return (
            <div className="card" key={t} style={{ textAlign: "center" }}>
              <div className="tablehead">テーブル {t}</div>
              <QRCodeCanvas value={url} size={160} includeMargin />
              <div className="muted" style={{ wordBreak: "break-all" }}>{url}</div>
            </div>
          );
        })}
      </div>
      <button className="btn secondary" onClick={() => window.print()}>印刷する</button>
    </div>
  );
}
```

- [ ] **Step 2: 表示確認**

dev起動中に `/#/qrcodes` を開く。
Expected: テーブル分のQRが表示され、URLが `…/worldcafe/#/camera?table=A` 形式。スマホで読むと撮影画面に飛ぶ（撮影画面はTask9で実体化後に確認）。

- [ ] **Step 3: コミット**

```bash
git add src/routes/QrCodes.tsx
git commit -m "feat: QRコード生成画面（印刷対応）"
```

---

## Task 9: Camera画面（撮影/選択・保存）

**Files:**
- Create: `src/routes/Camera.tsx`

- [ ] **Step 1: Camera.tsx を作成**

`src/routes/Camera.tsx`:
```tsx
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
    setPreview(URL.createObjectURL(f));
  }

  async function save() {
    if (!file) return;
    setBusy(true);
    await addPhoto({ table: table!, blob: file, mime: file.type || "image/jpeg", memo });
    setBusy(false);
    setSavedCount((n) => n + 1);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setMemo("");
    if (fileRef.current) fileRef.current.value = "";
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
```

- [ ] **Step 2: 動作確認**

dev起動中に `/#/camera?table=A` を開く → 撮影/選択 → プレビュー → メモ → 保存。PCならファイル選択ダイアログ、スマホ実機ならカメラが起動。
Expected: 保存後にプレビューがクリアされ「保存: N枚」が増える。

- [ ] **Step 3: コミット**

```bash
git add src/routes/Camera.tsx
git commit -m "feat: 撮影画面（input capture方式・テーブル紐づけ保存）"
```

---

## Task 10: Photos画面（一覧・メモ編集・削除）

**Files:**
- Create: `src/routes/Photos.tsx`, `src/components/PhotoCard.tsx`

- [ ] **Step 1: PhotoCard.tsx を作成**

`src/components/PhotoCard.tsx`:
```tsx
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
      <div className="muted">No.{no} ・ {formatDateTime(photo.createdAt)}</div>
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
```

- [ ] **Step 2: Photos.tsx を作成**

`src/routes/Photos.tsx`:
```tsx
import { useCallback, useEffect, useState } from "react";
import { getAllPhotos, type Photo } from "../lib/db";
import { TABLES } from "../lib/tables";
import PhotoCard from "../components/PhotoCard";

export default function Photos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const load = useCallback(async () => setPhotos(await getAllPhotos()), []);
  useEffect(() => { load(); }, [load]);

  const tablesWithPhotos = TABLES.filter((t) => photos.some((p) => p.table === t));

  return (
    <div>
      <h1 className="h1">写真一覧（{photos.length}枚）</h1>
      {tablesWithPhotos.length === 0 && <p className="muted">まだ写真がありません。</p>}
      {tablesWithPhotos.map((t) => {
        const list = photos.filter((p) => p.table === t)
          .sort((a, b) => a.createdAt - b.createdAt);
        return (
          <section key={t}>
            <div className="tablehead">テーブル {t}（{list.length}枚）</div>
            {list.map((p, i) => (
              <PhotoCard key={p.id} photo={p} no={i + 1} onChanged={load} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 動作確認**

`/#/photos` を開く。Task9で保存した写真がテーブル別に表示。メモ編集→フォーカス外しで保存、削除で消える。
Expected: 採番(No)は撮影日時順。削除すると残りが繰り上がる。

- [ ] **Step 4: コミット**

```bash
git add src/routes/Photos.tsx src/components/PhotoCard.tsx
git commit -m "feat: 写真一覧（テーブル別・メモ編集・削除）"
```

---

## Task 11: Export画面（Excel/ZIP出力）

**Files:**
- Create: `src/routes/Export.tsx`

- [ ] **Step 1: Export.tsx を作成**

`src/routes/Export.tsx`:
```tsx
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
```

- [ ] **Step 2: 動作確認**

`/#/export` で件数表示。Excelボタン→xlsxダウンロード（列が テーブル名/写真No/画像名/撮影日時/メモ）。ZIPボタン→`A/A-001.jpg` 等の構造。
Expected: ダウンロードされ、Excelの画像名とZIP内ファイル名が一致。

- [ ] **Step 3: コミット**

```bash
git add src/routes/Export.tsx
git commit -m "feat: Excel/ZIP出力画面"
```

---

## Task 12: ビルド確認 + PWAアイコン

**Files:**
- Create: `public/icons/pwa-192.png`, `public/icons/pwa-512.png`

- [ ] **Step 1: アイコンを用意**

単色の簡易PNGアイコンを2サイズ用意（192/512）。手元に素材がなければ青背景に「WC」の簡易画像で可。`public/icons/` に配置。

- [ ] **Step 2: 本番ビルド**

Run: `npm run build`
Expected: 型エラー0でビルド成功、`dist/` に出力。`dist/manifest.webmanifest` と Service Worker が生成される。

- [ ] **Step 3: ローカルでPWA確認**

Run: `npm run preview` → 表示されたURL（`/worldcafe/`）を開く。
Expected: オフライン化（DevTools→Network→Offline）でも再読込でアプリが起動。

- [ ] **Step 4: コミット**

```bash
git add public/icons
git commit -m "chore: PWAアイコンと本番ビルド確認"
```

---

## Task 13: A〜R 18テーブルへ拡張（Phase2 / 本番）

**Files:**
- Modify: `src/lib/tables.ts:2`

- [ ] **Step 1: tables.test.ts を18テーブル前提に更新**

`src/lib/tables.test.ts` の最初のテストを差し替え:
```ts
  it("A〜Rの18テーブルを持つ", () => {
    expect(TABLES).toHaveLength(18);
    expect(TABLES[0]).toBe("A");
    expect(TABLES[17]).toBe("R");
  });
```

- [ ] **Step 2: TABLES を拡張**

`src/lib/tables.ts` の TABLES 定義を差し替え:
```ts
export const TABLES: string[] = "ABCDEFGHIJKLMNOPQR".split("");
```

- [ ] **Step 3: テスト全実行**

Run: `npm test`
Expected: 全テスト PASS（tables 18テーブル、db、excel、zip）

- [ ] **Step 4: 動作確認 + ビルド**

`/#/qrcodes` でQRが18個表示。`npm run build` 成功。
Expected: QR18個、各撮影画面が `table=A`〜`table=R` で開く。

- [ ] **Step 5: コミット**

```bash
git add src/lib/tables.ts src/lib/tables.test.ts
git commit -m "feat: A〜R 18テーブルへ拡張（本番構成）"
```

---

## Task 14: GitHub Pages 公開（要・ユーザーのGitHubアカウント）

> このタスクはユーザーのGitHub操作が必要。実行者はコマンドを案内し、ユーザーがログイン/リポジトリ作成を行う。リポジトリ名は `worldcafe`（`vite.config.ts` の `base` と一致させること）。

- [ ] **Step 1: GitHub Actions ワークフローを作成**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: package-lock.json をコミット対象に含めて初回コミット確認**

`npm ci` のため `package-lock.json` が必要。`git add package-lock.json` 済みか確認。

- [ ] **Step 3: GitHubリポジトリ作成 & push（ユーザー操作）**

ユーザーがプロンプトで実行（`!` プレフィックス）:
```bash
gh repo create worldcafe --public --source=. --remote=origin --push
```
または GitHub上で空リポジトリ `worldcafe` を作成 → `git remote add origin <URL>` → `git push -u origin main`。

- [ ] **Step 4: Pages設定を有効化**

GitHubリポジトリ → Settings → Pages → Source を「GitHub Actions」に設定。Actionsが完了すると
`https://<ユーザー名>.github.io/worldcafe/` で公開。

- [ ] **Step 5: 2人の実機で最終確認**

公開URLの `/#/qrcodes` を開きQRを表示 → 2台のスマホでそれぞれ別テーブルのQRを読取 → 撮影→保存→出力。
Expected: 各端末で撮影〜Excel/ZIP出力まで動作。ホーム画面に追加（PWAインストール）も可能。

---

## 自己レビュー結果

- **Spec coverage:** PWA(Task1,12)/18テーブル(Task13)/QR生成(Task8)/`?table=`URL(Task2,8)/撮影画面(Task9)/テーブル別IndexedDB保存(Task3,9)/一覧(Task10)/メモ(Task10)/削除(Task10)/Excel列5項目(Task4)/ZIP(Task5)/モバイル優先UI(styles.css)/OCR空実装(Task6)/2人運用・手動結合(Task11の注記+Task14 Step5) — すべて対応タスクあり。
- **実行順の注意:** `excel.ts`/`zip.ts` は `download.ts` を import するため、**Task 6 を Task 4/5 より先に**実施する（Task6冒頭とTask4 Step4に明記）。
- **型整合:** `Photo` 型は db.ts で一元定義し excel/zip/Photos/Export で再利用。`assignPhotoNumbers`/`imageFileName` の名称はタスク間で一致。
