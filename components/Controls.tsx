"use client";

import type { Granularity, NormalizeOptions } from "@/lib/segment";

const GRANULARITY_LABELS: { value: Granularity; label: string }[] = [
  { value: "char", label: "文字" },
  { value: "grapheme", label: "書記素" },
  { value: "word", label: "単語" },
];

const NORMALIZE_LABELS: { key: keyof NormalizeOptions; label: string }[] = [
  { key: "nfkc", label: "NFKC正規化" },
  { key: "ignoreCase", label: "大小無視" },
  { key: "unifyKana", label: "カナ統一" },
  { key: "stripSpaces", label: "空白除去" },
];

interface ControlsProps {
  granularity: Granularity;
  onGranularityChange: (value: Granularity) => void;
  normalizeOptions: NormalizeOptions;
  onNormalizeChange: (options: NormalizeOptions) => void;
  segmenterSupported: boolean;
}

export default function Controls({
  granularity,
  onGranularityChange,
  normalizeOptions,
  onNormalizeChange,
  segmenterSupported,
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="control-group">
        <span className="group-title">比較単位</span>
        <div className="segmented" role="group" aria-label="比較単位">
          {GRANULARITY_LABELS.map(({ value, label }) => {
            const needsSegmenter = value !== "char";
            const disabled = needsSegmenter && !segmenterSupported;
            return (
              <button
                key={value}
                type="button"
                className={granularity === value ? "active" : ""}
                disabled={disabled}
                onClick={() => onGranularityChange(value)}
                title={
                  disabled
                    ? "このブラウザは Intl.Segmenter に未対応です"
                    : undefined
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="control-group">
        <span className="group-title">正規化</span>
        <div className="checks">
          {NORMALIZE_LABELS.map(({ key, label }) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={normalizeOptions[key]}
                onChange={(e) =>
                  onNormalizeChange({
                    ...normalizeOptions,
                    [key]: e.target.checked,
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
