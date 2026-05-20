import { useMutation } from "@tanstack/react-query";

import { loadSample } from "@/api/leasing";
import type { SampleName } from "@/api/leasing";
import { ApiRequestError } from "@/api/client";
import { FileUploadZone } from "@/components/FileUploadZone";
import { useDataset } from "@/context/DatasetContext";

export function DataSetupPanel() {
  const { datasetId, setUpload, clearDataset } = useDataset();

  const sampleMutation = useMutation({
    mutationFn: (name: SampleName) => loadSample(name),
    onSuccess: setUpload,
  });

  const busy = sampleMutation.isPending;
  const error =
    sampleMutation.error instanceof ApiRequestError
      ? sampleMutation.error.message
      : sampleMutation.error
        ? "Failed to load sample"
        : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Data source</h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload an AppFolio or legacy export, or load a bundled sample for demo.
      </p>

      <div className="mt-4">
        <FileUploadZone />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-500">Or try a sample:</span>
        <button
          type="button"
          disabled={busy}
          onClick={() => sampleMutation.mutate("appfolio")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          AppFolio
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => sampleMutation.mutate("legacy")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Legacy
        </button>
        {datasetId ? (
          <button
            type="button"
            onClick={clearDataset}
            className="ml-auto text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            Clear dataset
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
