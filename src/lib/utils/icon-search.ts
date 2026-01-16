import Fuse from "fuse.js";
import type { IFuseOptions } from "fuse.js";
import type { IconMetadata, IconCategory } from "@/features/categories";
import { ICON_METADATA } from "@/features/categories";

/**
 * Fuzzy Search Utility for Icons
 *
 * Uses Fuse.js for fuzzy searching through icon metadata
 * including names, keywords, and tags for better discoverability.
 *
 * Features:
 * - Fuzzy matching with configurable threshold
 * - Search by icon name, keywords, and tags
 * - Category filtering
 * - Optimized for performance with memoization
 */

// ============================================================================
// FUSE.JS CONFIGURATION
// ============================================================================

const FUSE_OPTIONS: IFuseOptions<IconMetadata> = {
  // Threshold for fuzzy matching (0.0 = perfect match, 1.0 = match anything)
  threshold: 0.4,

  // Include score in results for potential sorting
  includeScore: true,

  // Minimum character length to start searching
  minMatchCharLength: 1,

  // Search in these fields
  keys: [
    {
      name: "name",
      weight: 3, // Highest priority - exact icon name
    },
    {
      name: "keywords",
      weight: 2, // Second priority - keywords array
    },
    {
      name: "tags",
      weight: 1, // Lower priority - tags
    },
  ],

  // Use extended search for more control
  useExtendedSearch: false,

  // Find all matches, not just the first one
  findAllMatches: true,

  // Location and distance for pattern matching
  location: 0,
  distance: 100,
};

// ============================================================================
// SEARCH INSTANCE
// ============================================================================

// Create a singleton Fuse instance for performance
let fuseInstance: Fuse<IconMetadata> | null = null;

function getFuseInstance(): Fuse<IconMetadata> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(ICON_METADATA, FUSE_OPTIONS);
  }
  return fuseInstance;
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

export interface IconSearchResult {
  icon: IconMetadata;
  score?: number;
}

/**
 * Search icons using fuzzy matching
 *
 * @param query - Search query string
 * @param category - Optional category filter (default: "all")
 * @param maxResults - Maximum number of results to return (default: unlimited)
 * @returns Array of matching icons with optional scores
 *
 * @example
 * const results = searchIcons("money"); // Finds "Wallet", "DollarSign", etc.
 * const financeResults = searchIcons("card", "finance"); // Only in finance category
 */
export function searchIcons(
  query: string,
  category: IconCategory = "all",
  maxResults?: number
): IconSearchResult[] {
  // Return all icons if no query
  if (!query || query.trim() === "") {
    const icons = category === "all"
      ? ICON_METADATA
      : ICON_METADATA.filter((icon) => icon.category === category);

    return icons.map((icon) => ({ icon }));
  }

  // Get Fuse instance
  const fuse = getFuseInstance();

  // Perform fuzzy search
  const fuseResults = fuse.search(query);

  // Filter by category if specified
  let results = fuseResults.map((result) => ({
    icon: result.item,
    score: result.score,
  }));

  if (category !== "all") {
    results = results.filter((result) => result.icon.category === category);
  }

  // Limit results if maxResults specified
  if (maxResults && maxResults > 0) {
    results = results.slice(0, maxResults);
  }

  return results;
}

/**
 * Simple keyword-based search (non-fuzzy, exact contains)
 * Useful for autocomplete or when fuzzy matching is too loose
 *
 * @param query - Search query string
 * @param category - Optional category filter
 * @returns Array of matching icons
 *
 * @example
 * const results = simpleSearchIcons("car"); // Exact substring match
 */
export function simpleSearchIcons(
  query: string,
  category: IconCategory = "all"
): IconMetadata[] {
  if (!query || query.trim() === "") {
    return category === "all"
      ? ICON_METADATA
      : ICON_METADATA.filter((icon) => icon.category === category);
  }

  const lowerQuery = query.toLowerCase();

  let results = ICON_METADATA.filter((icon) => {
    // Search in name
    if (icon.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in keywords
    if (icon.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    // Search in tags
    if (icon.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
      return true;
    }

    return false;
  });

  // Filter by category if specified
  if (category !== "all") {
    results = results.filter((icon) => icon.category === category);
  }

  return results;
}

/**
 * Search icons by tag
 *
 * @param tag - Tag to filter by
 * @param category - Optional category filter
 * @returns Array of icons with the specified tag
 *
 * @example
 * const paymentIcons = searchIconsByTag("payment");
 */
export function searchIconsByTag(
  tag: string,
  category: IconCategory = "all"
): IconMetadata[] {
  const lowerTag = tag.toLowerCase();

  let results = ICON_METADATA.filter((icon) =>
    icon.tags.some((t) => t.toLowerCase() === lowerTag)
  );

  if (category !== "all") {
    results = results.filter((icon) => icon.category === category);
  }

  return results;
}

/**
 * Get search suggestions based on partial input
 * Returns top matching keywords/tags for autocomplete
 *
 * @param partialQuery - Partial search string
 * @param maxSuggestions - Maximum number of suggestions
 * @returns Array of suggested search terms
 *
 * @example
 * const suggestions = getSearchSuggestions("mon"); // ["money", "monitor", etc.]
 */
export function getSearchSuggestions(
  partialQuery: string,
  maxSuggestions = 5
): string[] {
  if (!partialQuery || partialQuery.trim() === "") {
    return [];
  }

  const lowerQuery = partialQuery.toLowerCase();
  const suggestions = new Set<string>();

  // Collect matching keywords and tags
  ICON_METADATA.forEach((icon) => {
    // Check keywords
    icon.keywords.forEach((keyword) => {
      if (keyword.toLowerCase().startsWith(lowerQuery)) {
        suggestions.add(keyword);
      }
    });

    // Check icon name
    if (icon.name.toLowerCase().startsWith(lowerQuery)) {
      suggestions.add(icon.name);
    }
  });

  // Convert to array and limit
  return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Highlight matching text in a string
 * Useful for showing which part of the text matched the search
 *
 * @param text - Original text
 * @param query - Search query
 * @returns Object with highlighted parts
 *
 * @example
 * const highlighted = highlightMatch("Wallet", "wall");
 * // Returns: { text: "Wallet", matches: [{start: 0, end: 4}] }
 */
export function highlightMatch(
  text: string,
  query: string
): { text: string; matches: Array<{ start: number; end: number }> } {
  if (!query || query.trim() === "") {
    return { text, matches: [] };
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matches: Array<{ start: number; end: number }> = [];

  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    matches.push({
      start: index,
      end: index + query.length,
    });
    index = lowerText.indexOf(lowerQuery, index + 1);
  }

  return { text, matches };
}

/**
 * Reset Fuse instance (useful for testing or after data updates)
 */
export function resetSearchInstance(): void {
  fuseInstance = null;
}
