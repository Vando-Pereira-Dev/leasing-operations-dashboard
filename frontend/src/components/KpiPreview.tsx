import type { KpiSummary } from "@/types/api";

type KpiPreviewProps = {
  kpis: KpiSummary;
};

const cards: {
  key: keyof KpiSummary;
  label: string;
  format?: (v: number | null) => string;
}[] = [
  { key: "total_units", label: "Total units" },
  { key: "vacant_units", label: "Vacant units" },
  { key: "upcoming_lease_expirations_60d", label: "Lease expirations (60d)" },
  { key: "critical_risk_units", label: "Critical risk" },
  { key: "incomplete_records", label: "Incomplete records" },
];

export function KpiPreview({ kpis }: KpiPreviewProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(({ key, label }) => (
        <div
          key={key}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {kpis[key] ?? "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
