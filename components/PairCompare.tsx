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

const OP_LABELS: Record<string, string> = {
  match: "一致",
  substitute: "置換",
  insert: "挿入",
  delete: "削除",
};

export default function PairCompare() {
  const [textA, setTextA] = useState("東京都渋谷区神宮前");
  const [textB, setTextB] = useState("東京都港区南青山");
  const [granularity, setGranularity] = useState<Granularity>("char");
  const [normalizeOptions, setNormalizeOptions] = useState<NormalizeOptions>(
    defaultNormalizeOptions,
  );

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
            rows={4}
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
            rows={4}
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

      <label className="field-label">編集操作のアライメント</label>
      {result.ops.length === 0 ? (
        <div className="empty-hint">文字列を入力してください。</div>
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
        <span>
          <i className="swatch" style={{ background: "var(--match)" }} />
          一致 {result.counts.match}
        </span>
        <span>
          <i
            className="swatch"
            style={{ background: "var(--substitute)" }}
          />
          置換 {result.counts.substitute}
        </span>
        <span>
          <i className="swatch" style={{ background: "var(--insert)" }} />
          挿入 {result.counts.insert}
        </span>
        <span>
          <i className="swatch" style={{ background: "var(--delete)" }} />
          削除 {result.counts.delete}
        </span>
      </div>
    </section>
  );
}
