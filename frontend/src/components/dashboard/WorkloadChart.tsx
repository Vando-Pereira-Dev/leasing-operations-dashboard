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

type WorkloadChartProps = {
  workload: Record<string, number>;
};

export function WorkloadChart({ workload }: WorkloadChartProps) {
  const chartData = Object.entries(workload)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No workload data (vacant + at-risk units with assigned owners)
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip formatter={(value: number) => [value, "Units"]} />
        <Bar dataKey="count" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
