"""In-memory store for processed uploads (POC — replace with DB/cache in production)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from threading import Lock
from uuid import uuid4

import pandas as pd

from app.models import IngestReport


@dataclass
class StoredDataset:
    id: str
    filename: str
    ingest: IngestReport
    enriched: pd.DataFrame
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class DatasetStore:
    def __init__(self) -> None:
        self._datasets: dict[str, StoredDataset] = {}
        self._lock = Lock()

    def save(
        self,
        filename: str,
        ingest: IngestReport,
        enriched: pd.DataFrame,
    ) -> StoredDataset:
        record = StoredDataset(
            id=str(uuid4()),
            filename=filename,
            ingest=ingest,
            enriched=enriched,
        )
        with self._lock:
            self._datasets[record.id] = record
        return record

    def get(self, dataset_id: str) -> StoredDataset | None:
        with self._lock:
            return self._datasets.get(dataset_id)

    def delete(self, dataset_id: str) -> bool:
        with self._lock:
            return self._datasets.pop(dataset_id, None) is not None


dataset_store = DatasetStore()
