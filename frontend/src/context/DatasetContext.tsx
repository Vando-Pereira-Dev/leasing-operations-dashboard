import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  FilterOptions,
  IngestReport,
  KpiSummary,
  UploadResponse,
} from "@/types/api";
import {
  emptyFilters,
  hasActiveFilters,
  type FilterState,
} from "@/types/filters";

type DatasetContextValue = {
  datasetId: string | null;
  filename: string | null;
  kpis: KpiSummary | null;
  ingest: IngestReport | null;
  filterOptions: FilterOptions | null;
  unitCount: number;
  filters: FilterState;
  filtersActive: boolean;
  setUpload: (response: UploadResponse) => void;
  setFilters: (filters: FilterState) => void;
  patchFilters: (patch: Partial<FilterState>) => void;
  resetFilters: () => void;
  clearDataset: () => void;
};

const DatasetContext = createContext<DatasetContextValue | null>(null);

function toFilterOptions(raw: Record<string, string[]>): FilterOptions {
  return {
    property: raw.property ?? [],
    status: raw.status ?? [],
    owner: raw.owner ?? [],
    risk_category: raw.risk_category ?? [],
  };
}

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KpiSummary | null>(null);
  const [ingest, setIngest] = useState<IngestReport | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [unitCount, setUnitCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>(emptyFilters());

  const setUpload = useCallback((response: UploadResponse) => {
    setDatasetId(response.dataset_id);
    setFilename(response.filename);
    setKpis(response.kpis);
    setIngest(response.ingest);
    setFilterOptions(toFilterOptions(response.filter_options));
    setUnitCount(response.unit_count);
    setFilters(emptyFilters());
  }, []);

  const patchFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(emptyFilters());
  }, []);

  const clearDataset = useCallback(() => {
    setDatasetId(null);
    setFilename(null);
    setKpis(null);
    setIngest(null);
    setFilterOptions(null);
    setUnitCount(0);
    setFilters(emptyFilters());
  }, []);

  const filtersActive = hasActiveFilters(filters);

  const value = useMemo(
    () => ({
      datasetId,
      filename,
      kpis,
      ingest,
      filterOptions,
      unitCount,
      filters,
      filtersActive,
      setUpload,
      setFilters,
      patchFilters,
      resetFilters,
      clearDataset,
    }),
    [
      datasetId,
      filename,
      kpis,
      ingest,
      filterOptions,
      unitCount,
      filters,
      filtersActive,
      setUpload,
      patchFilters,
      resetFilters,
      clearDataset,
    ],
  );

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) {
    throw new Error("useDataset must be used within DatasetProvider");
  }
  return ctx;
}
