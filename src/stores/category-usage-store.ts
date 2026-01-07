import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Category usage tracking data
 */
interface CategoryUsage {
  categoryKey: string;
  lastUsed: number; // timestamp
  usageCount: number;
}

/**
 * Category usage store state
 */
interface CategoryUsageState {
  usageMap: Record<string, CategoryUsage>;

  // Actions
  recordCategoryUsage: (categoryKey: string) => void;
  getRecentCategories: (limit?: number) => string[];
  getFrequentCategories: (limit?: number) => string[];
  clearUsageData: () => void;
}

/**
 * Zustand store for tracking category usage
 *
 * Tracks both recency (when last used) and frequency (how often used)
 * for category quick-select features
 *
 * @example
 * ```tsx
 * const { recordCategoryUsage, getRecentCategories } = useCategoryUsageStore();
 *
 * // Record usage when category selected
 * recordCategoryUsage("spesa");
 *
 * // Get recent categories for quick access
 * const recent = getRecentCategories(5); // ["spesa", "benzina", ...]
 * ```
 */
export const useCategoryUsageStore = create<CategoryUsageState>()(
  persist(
    (set, get) => ({
      usageMap: {},

      recordCategoryUsage: (categoryKey) => {
        set((state) => ({
          usageMap: {
            ...state.usageMap,
            [categoryKey]: {
              categoryKey,
              lastUsed: Date.now(),
              usageCount: (state.usageMap[categoryKey]?.usageCount || 0) + 1,
            },
          },
        }));
      },

      getRecentCategories: (limit = 5) => {
        const { usageMap } = get();
        return Object.values(usageMap)
          .sort((a, b) => b.lastUsed - a.lastUsed)
          .slice(0, limit)
          .map((usage) => usage.categoryKey);
      },

      getFrequentCategories: (limit = 5) => {
        const { usageMap } = get();
        return Object.values(usageMap)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit)
          .map((usage) => usage.categoryKey);
      },

      clearUsageData: () => set({ usageMap: {} }),
    }),
    {
      name: 'category-usage-storage',
      // Skip hydration on server to prevent SSR mismatch
      skipHydration: true,
    }
  )
);
