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

import { RISK_COLORS } from "@/components/dashboard/chartTheme";
import type { UnitRecord } from "@/types/api";

const ORDER = ["Critical", "At Risk", "On Track", "Leased"];

type RiskDistributionChartProps = {
  units: UnitRecord[];
};

export function RiskDistributionChart({ units }: RiskDistributionChartProps) {
  const counts = ORDER.map((name) => ({
    name,
    count: units.filter((u) => u.risk_category === name).length,
  })).filter((row) => row.count > 0);

  if (counts.length === 0) {
    return <p className="text-sm text-slate-500">No risk data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={counts} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip formatter={(value: number) => [value, "Units"]} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {counts.map((entry) => (
            <Cell key={entry.name} fill={RISK_COLORS[entry.name] ?? "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
