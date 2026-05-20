"""
Generate sample leasing exports aligned with the prior take-home (seed=42, 45 units).

Run from repo root:
  backend/.venv/Scripts/python.exe backend/scripts/generate_sample_data.py
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"

OWNERS_BY_PROPERTY = {
    "Riverside Tower": "Jamie Chen",
    "Downtown Plaza": "Alex Rivera",
    "Eastside Apartments": "Morgan Lee",
}


def generate_units(seed: int = 42) -> pd.DataFrame:
    """Reproduce the 45-unit dataset from the first take-home notebook."""
    np.random.seed(seed)
    properties = ["Riverside Tower", "Downtown Plaza", "Eastside Apartments"]
    unit_types = ["Studio", "1BR", "2BR", "3BR"]
    rows: list[dict] = []

    for property_name in properties:
        prefix = "".join(word[0] for word in property_name.split()[:2]).upper()
        for unit_num in range(1, 16):
            unit_type = np.random.choice(unit_types, p=[0.2, 0.4, 0.25, 0.15])
            market_rent_base = {"Studio": 1200, "1BR": 1500, "2BR": 2000, "3BR": 2500}
            market_rent = market_rent_base[unit_type] + np.random.normal(0, 100)
            asking_rent = market_rent + np.random.normal(0, 150)

            is_active = np.random.random() > 0.6

            if is_active:
                days_on_market = int(
                    np.random.choice(np.concatenate([np.arange(5, 120), [120] * 5]))
                )
                inquiries = max(0, int(np.random.normal(8, 3)))
                showing_rate = np.random.uniform(0.3, 0.7)
                showings = max(0, int(inquiries * showing_rate))
                app_rate = np.random.uniform(0.3, 0.6) if showings > 0 else 0
                application_received = (
                    "Yes" if (showings > 0 and np.random.random() < app_rate) else "No"
                )
                lease_signed = (
                    "Yes"
                    if application_received == "Yes" and np.random.random() > 0.15
                    else "No"
                )
                occupancy_status = (
                    "Leased" if lease_signed == "Yes" else "Active for Lease"
                )
                lease_end_date = None
            else:
                days_on_market = int(np.random.randint(5, 60))
                inquiries = int(np.random.randint(3, 12))
                showings = int(np.random.randint(2, inquiries + 1))
                application_received = "Yes"
                lease_signed = "Yes"
                occupancy_status = "Leased"
                lease_end_date = datetime.now() + timedelta(
                    days=int(np.random.randint(30, 400))
                )

            marketing_start = datetime.now() - timedelta(
                days=int(days_on_market) + int(np.random.randint(0, 10))
            )

            notes = ""
            if asking_rent > market_rent * 1.1 and occupancy_status == "Active for Lease":
                notes = "Price above market"
            elif days_on_market > 60 and occupancy_status == "Active for Lease":
                notes = "Extended vacancy"
            elif inquiries < 5 and occupancy_status == "Active for Lease":
                notes = "Low inquiry volume"
            elif showings == 0 and inquiries > 0 and occupancy_status == "Active for Lease":
                notes = "Poor inquiry conversion"
            elif unit_type == "3BR" and occupancy_status == "Active for Lease":
                notes = "Larger unit type - harder to lease"

            rows.append(
                {
                    "property": property_name,
                    "unit": f"{prefix}-{str(unit_num).zfill(3)}",
                    "unit_type": unit_type,
                    "status": occupancy_status,
                    "asking_rent": round(asking_rent, 0),
                    "market_rent": round(market_rent, 0),
                    "days_on_market": days_on_market,
                    "inquiries": inquiries,
                    "showings": showings,
                    "application_received": application_received,
                    "lease_signed": lease_signed,
                    "marketing_start_date": marketing_start.strftime("%Y-%m-%d"),
                    "lease_end_date": lease_end_date.strftime("%Y-%m-%d")
                    if lease_end_date
                    else "",
                    "owner": OWNERS_BY_PROPERTY[property_name],
                    "notes": notes,
                }
            )

    return pd.DataFrame(rows)


def to_legacy_export(df: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "Property": df["property"],
            "Unit Number": df["unit"],
            "Unit Type": df["unit_type"],
            "Occupancy Status": df["status"],
            "Asking Rent": df["asking_rent"],
            "Market Rent": df["market_rent"],
            "Days on Market": df["days_on_market"],
            "Inquiries": df["inquiries"],
            "Showings": df["showings"],
            "Application Received": df["application_received"],
            "Lease Signed": df["lease_signed"],
            "Marketing Start Date": df["marketing_start_date"],
            "Lease End Date": df["lease_end_date"],
            "Leasing Agent": df["owner"],
            "Notes": df["notes"],
        }
    )


def to_appfolio_export(df: pd.DataFrame) -> pd.DataFrame:
    def appfolio_status(status: str) -> str:
        if status == "Leased":
            return "Occupied"
        return "Vacant-Unrented"

    # Leave a few records incomplete for workflow demo (Step 7+)
    owners = df["owner"].tolist()
    owners[4] = ""
    owners[19] = ""
    owners[33] = ""

    return pd.DataFrame(
        {
            "Property": df["property"],
            "Unit": df["unit"],
            "Unit Type": df["unit_type"],
            "Status": df["status"].map(appfolio_status),
            "Advertised Rent": df["asking_rent"],
            "Market Rent": df["market_rent"],
            "Days Vacant": df["days_on_market"],
            "Inquiries": df["inquiries"],
            "Showings": df["showings"],
            "Application Received": df["application_received"],
            "Lease Signed": df["lease_signed"],
            "Available On": df["marketing_start_date"],
            "Lease Expiration": df["lease_end_date"],
            "Property Manager": owners,
            "Notes": df["notes"],
        }
    )


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    base = generate_units()
    legacy_path = DATA_DIR / "sample_leasing_export.csv"
    appfolio_path = DATA_DIR / "sample_appfolio_export.csv"

    to_legacy_export(base).to_csv(legacy_path, index=False)
    to_appfolio_export(base).to_csv(appfolio_path, index=False)

    print(f"Wrote {legacy_path} ({len(base)} rows)")
    print(f"Wrote {appfolio_path} ({len(base)} rows)")


if __name__ == "__main__":
    main()
    sys.exit(0)
