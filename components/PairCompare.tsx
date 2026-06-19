"use client";

import { useMemo, useState } from "react";
import Controls from "./Controls";
import {
  levenshteinAlignment,
  normalizedSimilarity,
} from "@/lib/levenshtein";
import {
  defaultNormalizeOptions,
  isSegmenterSupported,
  normalize,
  tokenize,
  type Granularity,
  type NormalizeOptions,
} from "@/lib/segment";

import type { EditOp } from "@/lib/levenshtein";

const OP_LABELS: Record<EditOp["type"], string> = {
  match: "一致",
  substitute: "置換",
  insert: "挿入",
  delete: "削除",
};

const LEGEND_ITEMS: { type: EditOp["type"]; color: string }[] = [
  { type: "match", color: "var(--match)" },
  { type: "substitute", color: "var(--substitute)" },
  { type: "insert", color: "var(--insert)" },
  { type: "delete", color: "var(--delete)" },
];

type ViewMode = "diff" | "align";

/** diff 表示用に 1 つの連続区間を表すセグメント。changed=true で色付け。 */
interface DiffSegment {
  text: string;
  changed: boolean;
}

/**
 * 編集操作列を GitHub PR レビュー風の split diff 用に、A 側(削除前)/ B 側(追加後)の
 * セグメント列へ変換する。隣接する同種トークンは 1 セグメントへまとめる。
 */
function buildDiffSides(ops: EditOp[]): {
  left: DiffSegment[];
  right: DiffSegment[];
} {
  const left: DiffSegment[] = [];
  const right: DiffSegment[] = [];
  const push = (arr: DiffSegment[], text: string, changed: boolean) => {
    const last = arr[arr.length - 1];
    if (last && last.changed === changed) last.text += text;
    else arr.push({ text, changed });
  };
  for (const op of ops) {
    switch (op.type) {
      case "match":
        push(left, op.source ?? "", false);
        push(right, op.target ?? "", false);
        break;
      case "substitute":
        push(left, op.source ?? "", true);
        push(right, op.target ?? "", true);
        break;
      case "delete":
        push(left, op.source ?? "", true);
        break;
      case "insert":
        push(right, op.target ?? "", true);
        break;
    }
  }
  return { left, right };
}

/** 変更区間の空白は不可視になるため、可視マーカー(␣)に置換する。 */
function visualize(text: string, changed: boolean): string {
  return changed ? text.replace(/ /g, "␣") : text;
}

export default function PairCompare() {
  const [textA, setTextA] = useState("東京都渋谷区神宮前");
  const [textB, setTextB] = useState("東京都港区南青山");
  const [granularity, setGranularity] = useState<Granularity>("char");
  const [normalizeOptions, setNormalizeOptions] = useState<NormalizeOptions>(
    defaultNormalizeOptions,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("diff");

  const segmenterSupported = useMemo(() => isSegmenterSupported(), []);

  const result = useMemo(() => {
    const tokensA = tokenize(normalize(textA, normalizeOptions), granularity);
    const tokensB = tokenize(normalize(textB, normalizeOptions), granularity);
    const { distance, ops } = levenshteinAlignment(tokensA, tokensB);
    const similarity = normalizedSimilarity(
      distance,
      tokensA.length,
      tokensB.length,
    );
    const counts = ops.reduce(
      (acc, op) => {
        acc[op.type] += 1;
        return acc;
      },
      { match: 0, substitute: 0, insert: 0, delete: 0 } as Record<
        string,
        number
      >,
    );
    return {
      distance,
      ops,
      similarity,
      lenA: tokensA.length,
      lenB: tokensB.length,
      counts,
      diff: buildDiffSides(ops),
    };
  }, [textA, textB, granularity, normalizeOptions]);

  return (
    <section className="card">
      <h2>ペア比較</h2>
      <p className="card-desc">
        2 つの文字列の Levenshtein 距離・類似度と、A から B へ変換する編集操作を可視化します。
      </p>

      <div className="two-col" style={{ marginBottom: 18 }}>
        <div>
          <label className="field-label" htmlFor="pair-a">
            文字列 A
          </label>
          <textarea
            id="pair-a"
            rows={7}
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="比較したい文字列を入力"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="pair-b">
            文字列 B
          </label>
          <textarea
            id="pair-b"
            rows={7}
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="比較したい文字列を入力"
          />
        </div>
      </div>

      <Controls
        granularity={granularity}
        onGranularityChange={setGranularity}
        normalizeOptions={normalizeOptions}
        onNormalizeChange={setNormalizeOptions}
        segmenterSupported={segmenterSupported}
      />

      <div className="metrics">
        <div className="metric">
          <div className="metric-value">{result.distance}</div>
          <div className="metric-label">Levenshtein 距離</div>
        </div>
        <div className="metric">
          <div className="metric-value">
            {(result.similarity * 100).toFixed(1)}%
          </div>
          <div className="metric-label">類似度</div>
          <div className="sim-bar-track">
            <div
              className="sim-bar-fill"
              style={{ width: `${Math.max(0, result.similarity) * 100}%` }}
            />
          </div>
        </div>
        <div className="metric">
          <div className="metric-value">
            {result.lenA} / {result.lenB}
          </div>
          <div className="metric-label">トークン数 (A / B)</div>
        </div>
      </div>

      <div className="view-switch">
        <label className="field-label">差分の表示</label>
        <div className="segmented" role="group" aria-label="差分の表示">
          <button
            type="button"
            className={viewMode === "diff" ? "active" : ""}
            onClick={() => setViewMode("diff")}
          >
            差分 (Split)
          </button>
          <button
            type="button"
            className={viewMode === "align" ? "active" : ""}
            onClick={() => setViewMode("align")}
          >
            アライメント
          </button>
        </div>
      </div>

      {result.ops.length === 0 ? (
        <div className="empty-hint">文字列を入力してください。</div>
      ) : viewMode === "diff" ? (
        <div className="diff-split">
          <div className="diff-side diff-del">
            <div className="diff-side-head">
              <span className="diff-sign">−</span> 文字列 A(削除前)
            </div>
            <div className="diff-body">
              {result.diff.left.map((seg, i) => (
                <span key={i} className={seg.changed ? "changed" : ""}>
                  {visualize(seg.text, seg.changed)}
                </span>
              ))}
            </div>
          </div>
          <div className="diff-side diff-ins">
            <div className="diff-side-head">
              <span className="diff-sign">＋</span> 文字列 B(追加後)
            </div>
            <div className="diff-body">
              {result.diff.right.map((seg, i) => (
                <span key={i} className={seg.changed ? "changed" : ""}>
                  {visualize(seg.text, seg.changed)}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="alignment">
          {result.ops.map((op, i) => {
            const top =
              op.type === "insert" ? op.target : op.source ?? "";
            const sub =
              op.type === "substitute" ? `→${op.target}` : null;
            return (
              <span
                key={i}
                className={`tok ${op.type}`}
                title={OP_LABELS[op.type]}
              >
                <span>{top === " " ? "␣" : top}</span>
                {sub && <span className="tok-sub">{sub}</span>}
              </span>
            );
          })}
        </div>
      )}

      <div className="legend">
        {LEGEND_ITEMS.map(({ type, color }) =>
          result.counts[type] > 0 ? (
            <span key={type}>
              <i className="swatch" style={{ background: color }} />
              {OP_LABELS[type]} {result.counts[type]}
            </span>
          ) : null,
        )}
      </div>
    </section>
  );
}
