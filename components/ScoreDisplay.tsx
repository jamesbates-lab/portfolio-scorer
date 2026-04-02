"use client";

import { useEffect, useState } from "react";
import type { ScoreResult } from "@/types";
import CategoryBar from "./CategoryBar";

interface ScoreDisplayProps {
  result: ScoreResult;
  inputLabel: string;
  isNew?: boolean;
}

const RECOMMENDATION_CONFIG = {
  hire: {
    label: "Strong Hire",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  maybe: {
    label: "Maybe",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  pass: {
    label: "Pass",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-400",
  },
};

const CATEGORY_LABELS: Record<
  keyof ScoreResult["categories"],
  string
> = {
  visual_design: "Visual Design",
  ux_thinking: "UX Thinking",
  case_studies: "Case Study Depth",
  product_sense: "Product Thinking",
  communication: "Communication Clarity",
};

export default function ScoreDisplay({
  result,
  inputLabel,
  isNew = false,
}: ScoreDisplayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay to allow animation to trigger
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const rec = RECOMMENDATION_CONFIG[result.recommendation];
  const scoreColor =
    result.overall_score >= 70
      ? "text-emerald-600"
      : result.overall_score >= 50
      ? "text-amber-500"
      : "text-red-500";

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-500 ${
        isNew
          ? visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
          : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-50 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
            Portfolio Evaluated
          </p>
          <p className="text-sm text-gray-600 truncate" title={inputLabel}>
            {inputLabel}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${rec.bg} ${rec.border} ${rec.text}`}
        >
          <span className={`w-2 h-2 rounded-full ${rec.dot}`} />
          {rec.label}
        </div>
      </div>

      {/* Score + Categories */}
      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center min-w-[120px]">
          <div className={`text-7xl font-bold tabular-nums ${scoreColor}`}>
            {result.overall_score}
          </div>
          <div className="text-xs text-gray-400 mt-1 font-medium tracking-wide">
            OUT OF 100
          </div>
        </div>

        {/* Category Bars */}
        <div className="space-y-4">
          {(
            Object.entries(result.categories) as Array<
              [keyof ScoreResult["categories"], number]
            >
          ).map(([key, val], i) => (
            <CategoryBar
              key={key}
              label={CATEGORY_LABELS[key]}
              score={val}
              max={20}
              delay={i * 80}
            />
          ))}
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2.5">
            Strengths
          </h4>
          <ul className="space-y-1.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2.5">
            Weaknesses
          </h4>
          <ul className="space-y-1.5">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Recruiter Summary
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {result.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
