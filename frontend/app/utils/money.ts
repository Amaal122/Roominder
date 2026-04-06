import type { AppCurrency } from "../state/settings";

const currencyPrefix = (currency: AppCurrency) => {
  switch (currency) {
    case "Dollar":
      return "$";
    case "Euro":
      return "€";
    case "DT":
      return "DT ";
    default:
      return "";
  }
};

const parseAmount = (value: string | number) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  const trimmed = value.trim();
  if (!trimmed) return NaN;

  const normalized = trimmed.replace(/,/g, ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return NaN;
  return Number(match[0]);
};

export const formatMoney = (amount: string | number, currency: AppCurrency) => {
  const numeric = parseAmount(amount);
  if (!Number.isFinite(numeric)) {
    return String(amount);
  }

  const clean = Number.isInteger(numeric) ? String(numeric) : String(numeric);
  return `${currencyPrefix(currency)}${clean}`;
};
