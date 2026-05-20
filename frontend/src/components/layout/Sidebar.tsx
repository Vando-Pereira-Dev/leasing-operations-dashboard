import { FilterCheckboxGroup } from "@/components/filters/FilterCheckboxGroup";
import { useDataset } from "@/context/DatasetContext";
import type { DateField } from "@/types/filters";

export function Sidebar() {
  const {
    datasetId,
    filterOptions,
    filters,
    filtersActive,
    patchFilters,
    resetFilters,
  } = useDataset();

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">Filters</h2>
          {filtersActive ? (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
              Active
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {datasetId
            ? "Refines KPIs, charts, and the unit table"
            : "Load a dataset to enable filters"}
        </p>
      </div>

      {!datasetId || !filterOptions ? (
        <p className="px-4 py-6 text-xs text-slate-500">
          Upload a file or load a sample to filter by property, status, owner,
          and dates.
        </p>
      ) : (
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <FilterCheckboxGroup
            label="Property"
            options={filterOptions.property}
            selected={filters.property}
            onChange={(property) => patchFilters({ property })}
          />

          <FilterCheckboxGroup
            label="Status"
            options={filterOptions.status}
            selected={filters.status}
            onChange={(status) => patchFilters({ status })}
          />

          <FilterCheckboxGroup
            label="Owner / agent"
            options={filterOptions.owner}
            selected={filters.owner}
            onChange={(owner) => patchFilters({ owner })}
          />

          <FilterCheckboxGroup
            label="Risk category"
            options={filterOptions.risk_category}
            selected={filters.risk_category}
            onChange={(risk_category) => patchFilters({ risk_category })}
          />

          <fieldset>
            <legend className="text-xs font-semibold text-slate-700">
              Date range
            </legend>
            <label className="mt-2 block text-xs text-slate-600">
              Apply to
              <select
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                value={filters.date_field}
                onChange={(e) =>
                  patchFilters({ date_field: e.target.value as DateField })
                }
              >
                <option value="marketing_start_date">Marketing start</option>
                <option value="lease_end_date">Lease expiration</option>
              </select>
            </label>
            <label className="mt-2 block text-xs text-slate-600">
              From
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                value={filters.date_from}
                onChange={(e) => patchFilters({ date_from: e.target.value })}
              />
            </label>
            <label className="mt-2 block text-xs text-slate-600">
              To
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                value={filters.date_to}
                onChange={(e) => patchFilters({ date_to: e.target.value })}
              />
            </label>
          </fieldset>
        </div>
      )}

      {datasetId ? (
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            disabled={!filtersActive}
            onClick={resetFilters}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear all filters
          </button>
        </div>
      ) : null}
    </aside>
  );
}
