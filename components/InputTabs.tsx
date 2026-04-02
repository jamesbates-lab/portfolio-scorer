"use client";

import { useRef, useState } from "react";
import type { InputType } from "@/types";

interface InputTabsProps {
  onSubmit: (data: FormData | { url: string } | { figmaUrl: string }) => void;
  loading: boolean;
}

const TABS: { id: InputType; label: string; icon: string }[] = [
  { id: "pdf", label: "Upload PDF", icon: "↑" },
  { id: "url", label: "Portfolio URL", icon: "⌘" },
  { id: "figma", label: "Figma Link", icon: "◈" },
];

export default function InputTabs({ onSubmit, loading }: InputTabsProps) {
  const [activeTab, setActiveTab] = useState<InputType>("url");
  const [urlValue, setUrlValue] = useState("");
  const [figmaValue, setFigmaValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (activeTab === "pdf") {
      if (!selectedFile) return;
      const fd = new FormData();
      fd.append("file", selectedFile);
      onSubmit(fd);
    } else if (activeTab === "url") {
      const trimmed = urlValue.trim();
      if (!trimmed) return;
      onSubmit({ url: trimmed });
    } else {
      const trimmed = figmaValue.trim();
      if (!trimmed) return;
      onSubmit({ figmaUrl: trimmed });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      setSelectedFile(file);
    }
  };

  const canSubmit = () => {
    if (loading) return false;
    if (activeTab === "pdf") return !!selectedFile;
    if (activeTab === "url") return urlValue.trim().length > 0;
    return figmaValue.trim().length > 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">
              {tab.id === "pdf"
                ? "PDF"
                : tab.id === "url"
                ? "URL"
                : "Figma"}
            </span>
          </button>
        ))}
      </div>

      {/* Input area */}
      {activeTab === "pdf" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-colors ${
            dragOver
              ? "border-gray-400 bg-gray-50"
              : selectedFile
              ? "border-emerald-300 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          {selectedFile ? (
            <>
              <div className="text-2xl">📄</div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <div className="text-3xl text-gray-300">↑</div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Drop PDF here or click to upload
                </p>
                <p className="text-xs text-gray-400 mt-1">Max 10 MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "url" && (
        <div className="relative">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://yourportfolio.com"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      {activeTab === "figma" && (
        <div className="relative">
          <input
            type="url"
            value={figmaValue}
            onChange={(e) => setFigmaValue(e.target.value)}
            placeholder="https://www.figma.com/file/..."
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 mt-2 px-1">
            The file must be publicly accessible or your Figma API key must have
            access.
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit()}
        className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
          canSubmit()
            ? "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.99]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Reviewing portfolio…
          </span>
        ) : (
          "Score Portfolio"
        )}
      </button>
    </form>
  );
}
