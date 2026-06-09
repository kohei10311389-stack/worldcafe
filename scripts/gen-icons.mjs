// 依存なしでPWAアイコン(PNG)を生成する。青背景に白の「WC」マークを描く。
// Node内蔵の zlib のみ使用。出力: public/icons/pwa-192.png, pwa-512.png
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");

// CRC32
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// 5x7 ドットフォント（W と C のみ）。1=白ピクセル
const GLYPHS = {
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"]
};

function makePng(size) {
  const bg = [37, 99, 235];   // #2563eb
  const fg = [255, 255, 255]; // white
  // ピクセルバッファ(RGB)
  const px = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    px[i * 3] = bg[0]; px[i * 3 + 1] = bg[1]; px[i * 3 + 2] = bg[2];
  }
  // "WC" を中央に描画
  const text = "WC";
  const cols = 5, rows = 7, gap = 1;
  const totalCols = text.length * cols + (text.length - 1) * gap;
  const scale = Math.max(1, Math.floor((size * 0.6) / totalCols));
  const drawW = totalCols * scale;
  const drawH = rows * scale;
  const offX = Math.floor((size - drawW) / 2);
  const offY = Math.floor((size - drawH) / 2);
  text.split("").forEach((ch, ci) => {
    const g = GLYPHS[ch];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (g[r][c] === "1") {
          const baseX = offX + ci * (cols + gap) * scale + c * scale;
          const baseY = offY + r * scale;
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const x = baseX + dx, y = baseY + dy;
              const idx = (y * size + x) * 3;
              px[idx] = fg[0]; px[idx + 1] = fg[1]; px[idx + 2] = fg[2];
            }
          }
        }
      }
    }
  });
  // スキャンライン(フィルタbyte 0 + RGB)
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  const idat = deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))
  ]);
}

mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const png = makePng(size);
  writeFileSync(join(outDir, `pwa-${size}.png`), png);
  console.log(`wrote pwa-${size}.png (${png.length} bytes)`);
}
