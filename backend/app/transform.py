"""Enrich canonical leasing data with derived fields and risk scoring."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import numpy as np
import pandas as pd

from app.schema import (
    ACTIVE_FOR_LEASE_KEYWORDS,
    LEASED_STATUS_KEYWORDS,
    VACANT_STATUS_KEYWORDS,
)


def _status_text(value: object) -> str:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return ""
    return str(value).strip().lower()


def is_leased_status(status: object) -> bool:
    text = _status_text(status)
    if not text:
        return False
    # AppFolio uses "Vacant-Unrented" — must not match substring "rented".
    if "unrented" in text:
        return False
    if "vacant" in text and "occupied" not in text:
        return False
    return any(k in text for k in LEASED_STATUS_KEYWORDS)


def is_vacant_status(status: object) -> bool:
    text = _status_text(status)
    if not text or is_leased_status(status):
        return False
    return any(k in text for k in VACANT_STATUS_KEYWORDS)


def is_active_for_lease_status(status: object) -> bool:
    text = _status_text(status)
    if not text or is_leased_status(status):
        return False
    return any(k in text for k in ACTIVE_FOR_LEASE_KEYWORDS)


def _to_bool(value: object) -> bool | None:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"yes", "y", "true", "1"}:
        return True
    if text in {"no", "n", "false", "0"}:
        return False
    return None


def _parse_dates(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors="coerce")


def calculate_risk_score(row: pd.Series) -> int:
    """
    Leasing risk score (0–100). Higher = more at risk.
    Ported from the prior Leasing Performance System notebook.
    """
    if not row.get("is_active_for_lease", False):
        return 0

    score = 0
    dom = row.get("days_on_market")
    if pd.notna(dom):
        dom = float(dom)
        if dom > 90:
            score += 40
        elif dom > 60:
            score += 30
        elif dom > 30:
            score += 15
        elif dom > 14:
            score += 5

    inquiries = row.get("inquiries")
    if pd.notna(inquiries):
        inquiries = float(inquiries)
        if inquiries < 2:
            score += 25
        elif inquiries < 4:
            score += 18
        elif inquiries < 6:
            score += 10
        elif inquiries < 8:
            score += 3

    showings = row.get("showings")
    showing_rate = 0.0
    if pd.notna(inquiries) and float(inquiries) > 0 and pd.notna(showings):
        showing_rate = float(showings) / float(inquiries) * 100
    if showing_rate < 25:
        score += 20
    elif showing_rate < 40:
        score += 12
    elif showing_rate < 50:
        score += 5

    price_var = row.get("price_variance_pct")
    if pd.notna(price_var):
        price_var = float(price_var)
        if price_var > 10:
            score += 15
        elif price_var > 5:
            score += 10
        elif price_var > 2:
            score += 3

    return min(score, 100)


def categorize_risk(score: int | float) -> str:
    if score == 0:
        return "Leased"
    if score <= 20:
        return "On Track"
    if score <= 45:
        return "At Risk"
    return "Critical"


def enrich_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Add derived operational fields used by metrics and the API."""
    enriched = df.copy()

    enriched["unit_key"] = (
        enriched["property"].astype(str).str.strip()
        + "|"
        + enriched["unit"].astype(str).str.strip()
    )

    enriched["is_vacant"] = enriched["status"].apply(is_vacant_status)
    enriched["is_leased"] = enriched["status"].apply(is_leased_status)
    enriched["is_active_for_lease"] = enriched["status"].apply(is_active_for_lease_status)

    for col in ("asking_rent", "market_rent", "days_on_market", "inquiries", "showings"):
        if col in enriched.columns:
            enriched[col] = pd.to_numeric(enriched[col], errors="coerce")

    if "asking_rent" in enriched.columns and "market_rent" in enriched.columns:
        enriched["price_variance_pct"] = np.where(
            enriched["market_rent"].notna() & (enriched["market_rent"] != 0),
            (
                (enriched["asking_rent"] - enriched["market_rent"])
                / enriched["market_rent"]
                * 100
            ),
            np.nan,
        )
    else:
        enriched["price_variance_pct"] = np.nan

    if "application_received" in enriched.columns:
        enriched["application_received_bool"] = enriched["application_received"].apply(
            _to_bool
        )
    else:
        enriched["application_received_bool"] = None

    if "lease_signed" in enriched.columns:
        enriched["lease_signed_bool"] = enriched["lease_signed"].apply(_to_bool)
    else:
        enriched["lease_signed_bool"] = None

    for date_col in ("marketing_start_date", "lease_end_date"):
        if date_col in enriched.columns:
            enriched[date_col] = _parse_dates(enriched[date_col])

    today = pd.Timestamp(datetime.now(UTC).date())
    if "lease_end_date" in enriched.columns:
        enriched["lease_expiring_60d"] = (
            enriched["is_leased"]
            & enriched["lease_end_date"].notna()
            & (enriched["lease_end_date"] >= today)
            & (enriched["lease_end_date"] <= today + timedelta(days=60))
        )
    else:
        enriched["lease_expiring_60d"] = False

    enriched["incomplete_record"] = enriched.apply(_flag_incomplete, axis=1)

    enriched["risk_score"] = enriched.apply(calculate_risk_score, axis=1).astype(int)
    enriched["risk_category"] = enriched["risk_score"].apply(categorize_risk)

    return enriched


def _flag_incomplete(row: pd.Series) -> bool:
    """Records missing fields that block reliable ops workflows."""
    if pd.isna(row.get("property")) or pd.isna(row.get("unit")):
        return True
    if pd.isna(row.get("status")) or str(row.get("status", "")).strip() == "":
        return True
    if row.get("is_active_for_lease") and pd.isna(row.get("asking_rent")):
        return True
    if row.get("is_active_for_lease") and pd.isna(row.get("days_on_market")):
        return True
    return False


def dataframe_to_records(df: pd.DataFrame) -> list[dict]:
    """Serialize enriched units for JSON responses."""
    export = df.copy()
    for col in export.columns:
        if pd.api.types.is_datetime64_any_dtype(export[col]):
            export[col] = export[col].dt.strftime("%Y-%m-%d").where(export[col].notna(), None)
    export = export.replace({np.nan: None})
    return export.to_dict(orient="records")
