// 各テーブルはAグループ/Bグループのいずれかに属し、グループごとに5つのトークテーマを持つ。
export interface Theme {
  title: string;    // 黒枠内の見出し（選択ボタンに表示・Excelに記録）
  subtitle: string; // 右側の文化名（補足表示用）
}

export const GROUP_A_TABLES = ["A", "B", "F", "G", "H", "K", "L", "P", "Q"];
export const GROUP_B_TABLES = ["D", "E", "I", "J", "M", "N", "O", "R", "S"];

export const THEMES_A: Theme[] = [
  { title: "トライ精神", subtitle: "まずはやってみる文化" },
  { title: "教育・継承を重視（サクセッション）", subtitle: "未来につなぐ文化" },
  { title: "多様性", subtitle: "尖りを歓迎する文化" },
  { title: "Win Win", subtitle: "関係性で価値を高める文化" },
  { title: "社会的に意義のあることを選ぶ", subtitle: "価値で選ぶ文化" }
];

export const THEMES_B: Theme[] = [
  { title: "成長機会が多い", subtitle: "任されることで成長する文化" },
  { title: "まず信用！人の可能性を最大限に信じる", subtitle: "任せて伸ばす文化" },
  { title: "活躍するほど環境を選べる", subtitle: "働き方が広がる文化" },
  { title: "リスペクト文化", subtitle: "違いを力に変える文化" },
  { title: "短期的な利益を追わない", subtitle: "長期で価値を生む文化" }
];

export function themesForTable(table: string): Theme[] {
  if (GROUP_A_TABLES.includes(table)) return THEMES_A;
  if (GROUP_B_TABLES.includes(table)) return THEMES_B;
  return [];
}
