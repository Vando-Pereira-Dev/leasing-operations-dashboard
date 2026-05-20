# Sample exports

Synthetic leasing data aligned with the **first take-home** (45 units, 3 properties, `numpy` seed `42`).

See the [project README](../README.md) for how to run the app and load these files.

| File | Format | Use |
|------|--------|-----|
| `sample_leasing_export.csv` | Legacy column names (`Property`, `Unit Number`, `Occupancy Status`, …) | Demo upload matching the original notebook/Excel |
| `sample_appfolio_export.csv` | AppFolio-style headers (`Advertised Rent`, `Days Vacant`, `Property Manager`, …) | Demo upload for the POC “no spreadsheet work” path |

**Properties:** Riverside Tower, Downtown Plaza, Eastside Apartments  

**Regenerate:**

```powershell
backend\.venv\Scripts\python.exe backend\scripts\generate_sample_data.py
```

Three rows in the AppFolio file intentionally have an empty `Property Manager` to demonstrate incomplete-record workflow flags in the dashboard.
