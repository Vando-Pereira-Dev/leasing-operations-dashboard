type FilterCheckboxGroupProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  emptyMessage?: string;
};

export function FilterCheckboxGroup({
  label,
  options,
  selected,
  onChange,
  emptyMessage = "No options",
}: FilterCheckboxGroupProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return (
    <fieldset>
      <legend className="text-xs font-semibold text-slate-700">{label}</legend>
      {options.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">{emptyMessage}</p>
      ) : (
        <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto pr-1">
          {options.map((option) => (
            <li key={option}>
              <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                />
                <span className="leading-snug break-words">{option}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
