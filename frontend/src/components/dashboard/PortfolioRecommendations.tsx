import type { PortfolioRecommendation } from "@/types/api";

const PRIORITY_STYLES: Record<string, string> = {
  immediate: "bg-red-600 text-white",
  high: "bg-amber-500 text-white",
  medium: "bg-brand-600 text-white",
  strategic: "bg-slate-600 text-white",
};

type PortfolioRecommendationsProps = {
  recommendations: PortfolioRecommendation[];
};

export function PortfolioRecommendations({
  recommendations,
}: PortfolioRecommendationsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        Portfolio action plan
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Prioritized recommendations from your leasing performance playbook
      </p>
      <ol className="mt-4 space-y-3">
        {recommendations.map((rec, index) => (
          <li
            key={`${rec.priority}-${rec.title}`}
            className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.medium
                  }`}
                >
                  {rec.priority}
                </span>
                <h3 className="text-sm font-semibold text-slate-900">{rec.title}</h3>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {rec.action}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
