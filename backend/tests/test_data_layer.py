"""Tests for ingest, transform, and metrics pipeline."""

from __future__ import annotations

import io
import unittest

import pandas as pd

from app.ingest import ingest_dataframe
from app.metrics import compute_kpis, unit_recommendations
from app.pipeline import process_bytes, process_dataframe
from app.transform import enrich_dataframe


SAMPLE_CSV = """Property,Unit,Unit Type,Status,Advertised Rent,Market Rent,Days Vacant,Inquiries,Showings,Application Received,Lease Signed,Available On,Lease Expiration,Property Manager,Notes
Riverside Tower,RT-101,1BR,Vacant-Unrented,1550,1480,72,4,2,No,No,2026-02-08,,Jamie Chen,Extended vacancy
Riverside Tower,RT-102,2BR,Occupied,1600,1580,0,0,0,No,No,,2026-08-15,Jamie Chen,
Downtown Plaza,DP-201,Studio,Vacant-Unrented,1300,1250,45,8,5,Yes,No,2026-03-01,,Alex Rivera,Low showing conversion
Eastside Apartments,EA-301,3BR,Vacant-Unrented,2400,2200,95,1,0,No,No,2025-11-01,,,Price above market
"""


class DataLayerTests(unittest.TestCase):
    def test_column_mapping_appfolio_style(self) -> None:
        raw = pd.read_csv(io.StringIO(SAMPLE_CSV))
        mapped, report = ingest_dataframe(raw, filename="sample.csv")

        self.assertIn("property", mapped.columns)
        self.assertIn("days_on_market", mapped.columns)
        self.assertIn("owner", mapped.columns)
        self.assertEqual(report.mapped_columns["property"], "Property")
        self.assertEqual(len(report.missing_required), 0)

    def test_risk_scoring_critical_unit(self) -> None:
        raw = pd.read_csv(io.StringIO(SAMPLE_CSV))
        mapped, _ = ingest_dataframe(raw)
        enriched = enrich_dataframe(mapped)
        critical = enriched[enriched["unit"] == "EA-301"].iloc[0]

        self.assertEqual(critical["risk_category"], "Critical")
        self.assertGreaterEqual(critical["risk_score"], 46)
        recs = unit_recommendations(critical)
        self.assertTrue(any("pricing" in r.lower() or "vacancy" in r.lower() for r in recs))

    def test_pipeline_kpis(self) -> None:
        dataset = process_bytes(SAMPLE_CSV.encode("utf-8"), "sample.csv")

        self.assertEqual(dataset.kpis.total_units, 4)
        self.assertGreaterEqual(dataset.kpis.vacant_units, 3)
        self.assertGreaterEqual(dataset.kpis.critical_risk_units, 1)
        self.assertEqual(len(dataset.units), 4)
        self.assertTrue(all("recommendations" in unit for unit in dataset.units))

    def test_legacy_column_names(self) -> None:
        legacy = pd.DataFrame(
            [
                {
                    "Property": "Test Park",
                    "Unit Number": "TP-01",
                    "Unit Type": "1BR",
                    "Occupancy Status": "Active for Lease",
                    "Asking Rent": 1500,
                    "Market Rent": 1450,
                    "Days on Market": 30,
                    "Inquiries": 5,
                    "Showings": 3,
                    "Application Received": "No",
                    "Lease Signed": "No",
                    "Marketing Start Date": "2026-01-01",
                    "Notes": "",
                }
            ]
        )
        dataset = process_dataframe(legacy)
        self.assertEqual(dataset.kpis.total_units, 1)
        self.assertEqual(dataset.units[0]["property"], "Test Park")


if __name__ == "__main__":
    unittest.main()
