"""End-to-end processing: ingest → transform → metrics."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from app.ingest import ingest_bytes, ingest_dataframe, ingest_path
from app.metrics import (
    compute_kpis,
    forecast_days_on_market,
    property_summaries,
    status_breakdown,
    unit_recommendations,
    workload_by_owner,
)
from app.models import IngestReport, ProcessedDataset
from app.transform import dataframe_to_records, enrich_dataframe


def _build_dataset(mapped: pd.DataFrame, ingest_report: IngestReport) -> ProcessedDataset:
    enriched = enrich_dataframe(mapped)
    units = dataframe_to_records(enriched)

    for unit in units:
        row = enriched.loc[enriched["unit_key"] == unit["unit_key"]].iloc[0]
        unit["recommendations"] = unit_recommendations(row)

    return ProcessedDataset(
        ingest=ingest_report,
        kpis=compute_kpis(enriched),
        properties=property_summaries(enriched),
        units=units,
        status_breakdown=status_breakdown(enriched),
        workload_by_owner=workload_by_owner(enriched),
    )


def process_dataframe(df: pd.DataFrame, filename: str = "upload") -> ProcessedDataset:
    mapped, ingest_report = ingest_dataframe(df, filename=filename)
    if ingest_report.missing_required:
        raise ValueError(
            "Missing required columns: "
            + ", ".join(ingest_report.missing_required)
            + ". Expected property, unit, and status fields."
        )
    return _build_dataset(mapped, ingest_report)


def process_bytes(file_bytes: bytes, filename: str) -> ProcessedDataset:
    mapped, ingest_report = ingest_bytes(file_bytes, filename)
    if ingest_report.missing_required:
        raise ValueError(
            "Missing required columns: "
            + ", ".join(ingest_report.missing_required)
            + ". Expected property, unit, and status fields."
        )
    return _build_dataset(mapped, ingest_report)


def process_path(path: str | Path) -> ProcessedDataset:
    mapped, ingest_report = ingest_path(path)
    if ingest_report.missing_required:
        raise ValueError(
            "Missing required columns: "
            + ", ".join(ingest_report.missing_required)
        )
    return _build_dataset(mapped, ingest_report)


def process_bytes_with_meta(file_bytes: bytes, filename: str) -> dict[str, Any]:
    """Full payload including DOM forecast (for API responses in later steps)."""
    mapped, ingest_report = ingest_bytes(file_bytes, filename)
    if ingest_report.missing_required:
        raise ValueError(
            "Missing required columns: " + ", ".join(ingest_report.missing_required)
        )
    enriched = enrich_dataframe(mapped)
    dataset = _build_dataset(mapped, ingest_report)
    payload = dataset.model_dump()
    payload["forecast"] = forecast_days_on_market(enriched)
    return payload
