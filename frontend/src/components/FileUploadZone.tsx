import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { ApiRequestError } from "@/api/client";
import { uploadFile } from "@/api/leasing";
import { useDataset } from "@/context/DatasetContext";

const ACCEPT = ".csv,.xlsx,.xls";

function isAccepted(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
}

export function FileUploadZone() {
  const { setUpload } = useDataset();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: setUpload,
  });

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!isAccepted(file)) {
        setLocalError("Please upload a .csv, .xlsx, or .xls file.");
        return;
      }
      setLocalError(null);
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const error =
    localError ??
    (uploadMutation.error instanceof ApiRequestError
      ? uploadMutation.error.message
      : uploadMutation.error
        ? "Upload failed"
        : null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      className={`rounded-lg border-2 border-dashed p-6 transition-colors ${
        dragOver
          ? "border-brand-600 bg-brand-50"
          : "border-slate-200 bg-slate-50/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-slate-800">
          Upload CSV or Excel export
        </p>
        <p className="mt-1 text-xs text-slate-500">
          AppFolio unit/vacancy reports supported via automatic column mapping
        </p>
        <button
          type="button"
          disabled={uploadMutation.isPending}
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {uploadMutation.isPending ? "Processing…" : "Choose file"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
