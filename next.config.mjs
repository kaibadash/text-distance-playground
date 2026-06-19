/** @type {import('next').NextConfig} */

// GitHub Pages のプロジェクトページ配下に置くため basePath を環境変数で注入する。
// CI(GitHub Actions)では `/<repository-name>` を渡す。ローカル開発時は空文字。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig = {
  output: "export",
  basePath,
  // 静的エクスポートでは next/image の最適化サーバが使えないため無効化する。
  images: { unoptimized: true },
  // GitHub Pages は末尾スラッシュのディレクトリ構成と相性が良い。
  trailingSlash: true,
};

export default nextConfig;
