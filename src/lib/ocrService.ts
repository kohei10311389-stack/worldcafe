export interface OcrResult { text: string; }

/**
 * 将来: ローカルOCR(例 Tesseract.js / 無料・API不要)をここに実装する。
 * 現状は未実装で、常に空文字を返すスタブ。
 */
export async function recognize(_blob: Blob): Promise<OcrResult> {
  return { text: "" };
}
