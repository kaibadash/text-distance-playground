# 文字列類似度テスター (Levenshtein & KNN)

2 つの文字列がどれくらい近いかを、ブラウザ内だけで比較するツールです。サーバへの送信は一切ありません。

## 機能

- **ペア比較**: 2 つの文字列の Levenshtein 距離・類似度、A→B の編集操作(一致 / 置換 / 挿入 / 削除)を色分けで可視化。
- **KNN 近傍探索**: 候補リスト(1 行 1 件)からクエリに最も近い上位 k 件を距離 / 類似度でランキング。
- **日本語対応**: `Intl.Segmenter`(Segments API)で **文字 / 書記素 / 単語** 単位の比較を切り替え可能。
- **正規化オプション**: NFKC 正規化・大小無視・ひらがな/カタカナ統一・空白除去。

## 開発

```bash
npm install
npm run dev      # http://localhost:5959
npm run typecheck
npm run lint
npm run build    # out/ に静的エクスポート
```
