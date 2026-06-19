// k-近傍法(KNN)による最近傍文字列探索。
// 候補リストの各文字列とクエリの距離を計算し、近い順に並べる。

import {
  levenshteinDistance,
  normalizedSimilarity,
} from "./levenshtein";
import { normalize, tokenize, type Granularity, type NormalizeOptions } from "./segment";

export type DistanceMetric = "levenshtein" | "normalized";

export interface KnnNeighbor {
  /** 候補リスト内での元の行番号(0 始まり)。 */
  index: number;
  /** 元の(正規化前の)文字列。 */
  text: string;
  /** Levenshtein 距離(トークン単位)。 */
  distance: number;
  /** 正規化類似度(0〜1)。 */
  similarity: number;
}

export interface KnnOptions {
  granularity: Granularity;
  normalizeOptions: NormalizeOptions;
  metric: DistanceMetric;
  k: number;
}

/**
 * 候補配列に対してクエリの k-近傍を返す。
 * metric が "normalized" の場合は類似度の高い順、
 * "levenshtein" の場合は距離の小さい順に並べる。
 */
export function knnSearch(
  query: string,
  candidates: string[],
  options: KnnOptions,
): KnnNeighbor[] {
  const { granularity, normalizeOptions, metric, k } = options;

  const queryTokens = tokenize(normalize(query, normalizeOptions), granularity);

  const neighbors: KnnNeighbor[] = candidates.map((text, index) => {
    const tokens = tokenize(normalize(text, normalizeOptions), granularity);
    const distance = levenshteinDistance(queryTokens, tokens);
    const similarity = normalizedSimilarity(
      distance,
      queryTokens.length,
      tokens.length,
    );
    return { index, text, distance, similarity };
  });

  neighbors.sort((x, y) => {
    if (metric === "normalized") {
      // 類似度の降順。同点は距離の昇順 → 元の順序で安定化。
      if (y.similarity !== x.similarity) return y.similarity - x.similarity;
      if (x.distance !== y.distance) return x.distance - y.distance;
      return x.index - y.index;
    }
    if (x.distance !== y.distance) return x.distance - y.distance;
    return x.index - y.index;
  });

  return neighbors.slice(0, Math.max(0, k));
}
