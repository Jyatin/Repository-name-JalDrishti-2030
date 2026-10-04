/** Display formatting. Kept in one place so units never drift between views. */

const NUM = new Intl.NumberFormat("en-IN");

export const formatInt = (n: number) => NUM.format(Math.round(n));

export const formatCompact = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

export const formatPercent = (n: number, digits = 0) =>
  `${(n * 100).toFixed(digits)}%`;

export const formatScore = (n: number) => n.toFixed(3);

/** Indian lakh, the unit municipal budgets are actually written in. */
export const formatLakh = (n: number) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n)} L`;

export const formatMm = (n: number) =>
  `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n)} mm`;
