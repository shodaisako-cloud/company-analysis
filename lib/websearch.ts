import type { WebSnippet } from "./types";

const SEARCH_TIMEOUT_MS = 6000;
const RESULTS_PER_QUERY = 4;

// Google Programmable Search Engine (Custom Search JSON API) は1日100クエリまで無料。
// APIキー/検索エンジンIDが未設定の場合は検索をスキップし、公式サイト情報のみで分析する。
export function isWebSearchConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX);
}

async function searchWeb(query: string): Promise<WebSnippet[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return [];

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(RESULTS_PER_QUERY));
  url.searchParams.set("hl", "ja");
  url.searchParams.set("gl", "jp");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: { title?: string; link?: string; snippet?: string }[];
    };
    return (data.items ?? [])
      .filter((item) => item.title && item.link)
      .map((item) => ({
        title: item.title!,
        url: item.link!,
        snippet: item.snippet ?? "",
        query,
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// 就活の企業分析で公式サイトだけでは分かりにくい項目を補うための検索クエリ
function buildQueries(companyName: string): string[] {
  return [
    `${companyName} 決算 業績 推移`,
    `${companyName} 競合 OR 同業他社 比較`,
    `${companyName} ニュース 最新`,
    `${companyName} 口コミ OR 評判 OR 社員`,
    `${companyName} 訴訟 OR 不祥事 OR リスク`,
  ];
}

export async function searchCompanyContext(companyName: string): Promise<WebSnippet[]> {
  if (!isWebSearchConfigured() || !companyName.trim()) return [];

  const queries = buildQueries(companyName);
  const results = await Promise.all(queries.map((q) => searchWeb(q)));

  const seen = new Set<string>();
  const merged: WebSnippet[] = [];
  for (const list of results) {
    for (const item of list) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      merged.push(item);
    }
  }
  return merged;
}
