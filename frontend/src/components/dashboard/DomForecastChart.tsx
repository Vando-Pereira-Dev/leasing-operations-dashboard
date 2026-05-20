import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS } from "@/components/dashboard/chartTheme";

type DomForecastChartProps = {
  byProperty: Record<string, number>;
  portfolioMedian: number | null;
};

export function DomForecastChart({
  byProperty,
  portfolioMedian,
}: DomForecastChartProps) {
  const chartData = Object.entries(byProperty)
    .map(([name, days]) => ({ name, days }))
    .sort((a, b) => b.days - a.days);

  if (chartData.length === 0) {
    return <p className="text-sm text-slate-500">No active units for DOM forecast</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          angle={-20}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} unit="d" />
        <Tooltip formatter={(value: number) => [`${value} days`, "Median DOM"]} />
        {portfolioMedian != null ? (
          <ReferenceLine
            y={portfolioMedian}
            stroke={CHART_COLORS.critical}
            strokeDasharray="4 4"
            label={{
              value: `Portfolio ${portfolioMedian}d`,
              position: "insideTopRight",
              fontSize: 10,
              fill: CHART_COLORS.critical,
            }}
          />
        ) : null}
        <Bar dataKey="days" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
