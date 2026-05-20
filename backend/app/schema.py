"""Canonical leasing schema and export column aliases (AppFolio + legacy)."""

from __future__ import annotations

from typing import Final

# Internal column names used across ingest, transform, and metrics.
CANONICAL_COLUMNS: Final[tuple[str, ...]] = (
    "property",
    "unit",
    "unit_type",
    "status",
    "asking_rent",
    "market_rent",
    "days_on_market",
    "inquiries",
    "showings",
    "application_received",
    "lease_signed",
    "marketing_start_date",
    "lease_end_date",
    "owner",
    "notes",
)

# Minimum columns required to load and identify units.
REQUIRED_COLUMNS: Final[tuple[str, ...]] = ("property", "unit", "status")

# Columns needed for full KPI and risk analytics (warn if missing).
RECOMMENDED_COLUMNS: Final[tuple[str, ...]] = (
    "asking_rent",
    "market_rent",
    "days_on_market",
    "inquiries",
    "showings",
    "marketing_start_date",
)

# Map canonical name -> possible export header variants (lowercase, normalized).
COLUMN_ALIASES: Final[dict[str, tuple[str, ...]]] = {
    "property": ("property", "property_name", "property_name_"),
    "unit": ("unit", "unit_number", "unit_name", "unit_", "unit_id"),
    "unit_type": ("unit_type", "bedrooms", "beds", "type"),
    "status": (
        "status",
        "occupancy_status",
        "leasing_status",
        "unit_status",
        "occupancy",
    ),
    "asking_rent": (
        "asking_rent",
        "advertised_rent",
        "rent",
        "listed_rent",
        "current_rent",
    ),
    "market_rent": ("market_rent", "market_rent_estimate", "comparable_rent"),
    "days_on_market": ("days_on_market", "days_vacant", "dom", "days_on_market_"),
    "inquiries": ("inquiries", "leads", "inquiry_count", "prospect_count"),
    "showings": ("showings", "tours", "showing_count"),
    "application_received": (
        "application_received",
        "has_application",
        "application",
        "application_yes_no",
    ),
    "lease_signed": ("lease_signed", "lease_executed", "signed_lease"),
    "marketing_start_date": (
        "marketing_start_date",
        "available_on",
        "listed_date",
        "listing_date",
        "marketing_start",
    ),
    "lease_end_date": (
        "lease_end_date",
        "lease_expiration",
        "lease_end",
        "expiration_date",
        "lease_exp",
    ),
    "owner": (
        "owner",
        "property_manager",
        "assigned_to",
        "leasing_agent",
        "agent",
        "team_member",
    ),
    "notes": ("notes", "comments", "concern", "reason_for_concern"),
}

VACANT_STATUS_KEYWORDS: Final[tuple[str, ...]] = (
    "vacant",
    "unrented",
    "available",
    "active for lease",
    "for lease",
    "on market",
    "listed",
)

LEASED_STATUS_KEYWORDS: Final[tuple[str, ...]] = (
    "leased",
    "occupied",
    "rented",
)

ACTIVE_FOR_LEASE_KEYWORDS: Final[tuple[str, ...]] = (
    "active for lease",
    "for lease",
    "on market",
    "listed",
    "vacant",
    "unrented",
    "available",
)
