import type { Category } from '@/lib/types';
import { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORY_COLOR } from '@/features/categories/constants';

export function findCategory(categories: Category[], identifier: string): Category | undefined {
  return categories.find(
    (c) =>
      c.id === identifier ||
      c.key === identifier ||
      c.label.toLowerCase() === identifier.toLowerCase()
  );
}

export function getCategoryColor(categories: Category[], identifier: string): string {
  const category = findCategory(categories, identifier);
  return category?.color || '#6B7280';
}

export function getCategoryIcon(categories: Category[], identifier: string): string {
  const category = findCategory(categories, identifier);
  return category?.icon || 'default';
}

export function getCategoryLabel(categories: Category[], identifier: string): string {
  const category = findCategory(categories, identifier);
  return category?.label || identifier;
}

export function getColorPalette() {
  return CATEGORY_COLOR_PALETTE;
}

export function isValidColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function getDefaultColor(): string {
  return DEFAULT_CATEGORY_COLOR;
}
