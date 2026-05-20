"""API integration tests."""

from __future__ import annotations

import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


class ApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health(self) -> None:
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_load_appfolio_sample(self) -> None:
        res = self.client.post("/samples/appfolio")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["unit_count"], 45)
        dataset_id = body["dataset_id"]

        dash = self.client.get(f"/datasets/{dataset_id}/dashboard")
        self.assertEqual(dash.status_code, 200)
        self.assertEqual(dash.json()["unit_count"], 45)
        self.assertGreater(dash.json()["kpis"]["total_units"], 0)

    def test_upload_legacy_csv(self) -> None:
        path = DATA / "sample_leasing_export.csv"
        with path.open("rb") as handle:
            res = self.client.post(
                "/upload",
                files={"file": ("sample_leasing_export.csv", handle, "text/csv")},
            )
        self.assertEqual(res.status_code, 200)
        dataset_id = res.json()["dataset_id"]

        units = self.client.get(f"/datasets/{dataset_id}/units")
        self.assertEqual(units.status_code, 200)
        self.assertEqual(units.json()["total"], 45)

    def test_filter_by_property(self) -> None:
        res = self.client.post("/samples/legacy")
        dataset_id = res.json()["dataset_id"]

        filtered = self.client.get(
            f"/datasets/{dataset_id}/dashboard",
            params={"property": ["Riverside Tower"]},
        )
        self.assertEqual(filtered.status_code, 200)
        body = filtered.json()
        self.assertEqual(body["unit_count"], 15)
        self.assertEqual(body["filters_applied"]["property"], ["Riverside Tower"])

    def test_unit_detail(self) -> None:
        res = self.client.post("/samples/appfolio")
        dataset_id = res.json()["dataset_id"]
        units = self.client.get(f"/datasets/{dataset_id}/units").json()["units"]
        unit_key = units[0]["unit_key"]

        detail = self.client.get(f"/datasets/{dataset_id}/units/{unit_key}")
        self.assertEqual(detail.status_code, 200)
        self.assertIn("recommendations", detail.json()["unit"])
        self.assertGreaterEqual(len(detail.json()["unit"]["recommendations"]), 1)


if __name__ == "__main__":
    unittest.main()
