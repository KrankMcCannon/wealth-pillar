const DEFAULT_LOCALE = "it-IT";
const DEFAULT_CURRENCY = "EUR";

// Module-level formatter for standard currency formatting
const standardFormatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
  style: "currency",
  currency: DEFAULT_CURRENCY,
});

// Cache for any additional formatters (e.g., different locales or options)
const formatterCache = new Map<string, Intl.NumberFormat>();

const getCachedFormatter = (
  locale: string,
  options: Intl.NumberFormatOptions
): Intl.NumberFormat => {
  const cacheKey = `${locale}-${JSON.stringify(options)}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    formatterCache.set(cacheKey, formatter);
  }
  return formatter;
};

export const formatCurrency = (
  amount: number,
  options: {
    showSign?: boolean;
    compact?: boolean;
    locale?: string;
    currency?: string;
  } = {}
) => {
  const {
    showSign = false,
    compact = false,
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
  } = options;

  try {
    if (compact && Math.abs(amount) >= 1000) {
      const absAmount = Math.abs(amount);
      const divider = absAmount >= 1_000_000 ? 1_000_000 : 1_000;
      const suffix = absAmount >= 1_000_000 ? "M" : "K";
      const value = absAmount / divider;

      const compactFormatter = getCachedFormatter(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      });

      const formatted = compactFormatter.format(value);
      const sign = amount < 0 ? "-" : showSign && amount > 0 ? "+" : "";
      return `${sign}€${formatted}${suffix}`;
    }

    const formatter =
      locale === DEFAULT_LOCALE && currency === DEFAULT_CURRENCY
        ? standardFormatter
        : getCachedFormatter(locale, {
            style: "currency",
            currency,
          });

    const formatted = formatter.format(Math.abs(amount));

    if (showSign) {
      const sign = amount >= 0 ? "+" : "-";
      return `${sign}${formatted}`;
    }

    return amount < 0 ? `-${formatted}` : formatted;
  } catch (error) {
    console.error("Currency formatting error:", error);
    return `€${amount.toFixed(2)}`;
  }
};

