import type { KpiSummary } from "@/types/api";

type KpiCardsProps = {
  kpis: KpiSummary;
};

type CardDef = {
  key: keyof KpiSummary;
  label: string;
  hint?: string;
  format?: (value: number | null) => string;
};

const cards: CardDef[] = [
  { key: "total_units", label: "Total units" },
  { key: "vacant_units", label: "Vacant units", hint: "Needs leasing attention" },
  { key: "active_for_lease_units", label: "Active for lease" },
  { key: "leased_units", label: "Leased / occupied" },
  {
    key: "upcoming_lease_expirations_60d",
    label: "Lease expirations",
    hint: "Within 60 days",
  },
  { key: "critical_risk_units", label: "Critical risk" },
  { key: "at_risk_units", label: "At risk" },
  { key: "incomplete_records", label: "Incomplete records" },
  {
    key: "avg_days_on_market_active",
    label: "Avg days on market",
    hint: "Active units",
    format: (v) => (v == null ? "—" : `${v} days`),
  },
  {
    key: "inquiry_to_showing_rate",
    label: "Inquiry → showing",
    format: (v) => (v == null ? "—" : `${v}%`),
  },
  {
    key: "showing_to_application_rate",
    label: "Showing → application",
    format: (v) => (v == null ? "—" : `${v}%`),
  },
  {
    key: "application_to_lease_rate",
    label: "Application → lease",
    format: (v) => (v == null ? "—" : `${v}%`),
  },
  { key: "overpriced_units", label: "Overpriced units", hint: ">5% above market" },
];

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {cards.map(({ key, label, hint, format }) => {
        const raw = kpis[key];
        const display =
          typeof raw === "number"
            ? format
              ? format(raw)
              : raw
            : "—";

        return (
          <div
            key={key}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </p>
            {hint ? (
              <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>
            ) : null}
            <p className="mt-2 text-2xl font-bold text-slate-900">{display}</p>
          </div>
        );
      })}
    </div>
  );
}
