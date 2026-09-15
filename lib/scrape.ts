import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";
import type { ScrapedPage, ScrapeResult } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; CompanyAnalysisBot/1.0; +https://example.com/bot)";
const FETCH_TIMEOUT_MS = 8000;
const MAX_SUBPAGES = 5;
const MAX_TEXT_PER_PAGE = 6000;

// 就活の観点で優先的に読みたいページのカテゴリとキーワード
const CATEGORY_KEYWORDS: { category: string; label: string; patterns: RegExp[] }[] = [
  {
    category: "about",
    label: "会社概要",
    patterns: [/about/i, /company/i, /会社概要/, /企業情報/, /会社案内/],
  },
  {
    category: "philosophy",
    label: "経営理念・ミッション",
    patterns: [/philosophy/i, /mission/i, /vision/i, /value/i, /理念/, /ミッション/, /ビジョン/],
  },
  {
    category: "business",
    label: "事業内容",
    patterns: [/business/i, /service/i, /product/i, /事業内容/, /事業紹介/, /サービス/],
  },
  {
    category: "recruit",
    label: "採用情報",
    patterns: [/recruit/i, /career/i, /job/i, /採用/, /キャリア/, /求人/],
  },
  {
    category: "news",
    label: "ニュース・IR",
    patterns: [/news/i, /press/i, /\bir\b/i, /investor/i, /ニュース/, /プレスリリース/, /IR情報/],
  },
  {
    category: "history",
    label: "沿革",
    patterns: [/history/i, /沿革/],
  },
];

function isPublicIp(ip: string): boolean {
  if (net.isIP(ip) === 0) return false;
  if (ip === "0.0.0.0") return false;

  // IPv4 private / loopback / link-local / CGNAT ranges
  const v4 = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1] ?? ip;
  if (net.isIPv4(v4)) {
    const parts = v4.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
    if (a === 0) return false;
    return true;
  }

  // IPv6 loopback / link-local / unique-local
  const lower = ip.toLowerCase();
  if (lower === "::1") return false;
  if (lower.startsWith("fe80:")) return false;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return false;
  return true;
}

async function assertPublicHost(hostname: string) {
  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0) {
    throw new Error("ホスト名を解決できませんでした");
  }
  for (const { address } of records) {
    if (!isPublicIp(address)) {
      throw new Error("プライベート/ローカルアドレスへのアクセスは許可されていません");
    }
  }
}

export function normalizeUrl(input: string): URL {
  let raw = input.trim();
  if (/^https?:\/\//i.test(raw)) {
    // すでにhttp(s)スキームあり
  } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    // http/https以外の明示的なスキーム（ftp:// 等）はそのまま拒否させる
  } else {
    raw = `https://${raw}`;
  }
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("http/https のURLのみ対応しています");
  }
  return url;
}

async function safeFetch(url: URL): Promise<Response> {
  await assertPublicHost(url.hostname);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function extractText($: cheerio.CheerioAPI): string {
  $("script, style, noscript, svg, iframe, template").remove();
  const text = $("body").text();
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .slice(0, MAX_TEXT_PER_PAGE);
}

function findCategorizedLinks(
  $: cheerio.CheerioAPI,
  base: URL
): { url: string; category: string; label: string }[] {
  const found: { url: string; category: string; label: string }[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const linkText = $(el).text();
    if (!href) return;
    let resolved: URL;
    try {
      resolved = new URL(href, base);
    } catch {
      return;
    }
    if (resolved.hostname !== base.hostname) return;
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;
    resolved.hash = "";
    const key = resolved.toString();
    if (seen.has(key) || key === base.toString()) return;

    const haystack = `${resolved.pathname} ${linkText}`;
    for (const { category, label, patterns } of CATEGORY_KEYWORDS) {
      if (patterns.some((p) => p.test(haystack))) {
        seen.add(key);
        found.push({ url: key, category, label });
        break;
      }
    }
  });

  return found;
}

export async function scrapeCompanySite(inputUrl: string): Promise<ScrapeResult> {
  const rootUrl = normalizeUrl(inputUrl);
  const warnings: string[] = [];

  const rootRes = await safeFetch(rootUrl);
  if (!rootRes.ok) {
    throw new Error(`トップページの取得に失敗しました (HTTP ${rootRes.status})`);
  }
  const rootHtml = await rootRes.text();
  const $root = cheerio.load(rootHtml);
  const siteTitle = $root("title").first().text().trim() || rootUrl.hostname;

  const pages: ScrapedPage[] = [
    {
      url: rootUrl.toString(),
      title: siteTitle,
      category: "top",
      text: extractText($root),
    },
  ];

  const candidateLinks = findCategorizedLinks($root, rootUrl);
  // カテゴリごとに1件ずつ、優先度の高い順に採用
  const chosen: { url: string; category: string; label: string }[] = [];
  const usedCategories = new Set<string>();
  for (const link of candidateLinks) {
    if (chosen.length >= MAX_SUBPAGES) break;
    if (usedCategories.has(link.category)) continue;
    usedCategories.add(link.category);
    chosen.push(link);
  }

  const results = await Promise.allSettled(
    chosen.map(async (link) => {
      const url = new URL(link.url);
      const res = await safeFetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const title = $("title").first().text().trim() || link.label;
      return {
        url: link.url,
        title,
        category: link.category,
        text: extractText($),
      } satisfies ScrapedPage;
    })
  );

  results.forEach((result, i) => {
    const link = chosen[i];
    if (result.status === "fulfilled") {
      pages.push(result.value);
    } else {
      warnings.push(`${link.label}ページ (${link.url}) の取得に失敗しました`);
    }
  });

  return { rootUrl: rootUrl.toString(), siteTitle, pages, warnings };
}
