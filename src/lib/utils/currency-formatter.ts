/**
 * Formats a number as currency in Italian Euro format.
 * Uses manual formatting to ensure consistency between server and client (prevents hydration errors).
 *
 * @param value - The numeric value to format
 * @returns The formatted currency string (e.g., "1.234,56 €")
 */
export const formatCurrency = (value: number): string => {
  // Handle edge cases
  if (Number.isNaN(value)) return "0,00 €";

  // Round to 2 decimal places
  const rounded = Math.round(value * 100) / 100;

  // Split into integer and decimal parts
  const isNegative = rounded < 0;
  const absoluteValue = Math.abs(rounded);
  const [integerPart, decimalPart = "00"] = absoluteValue.toFixed(2).split(".");

  // Add thousand separators (Italian format uses . as separator)
  const formattedInteger = integerPart.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Combine parts with Italian format (comma for decimals, space before €)
  const formattedValue = `${isNegative ? "-" : ""}${formattedInteger},${decimalPart} €`;

  return formattedValue;
};