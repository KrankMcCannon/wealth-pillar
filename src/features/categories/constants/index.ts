/**
 * Category Constants - Public API
 */

export { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORY_COLOR } from './category-colors';
export type { ColorOption } from './category-colors';

export {
  CATEGORIES, ICON_METADATA,
  getIconByName, getIconsByCategory, getAllTags, getIconCountByCategory
} from './icon-metadata';
export type { IconCategory, IconMetadata, CategoryInfo } from './icon-metadata';
