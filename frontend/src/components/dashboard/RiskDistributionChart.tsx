import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RISK_COLORS } from "@/components/dashboard/chartTheme";
import type { UnitRecord } from "@/types/api";

/** Active units only — matches first take-home dashboard PNG. */
const ORDER = ["Critical", "At Risk", "On Track"];

type RiskDistributionChartProps = {
  units: UnitRecord[];
};

export function RiskDistributionChart({ units }: RiskDistributionChartProps) {
  const active = units.filter((u) => u.is_active_for_lease === true);
  const counts = ORDER.map((name) => ({
    name,
    count: active.filter((u) => u.risk_category === name).length,
  })).filter((row) => row.count > 0);

  if (active.length === 0) {
    return <p className="text-sm text-slate-500">No active-for-lease units</p>;
  }

  if (counts.length === 0) {
    return <p className="text-sm text-slate-500">No risk data for active units</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={counts} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip formatter={(value: number) => [value, "Units"]} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {counts.map((entry) => (
            <Cell key={entry.name} fill={RISK_COLORS[entry.name] ?? "#94a3b8"} />
          ))}
          <LabelList
            dataKey="count"
            position="top"
            className="fill-slate-800 text-xs font-bold"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
