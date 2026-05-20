import { useQuery } from "@tanstack/react-query";

import { fetchDashboard, fetchUnits } from "@/api/leasing";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ConversionFunnelChart } from "@/components/dashboard/ConversionFunnelChart";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { PropertyOccupancyChart } from "@/components/dashboard/PropertyOccupancyChart";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { StatusBreakdownChart } from "@/components/dashboard/StatusBreakdownChart";
import { WorkloadChart } from "@/components/dashboard/WorkloadChart";
import { useDataset } from "@/context/DatasetContext";

export function OperationalDashboard() {
  const { datasetId, filters, unitCount } = useDataset();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", datasetId, filters],
    queryFn: () => fetchDashboard(datasetId!, filters),
    enabled: Boolean(datasetId),
  });

  const unitsQuery = useQuery({
    queryKey: ["units", datasetId, filters],
    queryFn: () => fetchUnits(datasetId!, filters),
    enabled: Boolean(datasetId),
  });

  if (!datasetId) return null;

  if (dashboardQuery.isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading operational insights…
      </section>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <section
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        role="alert"
      >
        Failed to load dashboard metrics.
      </section>
    );
  }

  const dashboard = dashboardQuery.data;
  const units = unitsQuery.data?.units ?? [];
  const filteredCount = dashboard.unit_count;
  const showingFiltered = filteredCount !== unitCount;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Operational insights
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {showingFiltered
              ? `${filteredCount} units match current filters (${unitCount} total)`
              : `${unitCount} units in portfolio`}
            {dashboard.forecast.portfolio_median != null
              ? ` · Median DOM (active): ${dashboard.forecast.portfolio_median} days`
              : ""}
          </p>
        </div>
      </div>

      <KpiCards kpis={dashboard.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Unit distribution by risk"
          subtitle="Active and leased units scored for leasing risk"
        >
          <RiskDistributionChart units={units} />
        </ChartCard>

        <ChartCard
          title="Units by status"
          subtitle="Current occupancy / leasing status from export"
        >
          <StatusBreakdownChart data={dashboard.status_breakdown} />
        </ChartCard>

        <ChartCard
          title="Occupancy by property"
          subtitle="Leased units as % of property total"
        >
          <PropertyOccupancyChart properties={dashboard.properties} />
        </ChartCard>

        <ChartCard
          title="Leasing conversion funnel"
          subtitle="Aggregate activity across filtered active units"
        >
          <ConversionFunnelChart units={units} />
        </ChartCard>

        <ChartCard
          title="Workload by owner"
          subtitle="Vacant and at-risk units per leasing agent"
          >
          <WorkloadChart workload={dashboard.workload_by_owner} />
        </ChartCard>

        <ChartCard
          title="Median days on market by property"
          subtitle="Forecast baseline for active units (POC)"
        >
          {Object.keys(dashboard.forecast.by_property).length > 0 ? (
            <ul className="space-y-2 text-sm">
              {Object.entries(dashboard.forecast.by_property)
                .sort(([, a], [, b]) => b - a)
                .map(([property, days]) => (
                  <li
                    key={property}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="text-slate-700">{property}</span>
                    <span className="font-semibold text-slate-900">{days} days</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No active units for DOM forecast</p>
          )}
        </ChartCard>
      </div>
    </section>
  );
}
