import type { PortfolioAlert } from "@/types/api";

const STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-800",
};

type PortfolioAlertsProps = {
  alerts: PortfolioAlert[];
};

export function PortfolioAlerts({ alerts }: PortfolioAlertsProps) {
  const actionable = alerts.filter((a) => a.severity !== "info" || alerts.length === 1);

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Portfolio alerts
      </h2>
      <div className="grid gap-2 md:grid-cols-2">
        {actionable.map((alert) => (
          <article
            key={`${alert.severity}-${alert.title}`}
            className={`rounded-xl border px-4 py-3 ${STYLES[alert.severity] ?? STYLES.info}`}
          >
            <h3 className="text-sm font-semibold">{alert.title}</h3>
            <p className="mt-1 text-sm leading-snug opacity-90">{alert.message}</p>
            {alert.unit_keys.length > 0 ? (
              <p className="mt-2 text-xs opacity-75">
                Units: {alert.unit_keys.slice(0, 4).join(", ")}
                {alert.unit_keys.length > 4 ? "…" : ""}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
