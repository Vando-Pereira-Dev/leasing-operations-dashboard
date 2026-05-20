import { useQuery } from "@tanstack/react-query";

import { fetchDashboard, fetchUnits } from "@/api/leasing";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ConversionFunnelChart } from "@/components/dashboard/ConversionFunnelChart";
import { DomForecastChart } from "@/components/dashboard/DomForecastChart";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { PortfolioAlerts } from "@/components/dashboard/PortfolioAlerts";
import { PortfolioRecommendations } from "@/components/dashboard/PortfolioRecommendations";
import { PropertyOccupancyChart } from "@/components/dashboard/PropertyOccupancyChart";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { StatusBreakdownChart } from "@/components/dashboard/StatusBreakdownChart";
import { WorkloadChart } from "@/components/dashboard/WorkloadChart";
import { useDataset } from "@/context/DatasetContext";

export function OperationalDashboard() {
  const { datasetId, filters, filtersActive, unitCount } = useDataset();

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

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Operational insights
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {filtersActive
              ? `${filteredCount} units match filters (${unitCount} total)`
              : `${unitCount} units in portfolio`}
            {dashboard.forecast.portfolio_median != null
              ? ` · Median DOM (active): ${dashboard.forecast.portfolio_median} days`
              : ""}
          </p>
        </div>
      </div>

      <PortfolioAlerts alerts={dashboard.alerts} />

      <KpiCards kpis={dashboard.kpis} />

      <PortfolioRecommendations recommendations={dashboard.recommendations} />

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
          subtitle="POC forecast baseline — dashed line is portfolio median"
        >
          <DomForecastChart
            byProperty={dashboard.forecast.by_property}
            portfolioMedian={dashboard.forecast.portfolio_median}
          />
        </ChartCard>
      </div>
    </section>
  );
}
