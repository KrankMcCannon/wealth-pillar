/**
 * Categories Feature - Public API
 */

export {
  CATEGORY_COLOR_PALETTE,
  DEFAULT_CATEGORY_COLOR,
  CATEGORIES,
  ICON_METADATA,
  type ColorOption,
  type IconCategory,
  type IconMetadata,
  type CategoryInfo,
  getIconByName,
  getIconsByCategory,
  getAllTags,
  getIconCountByCategory,
} from './constants';

export {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  getAllCategoriesAction,
} from './actions/category-actions';

export { default as CategoryFormModal } from './components/category-form-modal';
