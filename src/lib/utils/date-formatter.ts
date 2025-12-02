/**
 * Date Formatting Utilities
 * Centralized date formatting functions used across the application
 */

/**
 * Format date as DD/MM/YY
 * Used for compact date display in transaction lists and reports
 *
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "15/01/25")
 *
 * @example
 * const formatted = formatShortDate("2025-01-15"); // "15/01/25"
 * const formatted2 = formatShortDate(new Date()); // "16/11/25"
 */
export function formatShortDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Format date as DD/MM/YYYY
 * Used for full date display
 *
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "15/01/2025")
 *
 * @example
 * const formatted = formatFullDate("2025-01-15"); // "15/01/2025"
 */
export function formatFullDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date as DD/MM
 * Used for displaying day and month without year
 *
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (e.g., "15 Nov")
 *
 * @example
 * const formatted = formatDayMonth("2025-01-15"); // "15 Nov"
 */
export function formatDayMonth(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  return `${day} ${month}`;
}