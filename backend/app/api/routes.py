"""REST endpoints for upload, dashboard KPIs, and unit detail."""

from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Annotated, Any, Literal
from urllib.parse import unquote

import pandas as pd
from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.filters import FilterQuery, apply_filters, filter_options
from app.metrics import (
    forecast_days_on_market,
    portfolio_alerts,
    portfolio_recommendations,
    unit_recommendations,
)
from app.models import (
    DashboardResponse,
    ProcessedDataset,
    UnitDetailResponse,
    UnitsListResponse,
    UploadResponse,
)
from app.pipeline import process_bytes_stored
from app.store import StoredDataset, dataset_store
from app.transform import dataframe_to_records

router = APIRouter()

SAMPLE_FILES = {
    "appfolio": "sample_appfolio_export.csv",
    "legacy": "sample_leasing_export.csv",
}
DATA_DIR = Path(__file__).resolve().parents[3] / "data"


def _parse_filter_query(
    property: Annotated[list[str] | None, Query()] = None,
    status: Annotated[list[str] | None, Query()] = None,
    owner: Annotated[list[str] | None, Query()] = None,
    risk_category: Annotated[list[str] | None, Query()] = None,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    date_field: Annotated[
        Literal["marketing_start_date", "lease_end_date"],
        Query(),
    ] = "marketing_start_date",
) -> FilterQuery:
    return FilterQuery(
        property=property or [],
        status=status or [],
        owner=owner or [],
        risk_category=risk_category or [],
        date_from=date_from,
        date_to=date_to,
        date_field=date_field,
    )


def _get_stored(dataset_id: str) -> StoredDataset:
    record = dataset_store.get(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found. Upload a file first.")
    return record


def _build_view(record: StoredDataset, frame: pd.DataFrame) -> dict[str, Any]:
    """Compute dashboard fields for a (possibly filtered) dataframe."""
    from app.pipeline import _build_dataset

    view = _build_dataset(frame, record.ingest, enriched=frame)
    return {
        "kpis": view.kpis,
        "properties": view.properties,
        "status_breakdown": view.status_breakdown,
        "workload_by_owner": view.workload_by_owner,
        "units": view.units,
    }


def _store_upload(filename: str, file_bytes: bytes) -> UploadResponse:
    try:
        dataset, enriched, ingest = process_bytes_stored(file_bytes, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    record = dataset_store.save(filename, ingest, enriched)
    options = filter_options(enriched)

    return UploadResponse(
        dataset_id=record.id,
        filename=filename,
        ingest=ingest,
        kpis=dataset.kpis,
        status_breakdown=dataset.status_breakdown,
        filter_options=options,
        unit_count=len(enriched),
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)) -> UploadResponse:
    """Upload CSV/XLSX; returns dataset id and initial KPIs."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    return _store_upload(file.filename, content)


@router.post("/samples/{sample_name}", response_model=UploadResponse)
def load_sample(sample_name: str) -> UploadResponse:
    """Load bundled demo export (appfolio | legacy)."""
    key = sample_name.lower()
    if key not in SAMPLE_FILES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown sample. Use one of: {', '.join(SAMPLE_FILES)}",
        )
    path = DATA_DIR / SAMPLE_FILES[key]
    if not path.exists():
        raise HTTPException(status_code=404, detail="Sample file missing on server.")
    return _store_upload(path.name, path.read_bytes())


@router.get("/datasets/{dataset_id}/filter-options")
def get_filter_options(dataset_id: str) -> dict[str, list[str]]:
    record = _get_stored(dataset_id)
    return filter_options(record.enriched)


@router.get("/datasets/{dataset_id}/dashboard", response_model=DashboardResponse)
def get_dashboard(
    dataset_id: str,
    property: Annotated[list[str] | None, Query()] = None,
    status: Annotated[list[str] | None, Query()] = None,
    owner: Annotated[list[str] | None, Query()] = None,
    risk_category: Annotated[list[str] | None, Query()] = None,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    date_field: Annotated[
        Literal["marketing_start_date", "lease_end_date"],
        Query(),
    ] = "marketing_start_date",
) -> DashboardResponse:
    record = _get_stored(dataset_id)
    query = _parse_filter_query(
        property=property,
        status=status,
        owner=owner,
        risk_category=risk_category,
        date_from=date_from,
        date_to=date_to,
        date_field=date_field,
    )
    filtered = apply_filters(record.enriched, query)
    view = _build_view(record, filtered)

    return DashboardResponse(
        dataset_id=dataset_id,
        filters_applied=query.model_dump(mode="json"),
        kpis=view["kpis"],
        properties=view["properties"],
        status_breakdown=view["status_breakdown"],
        workload_by_owner=view["workload_by_owner"],
        forecast=forecast_days_on_market(filtered),
        alerts=portfolio_alerts(filtered),
        recommendations=portfolio_recommendations(filtered),
        unit_count=len(filtered),
    )


@router.get("/datasets/{dataset_id}/units", response_model=UnitsListResponse)
def list_units(
    dataset_id: str,
    property: Annotated[list[str] | None, Query()] = None,
    status: Annotated[list[str] | None, Query()] = None,
    owner: Annotated[list[str] | None, Query()] = None,
    risk_category: Annotated[list[str] | None, Query()] = None,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    date_field: Annotated[
        Literal["marketing_start_date", "lease_end_date"],
        Query(),
    ] = "marketing_start_date",
) -> UnitsListResponse:
    record = _get_stored(dataset_id)
    query = _parse_filter_query(
        property=property,
        status=status,
        owner=owner,
        risk_category=risk_category,
        date_from=date_from,
        date_to=date_to,
        date_field=date_field,
    )
    filtered = apply_filters(record.enriched, query)
    units = dataframe_to_records(filtered)
    for unit in units:
        row = filtered.loc[filtered["unit_key"] == unit["unit_key"]].iloc[0]
        unit["recommendations"] = unit_recommendations(row)

    return UnitsListResponse(
        dataset_id=dataset_id,
        filters_applied=query.model_dump(mode="json"),
        total=len(units),
        units=units,
    )


@router.get("/datasets/{dataset_id}/units/{unit_key:path}", response_model=UnitDetailResponse)
def get_unit_detail(dataset_id: str, unit_key: str) -> UnitDetailResponse:
    record = _get_stored(dataset_id)
    decoded_key = unquote(unit_key)
    matches = record.enriched[record.enriched["unit_key"] == decoded_key]
    if matches.empty:
        raise HTTPException(status_code=404, detail="Unit not found.")

    row = matches.iloc[0]
    unit = dataframe_to_records(matches)[0]
    unit["recommendations"] = unit_recommendations(row)

    return UnitDetailResponse(dataset_id=dataset_id, unit=unit)


@router.get("/datasets/{dataset_id}", response_model=ProcessedDataset)
def get_dataset(dataset_id: str) -> ProcessedDataset:
    """Full unfiltered dataset snapshot."""
    record = _get_stored(dataset_id)
    view = _build_view(record, record.enriched)
    return ProcessedDataset(
        ingest=record.ingest,
        kpis=view["kpis"],
        properties=view["properties"],
        units=view["units"],
        status_breakdown=view["status_breakdown"],
        workload_by_owner=view["workload_by_owner"],
    )
