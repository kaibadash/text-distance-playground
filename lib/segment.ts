// 文字列を比較トークン列に変換するためのユーティリティ。
// 日本語を扱うため Intl.Segmenter(Segments API)を利用して
// 書記素(grapheme)・単語(word)単位の分割をサポートする。

export type Granularity = "char" | "grapheme" | "word";

export interface NormalizeOptions {
  /** NFKC 正規化(全角英数や互換文字を統一)。 */
  nfkc: boolean;
  /** 大文字小文字を無視する(英字を小文字化)。 */
  ignoreCase: boolean;
  /** ひらがな・カタカナを統一する(カタカナ→ひらがな)。 */
  unifyKana: boolean;
  /** 空白文字を除去する。 */
  stripSpaces: boolean;
}

export const defaultNormalizeOptions: NormalizeOptions = {
  nfkc: false,
  ignoreCase: false,
  unifyKana: false,
  stripSpaces: false,
};

/** カタカナをひらがなに変換する(全角カタカナの範囲 U+30A1〜U+30F6)。 */
function katakanaToHiragana(input: string): string {
  return input.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  );
}

/** 正規化オプションを適用した文字列を返す。 */
export function normalize(input: string, options: NormalizeOptions): string {
  let result = input;
  if (options.nfkc) {
    result = result.normalize("NFKC");
  }
  if (options.unifyKana) {
    result = katakanaToHiragana(result);
  }
  if (options.ignoreCase) {
    result = result.toLowerCase();
  }
  if (options.stripSpaces) {
    result = result.replace(/\s+/g, "");
  }
  return result;
}

let graphemeSegmenter: Intl.Segmenter | null = null;
let wordSegmenter: Intl.Segmenter | null = null;

/** Intl.Segmenter が利用可能か。 */
export function isSegmenterSupported(): boolean {
  return typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";
}

/**
 * 文字列を指定した粒度のトークン列に分割する。
 * - char: コードポイント単位(サロゲートペアを 1 文字として扱う)
 * - grapheme: Intl.Segmenter による書記素クラスタ単位
 * - word: Intl.Segmenter による単語単位(日本語の分かち書き)
 */
export function tokenize(input: string, granularity: Granularity): string[] {
  if (input.length === 0) {
    return [];
  }

  switch (granularity) {
    case "char":
      // スプレッドはサロゲートペアを 1 要素にまとめてくれる。
      return [...input];

    case "grapheme": {
      if (!isSegmenterSupported()) {
        return [...input];
      }
      if (!graphemeSegmenter) {
        graphemeSegmenter = new Intl.Segmenter("ja", {
          granularity: "grapheme",
        });
      }
      return Array.from(graphemeSegmenter.segment(input), (s) => s.segment);
    }

    case "word": {
      if (!isSegmenterSupported()) {
        return [...input];
      }
      if (!wordSegmenter) {
        wordSegmenter = new Intl.Segmenter("ja", { granularity: "word" });
      }
      const tokens: string[] = [];
      for (const seg of wordSegmenter.segment(input)) {
        // 単語境界に含まれる空白のみのセグメントは除外する。
        if (seg.isWordLike || seg.segment.trim().length > 0) {
          tokens.push(seg.segment);
        }
      }
      return tokens;
    }

    default:
      return [...input];
  }
}
