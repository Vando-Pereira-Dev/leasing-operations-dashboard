import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS } from "@/components/dashboard/chartTheme";

type StatusBreakdownChartProps = {
  data: Record<string, number>;
};

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const chartData = Object.entries(data).map(([name, count]) => ({
    name: name.length > 18 ? `${name.slice(0, 16)}…` : name,
    fullName: name,
    count,
  }));

  if (chartData.length === 0) {
    return <p className="text-sm text-slate-500">No status data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          angle={-25}
          textAnchor="end"
          interval={0}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip
          formatter={(value: number) => [value, "Units"]}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload?.fullName ?? ""
          }
        />
        <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
