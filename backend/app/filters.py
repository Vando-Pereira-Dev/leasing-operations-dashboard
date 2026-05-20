"""Query filters for dashboard and unit list endpoints."""

from __future__ import annotations

from datetime import date
from typing import Literal

import pandas as pd
from pydantic import BaseModel, Field


class FilterQuery(BaseModel):
    property: list[str] = Field(default_factory=list)
    status: list[str] = Field(default_factory=list)
    owner: list[str] = Field(default_factory=list)
    risk_category: list[str] = Field(default_factory=list)
    date_from: date | None = None
    date_to: date | None = None
    date_field: Literal["marketing_start_date", "lease_end_date"] = "marketing_start_date"


def apply_filters(df: pd.DataFrame, query: FilterQuery) -> pd.DataFrame:
    """Return a filtered copy of the enriched unit dataframe."""
    result = df.copy()

    if query.property and "property" in result.columns:
        result = result[result["property"].astype(str).isin(query.property)]

    if query.status and "status" in result.columns:
        result = result[result["status"].astype(str).isin(query.status)]

    if query.owner and "owner" in result.columns:
        owners = [o if o != "Unassigned" else "" for o in query.owner]
        series = result["owner"].fillna("").astype(str)
        if "Unassigned" in query.owner:
            mask = series.isin(owners) | (series.str.strip() == "")
        else:
            mask = series.isin(owners)
        result = result[mask]

    if query.risk_category and "risk_category" in result.columns:
        result = result[result["risk_category"].astype(str).isin(query.risk_category)]

    if query.date_from or query.date_to:
        field = query.date_field
        if field in result.columns:
            dates = pd.to_datetime(result[field], errors="coerce")
            if query.date_from:
                result = result[dates >= pd.Timestamp(query.date_from)]
            if query.date_to:
                result = result[dates <= pd.Timestamp(query.date_to)]

    return result


def filter_options(df: pd.DataFrame) -> dict[str, list[str]]:
    """Distinct values for sidebar filter controls."""
    options: dict[str, list[str]] = {
        "property": sorted(df["property"].dropna().astype(str).unique().tolist())
        if "property" in df.columns
        else [],
        "status": sorted(df["status"].dropna().astype(str).unique().tolist())
        if "status" in df.columns
        else [],
        "owner": [],
        "risk_category": sorted(df["risk_category"].dropna().astype(str).unique().tolist())
        if "risk_category" in df.columns
        else [],
    }

    if "owner" in df.columns:
        owners = df["owner"].fillna("").astype(str).str.strip()
        unique = sorted({o for o in owners.unique().tolist() if o})
        if (owners == "").any():
            unique.append("Unassigned")
        options["owner"] = unique

    return options
