import type { AnalysisReport } from "@/lib/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-bold text-slate-800">{title}</h3>
      {children}
    </section>
  );
}

function BulletList({ items, empty }: { items: string[]; empty?: string }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-400">{empty ?? "情報がありません"}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportView({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          企業分析サマリー
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{report.companyName}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{report.summary}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="事業内容">
          <p className="mb-3 text-sm leading-relaxed text-slate-700">
            {report.business.overview}
          </p>
          <p className="mb-1 text-xs font-semibold text-slate-500">主な製品・サービス</p>
          <BulletList items={report.business.products} />
          <p className="mb-1 mt-3 text-xs font-semibold text-slate-500">
            業界内でのポジション
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            {report.business.industryPosition}
          </p>
        </Section>

        <Section title="成長性・最近の動き">
          <BulletList
            items={report.growthAndNews}
            empty="公式サイトからは成長性・最新動向に関する情報を確認できませんでした"
          />
        </Section>

        <Section title="強み">
          <BulletList items={report.strengths} />
        </Section>

        <Section title="留意点・確認しておきたいこと">
          <BulletList items={report.risks} />
        </Section>

        <Section title="社風・働き方">
          <p className="mb-1 text-xs font-semibold text-slate-500">サイトから読み取れる所見</p>
          <BulletList items={report.culture.findings} />
          <p className="mb-1 mt-3 text-xs font-semibold text-slate-500">
            ミッション・バリュー・行動指針
          </p>
          <BulletList items={report.culture.values} />
        </Section>

        <Section title="選考対策">
          <p className="mb-1 text-xs font-semibold text-slate-500">志望動機のヒント</p>
          <BulletList items={report.jobHuntingTips.motivationHints} />
          <p className="mb-1 mt-3 text-xs font-semibold text-slate-500">
            聞かれそうな質問
          </p>
          <BulletList items={report.jobHuntingTips.likelyInterviewQuestions} />
          <p className="mb-1 mt-3 text-xs font-semibold text-slate-500">逆質問のアイデア</p>
          <BulletList items={report.jobHuntingTips.questionsToAsk} />
          <p className="mb-1 mt-3 text-xs font-semibold text-slate-500">
            自己PRと結びつけるポイント
          </p>
          <BulletList items={report.jobHuntingTips.fitPoints} />
        </Section>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {report.confidenceNote}
      </div>

      {report.sources.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-xs font-semibold text-slate-500">参照ページ</p>
          <ul className="space-y-1">
            {report.sources.map((s) => (
              <li key={s.url} className="truncate text-xs">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  {s.label || s.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
