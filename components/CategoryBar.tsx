"use client";

interface CategoryBarProps {
  label: string;
  score: number;
  max?: number;
  delay?: number;
}

export default function CategoryBar({
  label,
  score,
  max = 20,
  delay = 0,
}: CategoryBarProps) {
  const pct = Math.round((score / max) * 100);

  const color =
    pct >= 75
      ? "bg-emerald-500"
      : pct >= 50
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="tabular-nums text-gray-500">
          {score}
          <span className="text-gray-400">/{max}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{
            width: `${pct}%`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}
