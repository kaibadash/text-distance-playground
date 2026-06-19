import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Next.js 16 で `next lint` が廃止され ESLint CLI 直叩きに移行した。
// eslint-config-next 16 は Flat Config 配列を直接エクスポートするため、
// FlatCompat を介さずそのまま展開する。
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
];

export default eslintConfig;
