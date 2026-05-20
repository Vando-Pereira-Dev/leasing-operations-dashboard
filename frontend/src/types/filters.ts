export type DateField = "marketing_start_date" | "lease_end_date";

export type FilterState = {
  property: string[];
  status: string[];
  owner: string[];
  risk_category: string[];
  date_from: string;
  date_to: string;
  date_field: DateField;
};

export const emptyFilters = (): FilterState => ({
  property: [],
  status: [],
  owner: [],
  risk_category: [],
  date_from: "",
  date_to: "",
  date_field: "marketing_start_date",
});

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.property.length > 0 ||
    filters.status.length > 0 ||
    filters.owner.length > 0 ||
    filters.risk_category.length > 0 ||
    Boolean(filters.date_from) ||
    Boolean(filters.date_to)
  );
}

export function toggleFilterValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function filtersToSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  filters.property.forEach((v) => params.append("property", v));
  filters.status.forEach((v) => params.append("status", v));
  filters.owner.forEach((v) => params.append("owner", v));
  filters.risk_category.forEach((v) => params.append("risk_category", v));
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.date_field) params.set("date_field", filters.date_field);
  return params;
}
