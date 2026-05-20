import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS } from "@/components/dashboard/chartTheme";
import type { KpiSummary, UnitRecord } from "@/types/api";

type ConversionFunnelChartProps = {
  units: UnitRecord[];
  kpis?: KpiSummary;
};

const STAGE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.atRisk,
  CHART_COLORS.onTrack,
  CHART_COLORS.critical,
];

export function ConversionFunnelChart({ units, kpis }: ConversionFunnelChartProps) {
  const inquiries = kpis?.total_inquiries ?? units.reduce((s, u) => s + (Number(u.inquiries) || 0), 0);
  const showings = kpis?.total_showings ?? units.reduce((s, u) => s + (Number(u.showings) || 0), 0);
  const applications =
    kpis?.total_applications ??
    units.filter((u) => u.application_received_bool === true).length;
  const leases =
    kpis?.total_leases ?? units.filter((u) => u.lease_signed_bool === true).length;

  const chartData = [
    { stage: "Inquiries", count: inquiries },
    { stage: "Showings", count: showings },
    { stage: "Applications", count: applications },
    { stage: "Leases", count: leases },
  ];

  const hasActivity = chartData.some((d) => d.count > 0);
  if (!hasActivity) {
    return <p className="text-sm text-slate-500">No funnel activity on active units</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip formatter={(value: number) => [value, "Count"]} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
