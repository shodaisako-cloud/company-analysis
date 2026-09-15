import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisReport, ScrapeResult } from "./types";

const DEFAULT_MODEL = "claude-sonnet-5";

const REPORT_TOOL_NAME = "submit_company_analysis";

const REPORT_SCHEMA = {
  type: "object" as const,
  properties: {
    companyName: { type: "string", description: "会社名（不明なら推測せず『不明』とする）" },
    summary: { type: "string", description: "就活生向けの3〜5文の要約" },
    business: {
      type: "object",
      properties: {
        overview: { type: "string", description: "事業内容の説明" },
        products: {
          type: "array",
          items: { type: "string" },
          description: "主要な製品・サービス",
        },
        industryPosition: {
          type: "string",
          description: "業界内でのポジションや競合との違い（記載がなければ『情報不足』と明記）",
        },
      },
      required: ["overview", "products", "industryPosition"],
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "就活生から見た企業の強み",
    },
    risks: {
      type: "array",
      items: { type: "string" },
      description: "留意点・リスク・懸念点（見当たらなければ『提供情報からは確認できず』等）",
    },
    culture: {
      type: "object",
      properties: {
        findings: {
          type: "array",
          items: { type: "string" },
          description: "社風・働き方に関する情報源に基づく所見",
        },
        values: {
          type: "array",
          items: { type: "string" },
          description: "掲げているミッション・バリュー・行動指針",
        },
      },
      required: ["findings", "values"],
    },
    growthAndNews: {
      type: "array",
      items: { type: "string" },
      description: "成長性・最近のニュースやIR情報から読み取れること",
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
      description: "この分析が公式サイトの情報のみに基づくこと、追加調査を推奨する旨の注記",
    },
  },
  required: [
    "companyName",
    "summary",
    "business",
    "strengths",
    "risks",
    "culture",
    "growthAndNews",
    "jobHuntingTips",
    "confidenceNote",
  ],
};

function buildSourceDocument(scrape: ScrapeResult): string {
  return scrape.pages
    .map((page, i) => {
      return [
        `=== 資料${i + 1}: ${page.title} (${page.category}) ===`,
        `URL: ${page.url}`,
        page.text || "(本文を取得できませんでした)",
      ].join("\n");
    })
    .join("\n\n");
}

export async function analyzeCompany(scrape: ScrapeResult): Promise<AnalysisReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY が設定されていません。.env.local に設定してサーバーを再起動してください。"
    );
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const sourceDocument = buildSourceDocument(scrape);

  const systemPrompt = `あなたは日本の新卒・中途就活生を支援するキャリアアドバイザーです。
与えられた企業公式サイトのテキストのみを根拠に、就職活動のための企業分析レポートを作成します。

厳守事項:
- 与えられた資料に書かれていない事実を推測で断定しない。不明な場合は「情報不足」「記載なし」等と正直に書く。
- 誇張や過度なポジティブ/ネガティブ評価を避け、中立的かつ具体的に書く。
- 日本語で、就活生がそのまま参考にできる実用的な文章にする。
- 各配列項目は簡潔な1〜2文で、3〜6項目程度を目安にする。
- submit_company_analysis ツールを1回だけ呼び出し、結果を構造化して返す。`;

  const userPrompt = `以下は企業公式サイトから取得したテキストです。この内容だけを根拠に企業分析レポートを作成してください。

${sourceDocument}`;

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    tools: [
      {
        name: REPORT_TOOL_NAME,
        description: "就活生向けの企業分析レポートを構造化データとして提出する",
        input_schema: REPORT_SCHEMA,
      },
    ],
    tool_choice: { type: "tool", name: REPORT_TOOL_NAME },
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new Error("AIからの構造化された分析結果を取得できませんでした。");
  }

  const parsed = toolUse.input as Omit<AnalysisReport, "sources">;

  return {
    ...parsed,
    sources: scrape.pages.map((p) => ({ url: p.url, label: p.title })),
  };
}
