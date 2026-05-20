import { useQuery } from "@tanstack/react-query";

import { fetchHealth } from "@/api/leasing";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { useDataset } from "@/context/DatasetContext";

export function Header() {
  const { filename, unitCount } = useDataset();
  const health = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    retry: 1,
    refetchInterval: 30_000,
  });

  const apiOk = health.isSuccess && health.data.status === "ok";

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            VirtuAll VA · Proof of Concept
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Leasing Operations Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Upload property management exports and turn raw leasing data into
            operational insights.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge
            label={
              apiOk
                ? `API · ${health.data?.service ?? "ok"}`
                : "API unreachable"
            }
            ok={apiOk}
          />
          {filename ? (
            <p className="text-xs text-slate-500">
              Loaded: <span className="font-medium text-slate-700">{filename}</span>{" "}
              · {unitCount} units
            </p>
          ) : (
            <p className="text-xs text-slate-500">No dataset loaded</p>
          )}
        </div>
      </div>
    </header>
  );
}
