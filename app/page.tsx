"use client";

import { useState } from "react";
import ReportView from "@/components/ReportView";
import type { AnalysisReport } from "@/lib/types";

type LoadState = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || state === "loading") return;

    setState("loading");
    setErrorMessage("");
    setReport(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "分析に失敗しました");
      }

      setReport(data.report as AnalysisReport);
      setWarnings(data.warnings ?? []);
      setState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "不明なエラーが発生しました");
      setState("error");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          企業分析AI
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          企業の公式サイトURLを貼るだけで、就活向けの企業分析レポートをAIが自動生成します。
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          inputMode="url"
          placeholder="https://www.example.co.jp"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-brand-400 focus:ring-2"
        />
        <button
          type="submit"
          disabled={state === "loading" || !url.trim()}
          className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "loading" ? "分析中..." : "分析する"}
        </button>
      </form>

      {state === "loading" && (
        <div className="mt-8 flex flex-col items-center gap-3 text-sm text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
          <p>企業サイトを読み込み、AIが分析しています（数十秒かかることがあります）</p>
        </div>
      )}

      {state === "error" && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {state === "success" && warnings.length > 0 && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          {warnings.join(" / ")}
        </div>
      )}

      {state === "success" && report && (
        <div className="mt-8">
          <ReportView report={report} />
        </div>
      )}

      {state === "idle" && (
        <p className="mt-10 text-center text-xs text-slate-400">
          ※ 分析はAIが企業公式サイトの公開情報のみをもとに生成します。内容は参考情報として活用し、最終判断はご自身で確認のうえ行ってください。
        </p>
      )}
    </main>
  );
}
