# company-analysis

企業の公式サイトURLを貼るだけで、就活（新卒・中途）のための企業分析レポートをAIが自動生成するWebアプリです。

## できること

1. トップページに企業の公式サイトURL（例: `https://www.example.co.jp`）を入力
2. サーバーがトップページと、サイト内から見つかる「会社概要」「経営理念」「事業内容」「採用情報」「ニュース/IR」「沿革」などの関連ページを自動で取得
3. 取得したテキストのみを根拠として、Claude（Anthropic API）が以下を含む構造化レポートを生成
   - 企業サマリー
   - 事業内容・主力製品・業界内ポジション
   - 強み／留意点
   - 社風・ミッション・バリュー
   - 成長性・最近のニュース
   - 志望動機のヒント／想定質問／逆質問アイデア／自己PRとの接続ポイント
   - 参照した実際のページURL一覧

公式サイトに書かれていない情報は「情報不足」と明記するようプロンプトで指示しており、推測による断定を避ける設計になっています。ただし最終的な事実確認はご自身で行ってください。

## 技術構成

- Next.js 16 (App Router, TypeScript) + Tailwind CSS
- サーバー側スクレイピング: `cheerio`（HTML本文抽出）
- AI分析: `@anthropic-ai/sdk`（Claude、Tool Use による構造化出力）
- SSRF対策: 取得先ホストの名前解決結果がプライベート/ループバックIPの場合は拒否

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、Anthropic APIキーを設定します。

```bash
cp .env.example .env.local
```

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-sonnet-5   # 省略可
```

APIキーは https://console.anthropic.com/ から発行できます。

### 3. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 を開き、企業のURLを入力して「分析する」を押してください。

### 4. 本番ビルド

```bash
npm run build
npm run start
```

## デプロイ

Vercel等のNext.js対応ホスティングにそのままデプロイ可能です。デプロイ先の環境変数に `ANTHROPIC_API_KEY` を設定してください。

## 制限事項・注意点

- JavaScriptでコンテンツを描画するSPA型の企業サイトでは、本文が取得できず分析精度が下がる場合があります。
- 一部サイトはボットアクセスを制限しており、取得に失敗することがあります（その場合はエラーメッセージが表示されます）。
- 生成される内容は公開情報に基づくAIの分析であり、正確性を保証するものではありません。就活における最終判断の参考情報としてご利用ください。
