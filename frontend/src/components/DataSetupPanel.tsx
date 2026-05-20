import { useMutation } from "@tanstack/react-query";

import { loadSample } from "@/api/leasing";
import type { SampleName } from "@/api/leasing";
import { ApiRequestError } from "@/api/client";
import { useDataset } from "@/context/DatasetContext";

export function DataSetupPanel() {
  const { datasetId, setUpload, clearDataset } = useDataset();

  const sampleMutation = useMutation({
    mutationFn: (name: SampleName) => loadSample(name),
    onSuccess: setUpload,
  });

  const error =
    sampleMutation.error instanceof ApiRequestError
      ? sampleMutation.error.message
      : sampleMutation.error
        ? "Failed to load sample"
        : null;

  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Get started</h2>
      <p className="mt-1 text-sm text-slate-600">
        Load a bundled demo export to verify the API client. File upload UI
        arrives in the next step.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={sampleMutation.isPending}
          onClick={() => sampleMutation.mutate("appfolio")}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Load AppFolio sample
        </button>
        <button
          type="button"
          disabled={sampleMutation.isPending}
          onClick={() => sampleMutation.mutate("legacy")}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Load legacy sample
        </button>
        {datasetId ? (
          <button
            type="button"
            onClick={clearDataset}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
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
