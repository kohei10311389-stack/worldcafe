import { Link } from "react-router-dom";
import {
  GROUP_A_TABLES,
  GROUP_B_TABLES,
  THEMES_A,
  THEMES_B,
  type Theme,
} from "../lib/themes";

type Props = {
  /** 表示するテーブル（呼び出し側で絞り込み済み） */
  tables: string[];
  /** テーブルごとのリンク先 */
  hrefFor: (table: string) => string;
  /** テーブルごとの枚数（任意。指定するとボタンに「（N枚）」を表示） */
  countFor?: (table: string) => number;
};

type GroupDef = {
  key: "A" | "B";
  label: string;
  tables: string[];
  themes: Theme[];
  cls: string;
};

const GROUPS: GroupDef[] = [
  { key: "A", label: "Aグループ", tables: GROUP_A_TABLES, themes: THEMES_A, cls: "group-a" },
  { key: "B", label: "Bグループ", tables: GROUP_B_TABLES, themes: THEMES_B, cls: "group-b" },
];

/**
 * テーブル選択UI。AグループとBグループにセクション分割し、
 * グループごとに色分け＋バッジを付けて見分けやすくする。
 * 撮影画面・写真一覧の両方で共有する。
 */
export default function TablePicker({ tables, hrefFor, countFor }: Props) {
  return (
    <>
      {GROUPS.map((g) => {
        const show = g.tables.filter((t) => tables.includes(t));
        if (show.length === 0) return null;
        const hint = `${g.themes[0].title} ほか・全${g.themes.length}テーマ`;
        return (
          <section key={g.key}>
            <div className={`tablehead ${g.cls}`}>
              {g.label}
              <span className="group-hint">（{hint}）</span>
            </div>
            <div className="grid">
              {show.map((t) => (
                <Link key={t} className={`btn ${g.cls}`} to={hrefFor(t)}>
                  <span className="tbadge">{g.key}</span>テーブル {t}
                  {countFor ? `（${countFor(t)}枚）` : null}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
