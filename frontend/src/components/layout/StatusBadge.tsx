type StatusBadgeProps = {
  label: string;
  ok: boolean;
};

export function StatusBadge({ label, ok }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        ok
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      {label}
    </span>
  );
}
