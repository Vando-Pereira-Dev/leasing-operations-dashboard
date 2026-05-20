import { useDataset } from "@/context/DatasetContext";

export function Sidebar() {
  const { filterOptions, datasetId } = useDataset();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">Filters</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {datasetId
          ? "Filter controls will be wired in Step 8. Options are already loaded from the API."
          : "Load a dataset to enable property, status, owner, and date filters."}
      </p>
      {filterOptions && datasetId ? (
        <dl className="mt-4 space-y-3 text-xs">
          <div>
            <dt className="font-medium text-slate-600">Properties</dt>
            <dd className="mt-1 text-slate-500">
              {filterOptions.property.length} available
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Statuses</dt>
            <dd className="mt-1 text-slate-500">
              {filterOptions.status.length} available
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-600">Owners</dt>
            <dd className="mt-1 text-slate-500">
              {filterOptions.owner.length} available
            </dd>
          </div>
        </dl>
      ) : null}
    </aside>
  );
}
