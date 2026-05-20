"""KPI aggregation, recommendations, and lightweight forecasting."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.models import KpiSummary, PropertySummary
from app.transform import categorize_risk


def _safe_rate(numerator: float, denominator: float) -> float | None:
    if denominator <= 0:
        return None
    return round(numerator / denominator * 100, 1)


def compute_kpis(df: pd.DataFrame) -> KpiSummary:
    active = df[df["is_active_for_lease"]] if "is_active_for_lease" in df.columns else df.iloc[0:0]

    inquiries = active["inquiries"].fillna(0) if "inquiries" in active.columns else pd.Series(dtype=float)
    showings = active["showings"].fillna(0) if "showings" in active.columns else pd.Series(dtype=float)
    apps = (
        active["application_received_bool"].fillna(False)
        if "application_received_bool" in active.columns
        else pd.Series(dtype=bool)
    )
    leases = (
        active["lease_signed_bool"].fillna(False)
        if "lease_signed_bool" in active.columns
        else pd.Series(dtype=bool)
    )

    overpriced = 0
    if "price_variance_pct" in active.columns:
        overpriced = int((active["price_variance_pct"] > 5).sum())

    return KpiSummary(
        total_units=len(df),
        vacant_units=int(df["is_vacant"].sum()) if "is_vacant" in df.columns else 0,
        active_for_lease_units=len(active),
        leased_units=int(df["is_leased"].sum()) if "is_leased" in df.columns else 0,
        upcoming_lease_expirations_60d=int(df["lease_expiring_60d"].sum())
        if "lease_expiring_60d" in df.columns
        else 0,
        incomplete_records=int(df["incomplete_record"].sum())
        if "incomplete_record" in df.columns
        else 0,
        at_risk_units=int((df["risk_category"] == "At Risk").sum())
        if "risk_category" in df.columns
        else 0,
        critical_risk_units=int((df["risk_category"] == "Critical").sum())
        if "risk_category" in df.columns
        else 0,
        avg_days_on_market_active=round(float(active["days_on_market"].mean()), 1)
        if len(active) and "days_on_market" in active.columns and active["days_on_market"].notna().any()
        else None,
        inquiry_to_showing_rate=_safe_rate(float(showings.sum()), float(inquiries.sum())),
        showing_to_application_rate=_safe_rate(float(apps.sum()), float(showings.sum())),
        application_to_lease_rate=_safe_rate(float(leases.sum()), float(apps.sum())),
        overpriced_units=overpriced,
    )


def status_breakdown(df: pd.DataFrame) -> dict[str, int]:
    if "status" not in df.columns:
        return {}
    counts = df["status"].fillna("Unknown").astype(str).value_counts()
    return {str(k): int(v) for k, v in counts.items()}


def workload_by_owner(df: pd.DataFrame) -> dict[str, int]:
    if "owner" not in df.columns:
        return {}
    subset = df[df["is_vacant"] | (df["risk_category"].isin(["At Risk", "Critical"]))]
    if subset.empty:
        return {}
    counts = subset["owner"].fillna("Unassigned").astype(str).value_counts()
    return {str(k): int(v) for k, v in counts.items()}


def property_summaries(df: pd.DataFrame) -> list[PropertySummary]:
    if "property" not in df.columns:
        return []

    summaries: list[PropertySummary] = []
    for property_name, group in df.groupby("property", dropna=False):
        vacant = int(group["is_vacant"].sum()) if "is_vacant" in group.columns else 0
        leased = int(group["is_leased"].sum()) if "is_leased" in group.columns else 0
        total = len(group)
        occupancy = round(leased / total * 100, 1) if total else None
        avg_dom = None
        active = group[group["is_active_for_lease"]] if "is_active_for_lease" in group.columns else group.iloc[0:0]
        if len(active) and "days_on_market" in active.columns and active["days_on_market"].notna().any():
            avg_dom = round(float(active["days_on_market"].mean()), 1)

        at_risk = 0
        if "risk_category" in group.columns:
            at_risk = int(group["risk_category"].isin(["At Risk", "Critical"]).sum())

        summaries.append(
            PropertySummary(
                property=str(property_name),
                total_units=total,
                vacant_units=vacant,
                occupancy_rate=occupancy,
                avg_days_on_market=avg_dom,
                at_risk_units=at_risk,
            )
        )

    return sorted(summaries, key=lambda item: item.property)


def unit_recommendations(row: pd.Series) -> list[str]:
    """Rule-based recommendations for a single unit."""
    recs: list[str] = []

    if not row.get("is_active_for_lease", False):
        if row.get("is_leased", False):
            recs.append("Unit is leased — monitor lease expiration and renewal timeline.")
        return recs

    price_var = row.get("price_variance_pct")
    if pd.notna(price_var) and float(price_var) > 7:
        recs.append("Review pricing — asking rent is more than 7% above market; consider a 5–10% reduction.")

    dom = row.get("days_on_market")
    if pd.notna(dom) and float(dom) > 60:
        recs.append("Extended vacancy — evaluate incentives, unit condition, and repositioning strategy.")

    inquiries = row.get("inquiries")
    if pd.notna(dom) and pd.notna(inquiries) and float(dom) > 20 and float(inquiries) < 3:
        recs.append("Low inquiry volume — refresh listing photos, expand ad channels, and add virtual tours.")

    if pd.notna(inquiries) and float(inquiries) > 0:
        showings = row.get("showings") or 0
        rate = float(showings) / float(inquiries) * 100
        if rate < 40:
            recs.append(
                "Poor inquiry-to-showing conversion — improve agent follow-up and showing availability."
            )

    apps = row.get("application_received_bool")
    if apps is False and pd.notna(showings) and float(showings) > 2:
        recs.append("Showings without applications — review screening criteria and application process friction.")

    if row.get("incomplete_record"):
        recs.append("Incomplete record — fill missing rent, status, or ownership fields before next ops review.")

    if not recs:
        category = row.get("risk_category", "On Track")
        if category == "On Track":
            recs.append("Performing on track — maintain current pricing and marketing approach.")
        else:
            recs.append("Monitor weekly — early risk signals present but no single dominant issue.")

    return recs


def forecast_days_on_market(df: pd.DataFrame) -> dict[str, Any]:
    """
    Lightweight forecast: median DOM for active units by property.
    Serves as a POC baseline before a production time-series model.
    """
    if "days_on_market" not in df.columns or "property" not in df.columns:
        return {"by_property": {}, "portfolio_median": None}

    active = df[df["is_active_for_lease"]] if "is_active_for_lease" in df.columns else df
    if active.empty:
        return {"by_property": {}, "portfolio_median": None}

    by_property = (
        active.groupby("property")["days_on_market"]
        .median()
        .round(1)
        .to_dict()
    )
    portfolio_median = round(float(active["days_on_market"].median()), 1)
    return {
        "by_property": {str(k): float(v) for k, v in by_property.items()},
        "portfolio_median": portfolio_median,
    }
