"use client";

import { useMemo, useState } from "react";
import Controls from "./Controls";
import { knnSearch, type DistanceMetric } from "@/lib/knn";
import {
  defaultNormalizeOptions,
  isSegmenterSupported,
  type Granularity,
  type NormalizeOptions,
} from "@/lib/segment";

const DEFAULT_CANDIDATES = [
  "東京都渋谷区神宮前",
  "東京都港区南青山",
  "東京都新宿区西新宿",
  "東京都渋谷区道玄坂",
  "大阪府大阪市北区梅田",
  "神奈川県横浜市西区みなとみらい",
  "東京都渋谷区神南",
  "東京都千代田区丸の内",
].join("\n");

export default function KnnPanel() {
  const [query, setQuery] = useState("東京都渋谷区神宮");
  const [candidatesText, setCandidatesText] = useState(DEFAULT_CANDIDATES);
  const [granularity, setGranularity] = useState<Granularity>("char");
  const [normalizeOptions, setNormalizeOptions] = useState<NormalizeOptions>(
    defaultNormalizeOptions,
  );
  const [metric, setMetric] = useState<DistanceMetric>("normalized");
  const [k, setK] = useState(5);

  const segmenterSupported = useMemo(() => isSegmenterSupported(), []);

  const candidates = useMemo(
    () =>
      candidatesText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [candidatesText],
  );

  const neighbors = useMemo(() => {
    if (query.trim().length === 0 || candidates.length === 0) {
      return [];
    }
    return knnSearch(query, candidates, {
      granularity,
      normalizeOptions,
      metric,
      k,
    });
  }, [query, candidates, granularity, normalizeOptions, metric, k]);

  return (
    <section className="card">
      <h2>KNN 近傍探索</h2>
      <p className="card-desc">
        候補リスト(1 行 1 件)からクエリに最も近い上位 k 件を Levenshtein 距離で探索します。
      </p>

      <div className="two-col" style={{ marginBottom: 18 }}>
        <div>
          <label className="field-label" htmlFor="knn-query">
            クエリ
          </label>
          <textarea
            id="knn-query"
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索したい文字列"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="knn-candidates">
            候補リスト(1 行 1 件)
          </label>
          <textarea
            id="knn-candidates"
            rows={8}
            value={candidatesText}
            onChange={(e) => setCandidatesText(e.target.value)}
            placeholder="候補を改行区切りで入力"
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

      <div className="controls">
        <div className="control-group">
          <span className="group-title">並び替え指標</span>
          <div className="segmented" role="group" aria-label="並び替え指標">
            <button
              type="button"
              className={metric === "normalized" ? "active" : ""}
              onClick={() => setMetric("normalized")}
            >
              類似度
            </button>
            <button
              type="button"
              className={metric === "levenshtein" ? "active" : ""}
              onClick={() => setMetric("levenshtein")}
            >
              距離
            </button>
          </div>
        </div>
        <div className="control-group">
          <span className="group-title">k(件数)</span>
          <input
            className="number-input"
            type="number"
            min={1}
            max={Math.max(1, candidates.length)}
            value={k}
            onChange={(e) =>
              setK(Math.max(1, Number(e.target.value) || 1))
            }
          />
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="empty-hint">候補リストを入力してください。</div>
      ) : neighbors.length === 0 ? (
        <div className="empty-hint">クエリを入力してください。</div>
      ) : (
        <table className="knn-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>順位</th>
              <th>候補</th>
              <th style={{ width: 90 }} className="num">
                距離
              </th>
              <th style={{ width: 100 }} className="num">
                類似度
              </th>
            </tr>
          </thead>
          <tbody>
            {neighbors.map((n, i) => (
              <tr key={n.index}>
                <td>
                  <span className="rank-badge">{i + 1}</span>
                </td>
                <td>{n.text}</td>
                <td className="num">{n.distance}</td>
                <td className="num">{(n.similarity * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
