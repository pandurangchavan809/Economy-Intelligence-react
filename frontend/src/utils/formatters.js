export function formatUsd(value, digits = 2) {
  if (value === null || value === undefined) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits
  }).format(value);
}

function formatScaledUsd(value, threshold, suffix, digits) {
  return `$${(value / threshold).toFixed(digits)} ${suffix}`;
}

export function formatCompactUsd(value, digits = 2) {
  if (value === null || value === undefined) return "Not available";

  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1e12) return formatScaledUsd(value, 1e12, "T", digits);
  if (absoluteValue >= 1e9) return formatScaledUsd(value, 1e9, "B", digits);
  if (absoluteValue >= 1e6) return formatScaledUsd(value, 1e6, "M", digits);
  if (absoluteValue >= 1e3) return formatScaledUsd(value, 1e3, "K", digits);

  return formatUsd(value, digits);
}

export function formatLiveGdp(value) {
  if (value === null || value === undefined) return "Not available";

  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 1e12) return formatScaledUsd(value, 1e12, "T", 6);
  if (absoluteValue >= 1e9) return formatScaledUsd(value, 1e9, "B", 6);
  if (absoluteValue >= 1e6) return formatScaledUsd(value, 1e6, "M", 6);
  if (absoluteValue >= 1e3) return formatScaledUsd(value, 1e3, "K", 6);

  return formatUsd(value, 2);
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
