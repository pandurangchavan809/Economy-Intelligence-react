export function formatUsd(value, digits = 2) {
  if (value === null || value === undefined) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits
  }).format(value);
}

export function formatTrillions(value, digits = 2) {
  if (value === null || value === undefined) return "Not available";
  return `$${(value / 1e12).toFixed(digits)} T`;
}

export function formatBillions(value, digits = 2) {
  if (value === null || value === undefined) return "Not available";
  return `$${(value / 1e9).toFixed(digits)} B`;
}

export function formatNumber(value) {
  if (value === null || value === undefined) return "Not available";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function formatPercent(value, digits = 2) {
  if (value === null || value === undefined) return "Not available";
  return `${Number(value).toFixed(digits)}%`;
}

export function formatTableValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? formatNumber(value) : value.toFixed(2);
  }
  return String(value);
}
