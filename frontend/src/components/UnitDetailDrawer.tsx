import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchUnitDetail } from "@/api/leasing";
import { RiskBadge } from "@/components/RiskBadge";
import type { UnitRecord } from "@/types/api";

type UnitDetailDrawerProps = {
  datasetId: string;
  unitKey: string | null;
  onClose: () => void;
};

const LABELS: Record<string, string> = {
  property: "Property",
  unit: "Unit",
  unit_type: "Unit type",
  status: "Status",
  asking_rent: "Asking rent",
  market_rent: "Market rent",
  price_variance_pct: "Price vs market",
  days_on_market: "Days on market",
  inquiries: "Inquiries",
  showings: "Showings",
  application_received: "Application received",
  lease_signed: "Lease signed",
  marketing_start_date: "Marketing start",
  lease_end_date: "Lease end",
  owner: "Owner / agent",
  notes: "Notes",
  risk_score: "Risk score",
  risk_category: "Risk category",
  incomplete_record: "Incomplete record",
  lease_expiring_60d: "Lease expiring (60d)",
};

const HIDDEN = new Set([
  "unit_key",
  "recommendations",
  "is_vacant",
  "is_leased",
  "is_active_for_lease",
  "application_received_bool",
  "lease_signed_bool",
]);

function formatValue(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "asking_rent" || key === "market_rent") {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(num);
    }
  }
  if (key === "price_variance_pct" && typeof value === "number") {
    return `${value.toFixed(1)}%`;
  }
  return String(value);
}

function detailFields(unit: UnitRecord): { key: string; label: string; value: string }[] {
  return Object.entries(unit)
    .filter(([key]) => !HIDDEN.has(key))
    .map(([key, value]) => ({
      key,
      label: LABELS[key] ?? key.replace(/_/g, " "),
      value: formatValue(key, value),
    }));
}

export function UnitDetailDrawer({
  datasetId,
  unitKey,
  onClose,
}: UnitDetailDrawerProps) {
  const open = Boolean(unitKey);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["unit-detail", datasetId, unitKey],
    queryFn: () => fetchUnitDetail(datasetId, unitKey!),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const unit = data?.unit;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close unit detail"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unit-detail-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading unit…</p>
            ) : unit ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {unit.property}
                </p>
                <h2
                  id="unit-detail-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {unit.unit}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RiskBadge category={unit.risk_category} />
                  {unit.unit_type ? (
                    <span className="text-xs text-slate-600">{unit.unit_type}</span>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-red-600">Unit not found</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded bg-slate-100"
                />
              ))}
            </div>
          ) : isError || !unit ? (
            <p className="text-sm text-red-600">
              Could not load unit details. Try again.
            </p>
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Record details
                </h3>
                <dl className="mt-3 space-y-2.5">
                  {detailFields(unit).map(({ key, label, value }) => (
                    <div
                      key={key}
                      className="flex justify-between gap-4 border-b border-slate-50 pb-2 text-sm"
                    >
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="max-w-[55%] text-right font-medium text-slate-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recommendations
                </h3>
                {unit.recommendations && unit.recommendations.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {unit.recommendations.map((rec) => (
                      <li
                        key={rec}
                        className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm leading-snug text-brand-900"
                      >
                        {rec}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No recommendations for this unit.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
