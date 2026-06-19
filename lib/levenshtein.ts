// Levenshtein 距離(編集距離)の計算と編集操作の復元。
// トークン列(文字・書記素・単語のいずれか)に対して動作する汎用実装。

export type EditOpType = "match" | "substitute" | "insert" | "delete";

export interface EditOp {
  type: EditOpType;
  /** ソース(a)側のトークン。insert の場合は null。 */
  source: string | null;
  /** ターゲット(b)側のトークン。delete の場合は null。 */
  target: string | null;
}

/**
 * 2 つのトークン列間の Levenshtein 距離を計算する。
 * 距離のみが必要な場合はこちらが省メモリ(O(min(n,m)) 空間)。
 */
export function levenshteinDistance(a: string[], b: string[]): number {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;

  // 短い方を内側ループにして 1 次元配列で計算する。
  let prev = new Array<number>(m + 1);
  let curr = new Array<number>(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // 削除
        curr[j - 1] + 1, // 挿入
        prev[j - 1] + cost, // 置換 or 一致
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[m];
}

export interface AlignmentResult {
  distance: number;
  ops: EditOp[];
}

/**
 * Levenshtein 距離と編集操作の並び(アライメント)を返す。
 * 可視化のために全 DP テーブルを保持する(O(n*m) 空間)。
 */
export function levenshteinAlignment(
  a: string[],
  b: string[],
): AlignmentResult {
  const n = a.length;
  const m = b.length;

  // dp[i][j] = a[0..i) と b[0..j) の編集距離
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  // 終点から経路を逆順に復元する。
  const ops: EditOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      if (dp[i][j] === dp[i - 1][j - 1] + cost) {
        ops.push({
          type: cost === 0 ? "match" : "substitute",
          source: a[i - 1],
          target: b[j - 1],
        });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // a 側にしかない = b へ変換するには削除
      ops.push({ type: "delete", source: a[i - 1], target: null });
      i--;
      continue;
    }
    // b 側にしかない = b へ変換するには挿入
    ops.push({ type: "insert", source: null, target: b[j - 1] });
    j--;
  }

  ops.reverse();
  return { distance: dp[n][m], ops };
}

/**
 * 正規化類似度を返す(0〜1、1 が完全一致)。
 * distance / max(len(a), len(b)) を 1 から引いた値。
 */
export function normalizedSimilarity(
  distance: number,
  aLength: number,
  bLength: number,
): number {
  const maxLen = Math.max(aLength, bLength);
  if (maxLen === 0) return 1;
  return 1 - distance / maxLen;
}
