"""Verify bundled sample files load through the pipeline."""

from __future__ import annotations

import unittest
from pathlib import Path

from app.pipeline import process_path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


class SampleDataTests(unittest.TestCase):
    def test_legacy_sample(self) -> None:
        path = DATA / "sample_leasing_export.csv"
        self.assertTrue(path.exists(), "Run backend/scripts/generate_sample_data.py first")
        dataset = process_path(path)
        self.assertEqual(dataset.kpis.total_units, 45)
        self.assertEqual(len(dataset.properties), 3)

    def test_appfolio_sample(self) -> None:
        path = DATA / "sample_appfolio_export.csv"
        self.assertTrue(path.exists())
        dataset = process_path(path)
        self.assertEqual(dataset.kpis.total_units, 45)
        self.assertGreater(dataset.kpis.vacant_units, 0)
        self.assertIn("property", dataset.ingest.mapped_columns)


if __name__ == "__main__":
    unittest.main()
