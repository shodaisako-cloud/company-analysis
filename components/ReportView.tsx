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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || "記載なし"}</p>
    </div>
  );
}

export default function ReportView({ report }: { report: AnalysisReport }) {
  const officialSources = report.sources.filter((s) => s.type === "official");
  const webSources = report.sources.filter((s) => s.type === "web");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          企業分析サマリー
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{report.companyName}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{report.summary}</p>
      </div>

      <Section title="基本情報">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="設立" value={report.basicInfo.founded} />
          <StatTile label="資本金" value={report.basicInfo.capital} />
          <StatTile label="事業所" value={report.basicInfo.locations} />
          <StatTile label="従業員数" value={report.basicInfo.employees} />
        </div>
        {report.basicInfo.other && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{report.basicInfo.other}</p>
        )}
      </Section>

      <Section title="企業理念・ビジョン・ミッション">
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">ミッション</p>
            <p className="text-sm leading-relaxed text-slate-700">{report.philosophy.mission}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">ビジョン</p>
            <p className="text-sm leading-relaxed text-slate-700">{report.philosophy.vision}</p>
          </div>
        </div>
        <p className="mb-1 text-xs font-semibold text-slate-500">バリュー・行動指針</p>
        <BulletList items={report.philosophy.values} />
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="同業他社との比較">
          <BulletList items={report.competitorComparison} />
        </Section>

        <Section title="採用情報">
          <BulletList items={report.recruitInfo} />
        </Section>

        <Section title="業績の推移">
          <BulletList items={report.financialTrend} />
        </Section>

        <Section title="経営方針の変遷">
          <BulletList items={report.managementPolicyHistory} />
        </Section>

        <Section title="主要プロジェクト・注力領域">
          <BulletList items={report.keyProjects} />
        </Section>

        <Section title="今後の展望">
          <BulletList items={report.futureOutlook} />
        </Section>

        <Section title="直近ニュース">
          <BulletList items={report.recentNews} />
        </Section>

        <Section title="企業文化・働き方">
          <BulletList items={report.cultureAndWorkStyle} />
        </Section>

        <Section title="社員の声・口コミ">
          <BulletList items={report.employeeVoice} />
        </Section>

        <Section title="リスク・係争案件">
          <BulletList items={report.risksAndDisputes} />
        </Section>
      </div>

      {report.other.length > 0 && (
        <Section title="その他">
          <BulletList items={report.other} />
        </Section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-slate-800">選考対策</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">志望動機のヒント</p>
            <BulletList items={report.jobHuntingTips.motivationHints} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">聞かれそうな質問</p>
            <BulletList items={report.jobHuntingTips.likelyInterviewQuestions} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">逆質問のアイデア</p>
            <BulletList items={report.jobHuntingTips.questionsToAsk} />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">
              自己PRと結びつけるポイント
            </p>
            <BulletList items={report.jobHuntingTips.fitPoints} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {report.confidenceNote}
      </div>

      {(officialSources.length > 0 || webSources.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {officialSources.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">参照ページ（公式サイト）</p>
              <ul className="space-y-1">
                {officialSources.map((s) => (
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
          {webSources.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">
                参照ページ（Web検索・補足情報）
              </p>
              <ul className="space-y-1">
                {webSources.map((s) => (
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
      )}
    </div>
  );
}
