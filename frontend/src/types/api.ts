export type IngestReport = {
  filename: string;
  row_count: number;
  source_columns: string[];
  mapped_columns: Record<string, string>;
  unmapped_columns: string[];
  missing_required: string[];
  missing_recommended: string[];
  warnings: string[];
};

export type KpiSummary = {
  total_units: number;
  vacant_units: number;
  active_for_lease_units: number;
  leased_units: number;
  upcoming_lease_expirations_60d: number;
  incomplete_records: number;
  at_risk_units: number;
  critical_risk_units: number;
  avg_days_on_market_active: number | null;
  inquiry_to_showing_rate: number | null;
  showing_to_application_rate: number | null;
  application_to_lease_rate: number | null;
  overpriced_units: number;
};

export type PropertySummary = {
  property: string;
  total_units: number;
  vacant_units: number;
  occupancy_rate: number | null;
  avg_days_on_market: number | null;
  at_risk_units: number;
};

export type UnitRecord = {
  unit_key: string;
  property: string;
  unit: string;
  unit_type?: string;
  status?: string;
  asking_rent?: number;
  market_rent?: number;
  days_on_market?: number;
  inquiries?: number;
  showings?: number;
  risk_score?: number;
  risk_category?: string;
  owner?: string;
  notes?: string;
  recommendations?: string[];
  [key: string]: unknown;
};

export type UploadResponse = {
  dataset_id: string;
  filename: string;
  ingest: IngestReport;
  kpis: KpiSummary;
  status_breakdown: Record<string, number>;
  filter_options: Record<string, string[]>;
  unit_count: number;
};

export type DashboardResponse = {
  dataset_id: string;
  filters_applied: Record<string, unknown>;
  kpis: KpiSummary;
  properties: PropertySummary[];
  status_breakdown: Record<string, number>;
  workload_by_owner: Record<string, number>;
  forecast: {
    by_property: Record<string, number>;
    portfolio_median: number | null;
  };
  unit_count: number;
};

export type UnitsListResponse = {
  dataset_id: string;
  filters_applied: Record<string, unknown>;
  total: number;
  units: UnitRecord[];
};

export type UnitDetailResponse = {
  dataset_id: string;
  unit: UnitRecord;
};

export type FilterOptions = {
  property: string[];
  status: string[];
  owner: string[];
  risk_category: string[];
};

export type HealthResponse = {
  status: string;
  service: string;
};

export type ApiError = {
  detail: string;
};
