import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { fetchUnits } from "@/api/leasing";
import { RiskBadge } from "@/components/RiskBadge";
import { useDataset } from "@/context/DatasetContext";
import type { UnitRecord } from "@/types/api";

const columnHelper = createColumnHelper<UnitRecord>();

function formatCurrency(value: unknown) {
  if (value == null || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

const columns = [
  columnHelper.accessor("property", {
    header: "Property",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("unit", {
    header: "Unit",
    cell: (info) => (
      <span className="font-medium text-slate-900">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("unit_type", {
    header: "Type",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span className="max-w-[140px] truncate text-slate-700" title={String(info.getValue() ?? "")}>
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
  columnHelper.accessor("risk_score", {
    header: "Score",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("risk_category", {
    header: "Risk",
    cell: (info) => <RiskBadge category={info.getValue()} />,
  }),
  columnHelper.accessor("days_on_market", {
    header: "DOM",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("asking_rent", {
    header: "Asking rent",
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.accessor("inquiries", {
    header: "Inquiries",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("showings", {
    header: "Showings",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("owner", {
    header: "Owner",
    cell: (info) => info.getValue() || "Unassigned",
  }),
];

export function UnitsPreviewTable() {
  const { datasetId, filters, filtersActive } = useDataset();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "risk_score", desc: true },
  ]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["units", datasetId, filters],
    queryFn: () => fetchUnits(datasetId!, filters),
    enabled: Boolean(datasetId),
  });

  const tableData = useMemo(() => data?.units ?? [], [data?.units]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!datasetId) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Unit data preview</h2>
          <p className="text-xs text-slate-500">
            Structured view after ingest — click column headers to sort
          </p>
        </div>
        {data ? (
          <span className="text-xs font-medium text-slate-600">
            {data.total} units
            {filtersActive ? " (filtered)" : ""}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <p className="p-6 text-sm text-slate-500">Loading units…</p>
      ) : isError ? (
        <p className="p-6 text-sm text-red-600" role="alert">
          {error instanceof Error ? error.message : "Failed to load units"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={
                            header.column.getCanSort()
                              ? "flex items-center gap-1 hover:text-slate-800"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: " ↑",
                            desc: " ↓",
                          }[header.column.getIsSorted() as string] ?? null}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
