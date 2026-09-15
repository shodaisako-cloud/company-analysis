import { GoogleGenAI } from "@google/genai";
import type { AnalysisReport, ScrapeResult, WebSnippet } from "./types";

// gemini-2.0-flash は Google AI Studio の無料枠で利用できる安定版モデル。
// より新しいモデル（例: gemini-2.5-flash）を使いたい場合は環境変数で上書き可能。
const DEFAULT_MODEL = "gemini-2.0-flash";

const REPORT_JSON_SCHEMA = {
  type: "object",
  properties: {
    companyName: { type: "string", description: "会社名（不明なら『不明』とする）" },
    summary: { type: "string", description: "就活生向けの3〜5文の要約" },

    basicInfo: {
      type: "object",
      properties: {
        founded: { type: "string", description: "設立年（不明なら『記載なし』）" },
        capital: { type: "string", description: "資本金（不明なら『記載なし』）" },
        locations: { type: "string", description: "本社・主要拠点・事業所" },
        employees: { type: "string", description: "従業員数（不明なら『記載なし』）" },
        other: { type: "string", description: "代表者名など、その他の基本情報" },
      },
      required: ["founded", "capital", "locations", "employees", "other"],
    },

    philosophy: {
      type: "object",
      properties: {
        mission: { type: "string", description: "ミッション（不明なら『記載なし』）" },
        vision: { type: "string", description: "ビジョン（不明なら『記載なし』）" },
        values: {
          type: "array",
          items: { type: "string" },
          description: "バリュー・行動指針・企業理念のポイント",
        },
      },
      required: ["mission", "vision", "values"],
    },

    competitorComparison: {
      type: "array",
      items: { type: "string" },
      description:
        "同業他社との比較。Web検索結果がある場合のみ具体的な社名を挙げて比較し、根拠が無ければ『情報不足のため比較できません』と明記する",
    },
    recruitInfo: {
      type: "array",
      items: { type: "string" },
      description: "採用職種、求める人物像、選考フロー、初任給など採用情報",
    },
    financialTrend: {
      type: "array",
      items: { type: "string" },
      description: "業績（売上・利益等）の推移。具体的な数値は出典に明記がある場合のみ記載する",
    },
    managementPolicyHistory: {
      type: "array",
      items: { type: "string" },
      description: "経営方針・中期経営計画・沿革上の転換点の変遷",
    },
    keyProjects: {
      type: "array",
      items: { type: "string" },
      description: "主要プロジェクト・注力事業領域",
    },
    futureOutlook: {
      type: "array",
      items: { type: "string" },
      description: "今後の展望・中長期戦略",
    },
    recentNews: {
      type: "array",
      items: { type: "string" },
      description: "直近のニュース・プレスリリース（日付が分かれば含める）",
    },
    cultureAndWorkStyle: {
      type: "array",
      items: { type: "string" },
      description: "社風・働き方（勤務制度、福利厚生、ダイバーシティ施策等）",
    },
    employeeVoice: {
      type: "array",
      items: { type: "string" },
      description:
        "社員の声・口コミ。Web検索結果に基づく情報のみ記載し、無ければ『公式情報からは確認できず、口コミサイト等で別途確認を推奨』と明記する",
    },
    risksAndDisputes: {
      type: "array",
      items: { type: "string" },
      description:
        "リスク・係争案件・不祥事等の留意点。根拠が無ければ『確認できる情報なし』と明記する（存在しないことの断定はしない）",
    },
    other: {
      type: "array",
      items: { type: "string" },
      description: "上記に分類できないが就活生に有用な情報",
    },

    jobHuntingTips: {
      type: "object",
      properties: {
        motivationHints: {
          type: "array",
          items: { type: "string" },
          description: "志望動機を書く際に使えるポイント",
        },
        likelyInterviewQuestions: {
          type: "array",
          items: { type: "string" },
          description: "面接で聞かれそうな質問の予想",
        },
        questionsToAsk: {
          type: "array",
          items: { type: "string" },
          description: "逆質問のアイデア",
        },
        fitPoints: {
          type: "array",
          items: { type: "string" },
          description: "自己PRと企業の特徴を結びつけるための着眼点",
        },
      },
      required: [
        "motivationHints",
        "likelyInterviewQuestions",
        "questionsToAsk",
        "fitPoints",
      ],
    },

    confidenceNote: {
      type: "string",
      description:
        "この分析が公式サイトおよび（利用可能な場合）Web検索結果に基づくこと、最終確認は本人が行うべき旨の注記",
    },
  },
  required: [
    "companyName",
    "summary",
    "basicInfo",
    "philosophy",
    "competitorComparison",
    "recruitInfo",
    "financialTrend",
    "managementPolicyHistory",
    "keyProjects",
    "futureOutlook",
    "recentNews",
    "cultureAndWorkStyle",
    "employeeVoice",
    "risksAndDisputes",
    "other",
    "jobHuntingTips",
    "confidenceNote",
  ],
};

function buildOfficialSourceDocument(scrape: ScrapeResult): string {
  return scrape.pages
    .map((page, i) => {
      return [
        `=== 公式サイト資料${i + 1}: ${page.title} (${page.category}) ===`,
        `URL: ${page.url}`,
        page.text || "(本文を取得できませんでした)",
      ].join("\n");
    })
    .join("\n\n");
}

function buildWebSearchDocument(snippets: WebSnippet[]): string {
  if (snippets.length === 0) {
    return "(Web検索は設定されていないため実行していません。公式サイトの情報のみで分析してください。)";
  }
  return snippets
    .map((s, i) => {
      return [
        `--- Web検索結果${i + 1}（検索語: ${s.query}）---`,
        `タイトル: ${s.title}`,
        `URL: ${s.url}`,
        `抜粋: ${s.snippet}`,
      ].join("\n");
    })
    .join("\n\n");
}

export async function analyzeCompany(
  scrape: ScrapeResult,
  webSnippets: WebSnippet[]
): Promise<AnalysisReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY が設定されていません。.env.local に設定してサーバーを再起動してください。"
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const officialDocument = buildOfficialSourceDocument(scrape);
  const webDocument = buildWebSearchDocument(webSnippets);

  const systemInstruction = `あなたは日本の新卒・中途就活生を支援するキャリアアドバイザーです。
与えられた「企業公式サイトの本文」と「Web検索結果の抜粋」だけを根拠に、就職活動のための企業分析レポートを作成します。

厳守事項:
- 与えられた資料に書かれていない事実を推測で断定しない。不明な場合は「情報不足」「記載なし」「確認できる情報なし」等と正直に書く。
- 数値（売上・資本金・従業員数など）は出典に明記がある場合のみ記載し、うろ覚えの一般知識で補完しない。
- Web検索結果の抜粋を使う場合は、それが公式サイトではなく外部情報であることを踏まえ、断定的な表現を避ける（例:「〜という情報がある」）。
- 誇張や過度なポジティブ/ネガティブ評価を避け、中立的かつ具体的に書く。
- 日本語で、就活生がそのまま参考にできる実用的な文章にする。
- 各配列項目は簡潔な1〜2文で、目安として3〜6項目程度にする（該当情報が無い場合は「情報不足」旨の1項目のみでよい）。
- JSON以外のテキストは一切出力しない。`;

  const userPrompt = `# 企業公式サイトの本文
${officialDocument}

# Web検索結果の抜粋（就活生向けに補足情報として利用。無い場合は公式サイトの情報のみで分析）
${webDocument}

上記の情報のみを根拠に、就活生向けの企業分析レポートをJSONで出力してください。`;

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: REPORT_JSON_SCHEMA,
      temperature: 0.3,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("AIからの分析結果を取得できませんでした。");
  }

  let parsed: Omit<AnalysisReport, "sources">;
  try {
    parsed = JSON.parse(text) as Omit<AnalysisReport, "sources">;
  } catch {
    throw new Error("AIの応答をJSONとして解析できませんでした。");
  }

  return {
    ...parsed,
    sources: [
      ...scrape.pages.map((p) => ({ url: p.url, label: p.title, type: "official" as const })),
      ...webSnippets.map((s) => ({ url: s.url, label: s.title, type: "web" as const })),
    ],
  };
}
