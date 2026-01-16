/**
 * Consolidated Store Exports
 *
 */

// Reference Data Store
export {
  useReferenceDataStore,
  useAccounts,
  useCategories,
} from '@/stores/reference-data-store';

// Page Data Store
export {
  usePageDataStore,
} from '@/stores/page-data-store';

// User Filter Store
export {
  useUserFilterStore,
  useSelectedUserId,
  useSelectedGroupFilter,
  useSetSelectedGroupFilter,
} from '@/stores/user-filter-store';

// User Filter Hook (from hooks, wraps the store)
export { useUserFilter } from '@/hooks/state/use-user-filter';

// Transaction Filters Store
export {
  useTransactionFiltersStore,
} from '@/stores/transaction-filters-store';

// UI State Store
export {
  useUIStateStore,
} from '@/stores/ui-state-store';

// Form Draft Store
export {
  useFormDraftStore,
} from '@/stores/form-draft-store';
