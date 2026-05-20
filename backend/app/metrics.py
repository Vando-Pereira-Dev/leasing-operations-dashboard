"""KPI aggregation, recommendations, and lightweight forecasting."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.models import (
    KpiSummary,
    PortfolioAlert,
    PortfolioRecommendation,
    PropertySummary,
)
from app.transform import categorize_risk


def _safe_rate(numerator: float, denominator: float) -> float | None:
    if denominator <= 0:
        return None
    return round(numerator / denominator * 100, 1)


def compute_kpis(df: pd.DataFrame) -> KpiSummary:
    active = df[df["is_active_for_lease"]] if "is_active_for_lease" in df.columns else df.iloc[0:0]
    leased = int(df["is_leased"].sum()) if "is_leased" in df.columns else 0
    total = len(df)
    occupancy = round(leased / total * 100, 1) if total else None

    # Portfolio-wide funnel totals (aligned with first take-home notebook)
    inquiries_total = int(df["inquiries"].fillna(0).sum()) if "inquiries" in df.columns else 0
    showings_total = int(df["showings"].fillna(0).sum()) if "showings" in df.columns else 0
    if "application_received_bool" in df.columns:
        applications_total = int(df["application_received_bool"].fillna(False).sum())
    else:
        applications_total = 0
    if "lease_signed_bool" in df.columns:
        leases_total = int(df["lease_signed_bool"].fillna(False).sum())
    else:
        leases_total = 0

    overpriced = 0
    underpriced = 0
    avg_price_variance = None
    if "price_variance_pct" in active.columns and len(active):
        overpriced = int((active["price_variance_pct"] > 5).sum())
        underpriced = int((active["price_variance_pct"] < -5).sum())
        avg_price_variance = round(float(active["price_variance_pct"].mean()), 1)

    return KpiSummary(
        total_units=total,
        vacant_units=int(df["is_vacant"].sum()) if "is_vacant" in df.columns else 0,
        active_for_lease_units=len(active),
        leased_units=leased,
        occupancy_rate=occupancy,
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
        total_inquiries=inquiries_total,
        total_showings=showings_total,
        total_applications=applications_total,
        total_leases=leases_total,
        inquiry_to_showing_rate=_safe_rate(float(showings_total), float(inquiries_total)),
        showing_to_application_rate=_safe_rate(
            float(applications_total), float(showings_total)
        ),
        application_to_lease_rate=_safe_rate(float(leases_total), float(applications_total)),
        overpriced_units=overpriced,
        underpriced_units=underpriced,
        avg_price_variance_active=avg_price_variance,
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


def portfolio_alerts(df: pd.DataFrame) -> list[PortfolioAlert]:
    """Surface portfolio-level issues for ops leadership."""
    alerts: list[PortfolioAlert] = []

    if "incomplete_record" in df.columns:
        incomplete = df[df["incomplete_record"]]
        if len(incomplete) > 0:
            alerts.append(
                PortfolioAlert(
                    severity="warning",
                    title="Incomplete records",
                    message=f"{len(incomplete)} unit(s) missing required operational fields.",
                    unit_keys=incomplete["unit_key"].astype(str).tolist()[:8],
                )
            )

    if "risk_category" in df.columns:
        critical = df[df["risk_category"] == "Critical"]
        if len(critical) > 0:
            alerts.append(
                PortfolioAlert(
                    severity="critical",
                    title="Critical leasing risk",
                    message=f"{len(critical)} unit(s) need immediate leasing intervention.",
                    unit_keys=critical["unit_key"].astype(str).tolist()[:8],
                )
            )

    if "lease_expiring_60d" in df.columns:
        expiring = df[df["lease_expiring_60d"]]
        if len(expiring) > 0:
            alerts.append(
                PortfolioAlert(
                    severity="warning",
                    title="Upcoming lease expirations",
                    message=f"{len(expiring)} lease(s) expire within 60 days — plan renewals.",
                    unit_keys=expiring["unit_key"].astype(str).tolist()[:8],
                )
            )

    active = df[df["is_active_for_lease"]] if "is_active_for_lease" in df.columns else df.iloc[0:0]
    if len(active) and "price_variance_pct" in active.columns:
        overpriced = active[active["price_variance_pct"] > 7]
        if len(overpriced) > 0:
            alerts.append(
                PortfolioAlert(
                    severity="warning",
                    title="Overpriced active units",
                    message=f"{len(overpriced)} active unit(s) priced >7% above market.",
                    unit_keys=overpriced["unit_key"].astype(str).tolist()[:8],
                )
            )

    if len(active) and "days_on_market" in active.columns:
        extended = active[active["days_on_market"] > 75]
        if len(extended) > 0:
            alerts.append(
                PortfolioAlert(
                    severity="critical",
                    title="Extended vacancies",
                    message=f"{len(extended)} unit(s) vacant 75+ days on market.",
                    unit_keys=extended["unit_key"].astype(str).tolist()[:8],
                )
            )

    if not alerts:
        alerts.append(
            PortfolioAlert(
                severity="info",
                title="Portfolio stable",
                message="No critical alert thresholds triggered for the current view.",
                unit_keys=[],
            )
        )

    return alerts


def portfolio_recommendations(df: pd.DataFrame) -> list[PortfolioRecommendation]:
    """Portfolio-level actions aligned with the first take-home playbook."""
    recs: list[PortfolioRecommendation] = []
    active = df[df["is_active_for_lease"]] if "is_active_for_lease" in df.columns else df.iloc[0:0]

    if len(active) and "price_variance_pct" in active.columns:
        overpriced = active[active["price_variance_pct"] > 7]
        if len(overpriced) > 0:
            units = overpriced["unit"].astype(str).head(3).tolist()
            recs.append(
                PortfolioRecommendation(
                    priority="immediate",
                    title="Pricing review",
                    action=(
                        f"Review and reduce pricing on {', '.join(units)}"
                        f"{'…' if len(overpriced) > 3 else ''}. "
                        "Consider a 5–10% market adjustment to improve competitiveness."
                    ),
                    unit_keys=overpriced["unit_key"].astype(str).tolist()[:10],
                )
            )

    if len(active) and "days_on_market" in active.columns:
        extended = active[active["days_on_market"] > 75]
        if len(extended) > 0:
            units = extended["unit"].astype(str).tolist()
            recs.append(
                PortfolioRecommendation(
                    priority="immediate",
                    title="Extended vacancy strategy",
                    action=(
                        f"Immediate review for {', '.join(units[:3])}"
                        f"{', …' if len(units) > 3 else ''}: incentives, "
                        "unit improvements, or repositioning."
                    ),
                    unit_keys=extended["unit_key"].astype(str).tolist()[:10],
                )
            )

    if len(active) and "inquiries" in active.columns and "days_on_market" in active.columns:
        low_inquiry = active[(active["inquiries"] < 3) & (active["days_on_market"] > 20)]
        if len(low_inquiry) > 0:
            units = low_inquiry["unit"].astype(str).head(3).tolist()
            recs.append(
                PortfolioRecommendation(
                    priority="high",
                    title="Marketing boost",
                    action=(
                        f"Increase marketing for {', '.join(units)}: refreshed photos, "
                        "broader listings, and virtual tours."
                    ),
                    unit_keys=low_inquiry["unit_key"].astype(str).tolist()[:10],
                )
            )

    if len(active) and "inquiries" in active.columns and "showings" in active.columns:
        poor = active[
            active["inquiries"].fillna(0) > 0
        ].copy()
        poor["rate"] = poor["showings"].fillna(0) / poor["inquiries"] * 100
        poor = poor[poor["rate"] < 40]
        if len(poor) > 0:
            units = poor["unit"].astype(str).head(3).tolist()
            recs.append(
                PortfolioRecommendation(
                    priority="high",
                    title="Leasing follow-up",
                    action=(
                        f"Improve agent follow-up for {', '.join(units)} — faster responses "
                        "and flexible showing times."
                    ),
                    unit_keys=poor["unit_key"].astype(str).tolist()[:10],
                )
            )

    if "risk_category" in df.columns:
        performers = df[(df["risk_category"] == "On Track") & df["is_active_for_lease"]]
        if len(performers) > 0:
            units = performers["unit"].astype(str).head(2).tolist()
            recs.append(
                PortfolioRecommendation(
                    priority="medium",
                    title="Replicate winners",
                    action=(
                        f"Document success factors from {', '.join(units)} and apply "
                        "learnings to slower units."
                    ),
                    unit_keys=performers["unit_key"].astype(str).tolist()[:5],
                )
            )

    if "property" in df.columns and "days_on_market" in df.columns:
        type_perf = (
            active.groupby("unit_type")["days_on_market"].mean().sort_values(ascending=False)
            if len(active) and "unit_type" in active.columns
            else pd.Series(dtype=float)
        )
        if len(type_perf) and type_perf.iloc[0] > 45:
            slow_type = str(type_perf.index[0])
            recs.append(
                PortfolioRecommendation(
                    priority="strategic",
                    title="Unit type focus",
                    action=(
                        f"{slow_type} units average {round(float(type_perf.iloc[0]), 0)} DOM — "
                        f"build targeted leasing playbook for this segment."
                    ),
                    unit_keys=[],
                )
            )

    if not recs:
        recs.append(
            PortfolioRecommendation(
                priority="medium",
                title="Maintain momentum",
                action="Continue weekly KPI reviews; no urgent portfolio-wide actions detected.",
                unit_keys=[],
            )
        )

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
