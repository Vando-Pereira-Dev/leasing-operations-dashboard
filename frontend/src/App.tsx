import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppLayout } from "@/components/layout/AppLayout";
import { DataSetupPanel } from "@/components/DataSetupPanel";
import { IngestSummary } from "@/components/IngestSummary";
import { KpiPreview } from "@/components/KpiPreview";
import { UnitsPreviewTable } from "@/components/UnitsPreviewTable";
import { DatasetProvider, useDataset } from "@/context/DatasetContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function DashboardShell() {
  const { kpis, datasetId } = useDataset();

  return (
    <div className="space-y-6">
      <DataSetupPanel />
      {datasetId ? <IngestSummary /> : null}
      {kpis ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Operational snapshot
          </h2>
          <KpiPreview kpis={kpis} />
        </section>
      ) : null}
      <UnitsPreviewTable />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DatasetProvider>
        <AppLayout>
          <DashboardShell />
        </AppLayout>
      </DatasetProvider>
    </QueryClientProvider>
  );
}
