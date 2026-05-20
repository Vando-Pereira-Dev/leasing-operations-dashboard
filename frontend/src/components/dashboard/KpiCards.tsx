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
  {
    key: "occupancy_rate",
    label: "Occupancy rate",
    format: (v) => (v == null ? "—" : `${v}%`),
  },
  { key: "active_for_lease_units", label: "Active for lease" },
  { key: "leased_units", label: "Leased / occupied" },
  { key: "critical_risk_units", label: "Critical risk" },
  { key: "at_risk_units", label: "At risk" },
  {
    key: "avg_days_on_market_active",
    label: "Avg days on market",
    hint: "Active units",
    format: (v) => (v == null ? "—" : `${v} days`),
  },
  { key: "total_inquiries", label: "Total inquiries", hint: "Portfolio-wide" },
  { key: "total_showings", label: "Total showings", hint: "Portfolio-wide" },
  {
    key: "inquiry_to_showing_rate",
    label: "Inquiry → showing",
    hint: "Portfolio-wide %",
    format: (v) => (v == null ? "—" : `${v}%`),
  },
  {
    key: "showing_to_application_rate",
    label: "Showing → application",
    hint: "Portfolio-wide %",
    format: (v) => (v == null ? "—" : `${v}%`),
  },
  {
    key: "application_to_lease_rate",
    label: "Application → lease",
    hint: "Portfolio-wide %",
    format: (v) => (v == null ? "—" : `${v}%`),
  },
  { key: "overpriced_units", label: "Overpriced units", hint: ">5% above market (active)" },
  { key: "underpriced_units", label: "Underpriced units", hint: ">5% below market (active)" },
  {
    key: "avg_price_variance_active",
    label: "Avg price variance",
    hint: "Active units",
    format: (v) => (v == null ? "—" : `${v}%`),
  },
  {
    key: "upcoming_lease_expirations_60d",
    label: "Lease expirations",
    hint: "Within 60 days",
  },
  { key: "incomplete_records", label: "Incomplete records" },
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
