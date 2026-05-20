"""Tests for portfolio alerts and recommendations."""

from __future__ import annotations

import unittest
from pathlib import Path

from app.ingest import ingest_path
from app.metrics import portfolio_alerts, portfolio_recommendations
from app.transform import enrich_dataframe

ROOT = Path(__file__).resolve().parents[2]
SAMPLE = ROOT / "data" / "sample_appfolio_export.csv"


class PortfolioInsightsTests(unittest.TestCase):
    def test_portfolio_insights_on_sample(self) -> None:
        mapped, _ = ingest_path(SAMPLE)
        frame = enrich_dataframe(mapped)

        alerts = portfolio_alerts(frame)
        recs = portfolio_recommendations(frame)

        severities = {a.severity for a in alerts}
        self.assertIn("critical", severities)
        priorities = {r.priority for r in recs}
        self.assertTrue(
            priorities & {"immediate", "high", "medium", "strategic"},
        )
        self.assertGreater(len(recs), 0)


if __name__ == "__main__":
    unittest.main()
