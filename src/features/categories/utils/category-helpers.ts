import type { Category } from '@/lib/types';
import { SYSTEM_GROUP_ID } from '@/lib/constants';

/**
 * Whether a category is a system/mandatory category (not editable or deletable)
 */
export function isSystemCategory(category: Pick<Category, 'group_id'>): boolean {
  return category.group_id === SYSTEM_GROUP_ID;
}
