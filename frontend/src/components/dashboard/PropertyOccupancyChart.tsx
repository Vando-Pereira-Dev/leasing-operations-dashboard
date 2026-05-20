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
import type { PropertySummary } from "@/types/api";

type PropertyOccupancyChartProps = {
  properties: PropertySummary[];
};

function barColor(rate: number | null) {
  if (rate == null) return CHART_COLORS.slate;
  if (rate >= 75) return CHART_COLORS.onTrack;
  if (rate >= 60) return CHART_COLORS.atRisk;
  return CHART_COLORS.critical;
}

export function PropertyOccupancyChart({ properties }: PropertyOccupancyChartProps) {
  const chartData = properties
    .map((p) => ({
      name: p.property,
      occupancy: p.occupancy_rate ?? 0,
    }))
    .sort((a, b) => a.occupancy - b.occupancy);

  if (chartData.length === 0) {
    return <p className="text-sm text-slate-500">No property data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#64748b" }}
          unit="%"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11, fill: "#64748b" }}
        />
        <Tooltip formatter={(value: number) => [`${value}%`, "Occupancy"]} />
        <Bar dataKey="occupancy" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={barColor(entry.occupancy)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
