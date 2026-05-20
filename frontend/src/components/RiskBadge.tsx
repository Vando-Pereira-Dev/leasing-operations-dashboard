type RiskBadgeProps = {
  category?: string;
};

const styles: Record<string, string> = {
  Critical: "bg-red-100 text-red-800 ring-red-200",
  "At Risk": "bg-amber-100 text-amber-900 ring-amber-200",
  "On Track": "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Leased: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function RiskBadge({ category }: RiskBadgeProps) {
  const label = category ?? "—";
  const cls = styles[label] ?? "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
