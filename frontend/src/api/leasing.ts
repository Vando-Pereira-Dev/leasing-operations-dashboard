import { apiRequest, apiUpload } from "@/api/client";
import type {
  DashboardResponse,
  FilterOptions,
  HealthResponse,
  UnitDetailResponse,
  UnitsListResponse,
  UploadResponse,
} from "@/types/api";
import type { FilterState } from "@/types/filters";
import { filtersToSearchParams } from "@/types/filters";

export type SampleName = "appfolio" | "legacy";

export function fetchHealth() {
  return apiRequest<HealthResponse>("/health");
}

export function uploadFile(file: File) {
  return apiUpload<UploadResponse>("/upload", file);
}

export function loadSample(name: SampleName) {
  return apiRequest<UploadResponse>(`/samples/${name}`, { method: "POST" });
}

export function fetchFilterOptions(datasetId: string) {
  return apiRequest<FilterOptions>(`/datasets/${datasetId}/filter-options`);
}

export function fetchDashboard(datasetId: string, filters?: FilterState) {
  const query = filters ? `?${filtersToSearchParams(filters)}` : "";
  return apiRequest<DashboardResponse>(
    `/datasets/${datasetId}/dashboard${query}`,
  );
}

export function fetchUnits(datasetId: string, filters?: FilterState) {
  const query = filters ? `?${filtersToSearchParams(filters)}` : "";
  return apiRequest<UnitsListResponse>(`/datasets/${datasetId}/units${query}`);
}

export function fetchUnitDetail(datasetId: string, unitKey: string) {
  const encoded = encodeURIComponent(unitKey);
  return apiRequest<UnitDetailResponse>(
    `/datasets/${datasetId}/units/${encoded}`,
  );
}
