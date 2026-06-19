import PairCompare from "@/components/PairCompare";
import KnnPanel from "@/components/KnnPanel";

export default function Home() {
  return (
    <main className="container">
      <header className="page-header">
        <h1>文字列類似度テスター</h1>
        <p>
          Levenshtein 距離と KNN で 2 つの文字列の近さを比較します。日本語は
          Intl.Segmenter(Segments API)で書記素・単語単位の比較に対応。すべてブラウザ内で完結します。
        </p>
      </header>

      <PairCompare />
      <KnnPanel />

      <footer className="page-footer">
        <p>
          <a href="https://github.com/kaibadash/text-distance-playground">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
