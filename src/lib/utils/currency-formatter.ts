/**
 * Formats a number as currency in Italian Euro format.
 * 
 * @param value - The numeric value to format
 * @returns The formatted currency string
 */
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};