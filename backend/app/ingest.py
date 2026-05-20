"""Load CSV/XLSX exports and map columns to the canonical leasing schema."""

from __future__ import annotations

import io
import re
from pathlib import Path

import pandas as pd

from app.models import IngestReport
from app.schema import (
    CANONICAL_COLUMNS,
    COLUMN_ALIASES,
    REQUIRED_COLUMNS,
    RECOMMENDED_COLUMNS,
)


def normalize_header(name: str) -> str:
    """Normalize export headers for alias matching."""
    text = str(name).strip().lower()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", "_", text)
    return text.strip("_")


def build_alias_lookup() -> dict[str, str]:
    """Map normalized alias -> canonical column name."""
    lookup: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            lookup[normalize_header(alias)] = canonical
    return lookup


def map_columns(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, str], list[str]]:
    """
    Rename source columns to canonical names.

    Returns mapped dataframe, mapping {canonical: original}, and unmapped originals.
    """
    alias_lookup = build_alias_lookup()
    rename_map: dict[str, str] = {}
    mapped_pairs: dict[str, str] = {}
    used_canonical: set[str] = set()

    for col in df.columns:
        normalized = normalize_header(col)
        canonical = alias_lookup.get(normalized)
        if canonical and canonical not in used_canonical:
            rename_map[col] = canonical
            mapped_pairs[canonical] = str(col)
            used_canonical.add(canonical)

    mapped_df = df.rename(columns=rename_map)
    unmapped = [str(c) for c in df.columns if c not in rename_map]
    return mapped_df, mapped_pairs, unmapped


def read_file_bytes(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Parse CSV or Excel bytes into a DataFrame."""
    lower = filename.lower()
    buffer = io.BytesIO(file_bytes)

    if lower.endswith(".csv"):
        return pd.read_csv(buffer)
    if lower.endswith((".xlsx", ".xls")):
        return pd.read_excel(buffer, engine="openpyxl")

    raise ValueError("Unsupported file type. Upload a .csv, .xlsx, or .xls file.")


def read_file_path(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    return read_file_bytes(path.read_bytes(), path.name)


def ingest_dataframe(df: pd.DataFrame, filename: str = "upload") -> tuple[pd.DataFrame, IngestReport]:
    """Map raw export columns and validate required fields."""
    source_columns = [str(c) for c in df.columns]
    mapped_df, mapped_pairs, unmapped = map_columns(df)

    missing_required = [c for c in REQUIRED_COLUMNS if c not in mapped_df.columns]
    missing_recommended = [c for c in RECOMMENDED_COLUMNS if c not in mapped_df.columns]

    warnings: list[str] = []
    if missing_recommended:
        warnings.append(
            "Missing recommended columns: "
            + ", ".join(missing_recommended)
            + ". Some KPIs and risk signals will be limited."
        )
    if unmapped:
        warnings.append(
            f"{len(unmapped)} source column(s) were not mapped and are preserved as extra fields."
        )

    # Keep canonical + unmapped extras for traceability
    keep_cols = [c for c in mapped_df.columns if c in CANONICAL_COLUMNS]
    extra_cols = [c for c in mapped_df.columns if c not in CANONICAL_COLUMNS]
    result = mapped_df[keep_cols + extra_cols].copy()

    report = IngestReport(
        filename=filename,
        row_count=len(result),
        source_columns=source_columns,
        mapped_columns=mapped_pairs,
        unmapped_columns=unmapped,
        missing_required=missing_required,
        missing_recommended=missing_recommended,
        warnings=warnings,
    )
    return result, report


def ingest_bytes(file_bytes: bytes, filename: str) -> tuple[pd.DataFrame, IngestReport]:
    raw = read_file_bytes(file_bytes, filename)
    return ingest_dataframe(raw, filename=filename)


def ingest_path(path: str | Path) -> tuple[pd.DataFrame, IngestReport]:
    path = Path(path)
    raw = read_file_path(path)
    return ingest_dataframe(raw, filename=path.name)
