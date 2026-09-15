import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, scrapeCompanySite } from "@/lib/scrape";
import { searchCompanyContext } from "@/lib/websearch";
import { analyzeCompany } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const url = (body as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "企業のURLを入力してください" }, { status: 400 });
  }

  try {
    normalizeUrl(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "URLの形式が不正です";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const scrape = await scrapeCompanySite(url);
    const webSnippets = await searchCompanyContext(scrape.companyNameGuess);
    const report = await analyzeCompany(scrape, webSnippets);
    return NextResponse.json({ report, warnings: scrape.warnings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラーが発生しました";
    const status = message.includes("GEMINI_API_KEY") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
