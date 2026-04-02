"use client";

import type { HistoryEntry } from "@/types";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const REC_STYLES = {
  hire: "bg-emerald-100 text-emerald-700",
  maybe: "bg-amber-100 text-amber-700",
  pass: "bg-red-100 text-red-600",
};

const REC_LABELS = {
  hire: "Hire",
  maybe: "Maybe",
  pass: "Pass",
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPanel({
  entries,
  onSelect,
  onClear,
}: HistoryPanelProps) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Recent Evaluations
        </h2>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear history
        </button>
      </div>
      <div className="space-y-2">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            className="w-full text-left bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900"
                  title={entry.inputLabel}
                >
                  {entry.inputLabel}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(entry.timestamp)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-gray-700 tabular-nums">
                  {entry.result.overall_score}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    REC_STYLES[entry.result.recommendation]
                  }`}
                >
                  {REC_LABELS[entry.result.recommendation]}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
