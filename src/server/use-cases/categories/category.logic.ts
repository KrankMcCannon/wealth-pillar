import type { Category } from '@/lib/types';
import { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORY_COLOR } from '@/features/categories/constants';

/**
 * Finds a category by ID, key, or label
 */
export function findCategory(categories: Category[], identifier: string): Category | undefined {
  return categories.find(
    (c) =>
      c.id === identifier ||
      c.key === identifier ||
      c.label.toLowerCase() === identifier.toLowerCase()
  );
}

/**
 * Gets category color by identifier
 */
export function getCategoryColor(categories: Category[], identifier: string): string {
  const category = findCategory(categories, identifier);
  return category?.color || '#6B7280'; // Default gray color
}

/**
 * Gets category icon by identifier
 */
export function getCategoryIcon(categories: Category[], identifier: string): string {
  const category = findCategory(categories, identifier);
  return category?.icon || 'default';
}

/**
 * Gets category label by identifier
 */
export function getCategoryLabel(categories: Category[], identifier: string): string {
  const category = findCategory(categories, identifier);
  return category?.label || identifier;
}

/**
 * Gets the color palette for category selection
 */
export function getColorPalette() {
  return CATEGORY_COLOR_PALETTE;
}

/**
 * Validates a hex color code
 */
export function isValidColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Gets default category color
 */
export function getDefaultColor(): string {
  return DEFAULT_CATEGORY_COLOR;
}
