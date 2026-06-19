import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "文字列類似度テスター | Levenshtein & KNN",
  description:
    "2 つの文字列の Levenshtein 距離・編集操作・KNN を日本語対応(Intl.Segmenter)でブラウザ上だけで比較できるツール。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
