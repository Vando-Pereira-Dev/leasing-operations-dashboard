export const CHART_COLORS = {
  critical: "#dc2626",
  atRisk: "#f59e0b",
  onTrack: "#16a34a",
  leased: "#94a3b8",
  primary: "#2563eb",
  secondary: "#7c3aed",
  slate: "#64748b",
};

export const RISK_COLORS: Record<string, string> = {
  Critical: CHART_COLORS.critical,
  "At Risk": CHART_COLORS.atRisk,
  "On Track": CHART_COLORS.onTrack,
  Leased: CHART_COLORS.leased,
};
