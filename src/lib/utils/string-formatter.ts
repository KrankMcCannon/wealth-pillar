/**
 * String Formatting Utilities
 * Centralized string formatting functions used across the application
 */

/**
 * Truncate a string to a maximum length and add ellipsis
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation (default: 20)
 * @returns Truncated string with ellipsis if needed
 *
 * @example
 * truncateText("Very Long Account Name", 15); // "Very Long Ac..."
 * truncateText("Short", 15); // "Short"
 */
export function truncateText(text: string, maxLength: number = 20): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Truncate text in the middle, preserving start and end
 * Useful for IDs or hashes
 *
 * @param text - The text to truncate
 * @param startLength - Length to keep at start (default: 6)
 * @param endLength - Length to keep at end (default: 4)
 * @returns Truncated string with ellipsis in the middle
 *
 * @example
 * truncateMiddle("0x1234567890abcdef", 6, 4); // "0x1234...cdef"
 */
export function truncateMiddle(
  text: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!text) return '';
  if (text.length <= startLength + endLength) return text;
  return `${text.slice(0, startLength)}...${text.slice(-endLength)}`;
}
