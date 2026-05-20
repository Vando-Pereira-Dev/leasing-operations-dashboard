import { useDataset } from "@/context/DatasetContext";

export function IngestSummary() {
  const { ingest } = useDataset();
  if (!ingest) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">Import summary</h3>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-slate-500">Rows loaded</dt>
          <dd className="font-medium text-slate-900">{ingest.row_count}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Columns mapped</dt>
          <dd className="font-medium text-slate-900">
            {Object.keys(ingest.mapped_columns).length}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Unmapped columns</dt>
          <dd className="font-medium text-slate-900">
            {ingest.unmapped_columns.length}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Source file</dt>
          <dd className="truncate font-medium text-slate-900">{ingest.filename}</dd>
        </div>
      </dl>

      {ingest.warnings.length > 0 ? (
        <ul className="mt-4 space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          {ingest.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-slate-600 hover:text-slate-900">
          Column mapping details
        </summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-1 pr-4">Canonical</th>
              <th className="py-1">Source column</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ingest.mapped_columns).map(([canonical, source]) => (
              <tr key={canonical} className="border-b border-slate-100">
                <td className="py-1 pr-4 font-medium text-slate-700">{canonical}</td>
                <td className="py-1 text-slate-600">{source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
