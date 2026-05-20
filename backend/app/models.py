"""Pydantic models for processed leasing datasets."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class IngestReport(BaseModel):
    filename: str
    row_count: int
    source_columns: list[str]
    mapped_columns: dict[str, str]
    unmapped_columns: list[str]
    missing_required: list[str]
    missing_recommended: list[str]
    warnings: list[str] = Field(default_factory=list)


class KpiSummary(BaseModel):
    total_units: int
    vacant_units: int
    active_for_lease_units: int
    leased_units: int
    occupancy_rate: float | None
    upcoming_lease_expirations_60d: int
    incomplete_records: int
    at_risk_units: int
    critical_risk_units: int
    avg_days_on_market_active: float | None
    total_inquiries: int
    total_showings: int
    total_applications: int
    total_leases: int
    inquiry_to_showing_rate: float | None
    showing_to_application_rate: float | None
    application_to_lease_rate: float | None
    overpriced_units: int
    underpriced_units: int
    avg_price_variance_active: float | None


class PropertySummary(BaseModel):
    property: str
    total_units: int
    vacant_units: int
    occupancy_rate: float | None
    avg_days_on_market: float | None
    at_risk_units: int


class ProcessedDataset(BaseModel):
    ingest: IngestReport
    kpis: KpiSummary
    properties: list[PropertySummary]
    units: list[dict[str, Any]]
    status_breakdown: dict[str, int]
    workload_by_owner: dict[str, int]


class UploadResponse(BaseModel):
    dataset_id: str
    filename: str
    ingest: IngestReport
    kpis: KpiSummary
    status_breakdown: dict[str, int]
    filter_options: dict[str, list[str]]
    unit_count: int


class PortfolioAlert(BaseModel):
    severity: str
    title: str
    message: str
    unit_keys: list[str] = Field(default_factory=list)


class PortfolioRecommendation(BaseModel):
    priority: str
    title: str
    action: str
    unit_keys: list[str] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    dataset_id: str
    filters_applied: dict[str, Any]
    kpis: KpiSummary
    properties: list[PropertySummary]
    status_breakdown: dict[str, int]
    workload_by_owner: dict[str, int]
    forecast: dict[str, Any]
    alerts: list[PortfolioAlert] = Field(default_factory=list)
    recommendations: list[PortfolioRecommendation] = Field(default_factory=list)
    unit_count: int


class UnitsListResponse(BaseModel):
    dataset_id: str
    filters_applied: dict[str, Any]
    total: int
    units: list[dict[str, Any]]


class UnitDetailResponse(BaseModel):
    dataset_id: str
    unit: dict[str, Any]
