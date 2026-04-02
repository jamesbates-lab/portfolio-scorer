"use client";

import { useState, useEffect, useCallback } from "react";
import InputTabs from "@/components/InputTabs";
import ScoreDisplay from "@/components/ScoreDisplay";
import HistoryPanel from "@/components/HistoryPanel";
import type { ScoreResult, HistoryEntry, InputType } from "@/types";

const HISTORY_KEY = "portfolio_scorer_history";
const MAX_HISTORY = 5;

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage errors
  }
}

interface CurrentResult {
  result: ScoreResult;
  inputLabel: string;
  isNew: boolean;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<CurrentResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleSubmit = useCallback(
    async (data: FormData | { url: string } | { figmaUrl: string }) => {
      setLoading(true);
      setError(null);

      let inputType: InputType;
      let fetchInit: RequestInit;

      if (data instanceof FormData) {
        inputType = "pdf";
        fetchInit = { method: "POST", body: data };
      } else if ("figmaUrl" in data) {
        inputType = "figma";
        fetchInit = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        };
      } else {
        inputType = "url";
        fetchInit = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        };
      }

      try {
        const res = await fetch("/api/score", fetchInit);
        const json = await res.json();

        if (!res.ok || json.error) {
          setError(json.error ?? "An unexpected error occurred.");
          return;
        }

        const { result, inputLabel } = json as {
          result: ScoreResult;
          inputLabel: string;
        };

        setCurrent({ result, inputLabel, isNew: true });

        // Save to history
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          inputType,
          inputLabel,
          result,
        };

        setHistory((prev) => {
          const updated = [entry, ...prev].slice(0, MAX_HISTORY);
          saveHistory(updated);
          return updated;
        });
      } catch {
        setError(
          "Network error. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setCurrent({ result: entry.result, inputLabel: entry.inputLabel, isNew: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Portfolio Scorer
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            AI-powered design portfolio evaluation for recruiters
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <InputTabs onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-fade-in">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8 animate-fade-in">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Reviewing portfolio…</p>
            <p className="text-xs text-gray-400">This usually takes 10–20 seconds</p>
          </div>
        )}

        {/* Result */}
        {current && !loading && (
          <ScoreDisplay
            result={current.result}
            inputLabel={current.inputLabel}
            isNew={current.isNew}
          />
        )}

        {/* History */}
        {!loading && (
          <HistoryPanel
            entries={history.filter(
              (e) => e.inputLabel !== current?.inputLabel
            )}
            onSelect={handleHistorySelect}
            onClear={handleClearHistory}
          />
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs text-gray-400">
            Powered by Claude · For internal recruiter use
          </p>
        </div>
      </div>
    </div>
  );
}
