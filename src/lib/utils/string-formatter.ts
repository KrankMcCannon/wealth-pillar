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

export type InitialsFromNameOptions = {
  emptyFallback?: string;
  /** Single-word names: first letter only, or up to two letters. */
  singleWord?: 'first' | 'two';
};

/**
 * Derive display initials from a person's name.
 */
export function initialsFromName(name: string, options: InitialsFromNameOptions = {}): string {
  const { emptyFallback = 'WP', singleWord = 'first' } = options;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return emptyFallback;

  if (parts.length === 1) {
    const word = parts[0] ?? '';
    if (singleWord === 'two') {
      const slice = word.slice(0, 2);
      return slice.length > 0 ? slice.toUpperCase() : emptyFallback;
    }
    return word[0]?.toUpperCase() ?? emptyFallback.charAt(0);
  }

  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  const a = first.charAt(0);
  const b = last.charAt(0);
  if (!a && !b) return emptyFallback;
  return `${a}${b}`.toUpperCase();
}
