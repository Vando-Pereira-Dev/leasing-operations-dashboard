import { useMemo } from "react";
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
import type { UnitRecord } from "@/types/api";

type DomHistogramChartProps = {
  units: UnitRecord[];
  meanDays: number | null;
};

type DomBin = {
  label: string;
  count: number;
  start: number;
  end: number;
};

function buildHistogram(units: UnitRecord[], binCount = 15): DomBin[] {
  const values = units
    .filter((u) => u.is_active_for_lease === true)
    .map((u) => Number(u.days_on_market))
    .filter((v) => !Number.isNaN(v));

  if (values.length === 0) return [];

  const max = Math.max(...values, 1);
  const binWidth = Math.max(Math.ceil(max / binCount), 5);
  const bins: DomBin[] = [];

  for (let start = 0; start <= max; start += binWidth) {
    const end = start + binWidth;
    const count = values.filter((v) => v >= start && v < end).length;
    if (count > 0) {
      bins.push({ label: `${start}-${end}`, count, start, end });
    }
  }

  return bins;
}

function meanBinLabel(bins: DomBin[], mean: number): string | undefined {
  const match = bins.find((b) => mean >= b.start && mean < b.end);
  return match?.label;
}

export function DomHistogramChart({ units, meanDays }: DomHistogramChartProps) {
  const data = useMemo(() => buildHistogram(units), [units]);
  const meanLabel =
    meanDays != null ? meanBinLabel(data, meanDays) : undefined;

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No active units for DOM distribution</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 9, fill: "#64748b" }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip
          formatter={(value: number) => [value, "Units"]}
          labelFormatter={(label) => `DOM ${label} days`}
        />
        {meanLabel != null && meanDays != null ? (
          <ReferenceLine
            x={meanLabel}
            stroke={CHART_COLORS.critical}
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{
              value: `Mean: ${meanDays}d`,
              position: "top",
              fontSize: 10,
              fill: CHART_COLORS.critical,
            }}
          />
        ) : null}
        <Bar
          dataKey="count"
          fill="#4682b4"
          fillOpacity={0.75}
          stroke="#334155"
          strokeWidth={0.5}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
