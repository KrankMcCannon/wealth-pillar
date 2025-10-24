/**
 * Budget Mutation Hooks (Refactored with Generic Factory)
 *
 * These hooks were refactored to use the generic mutation factory.
 * The factory handles:
 * - Optimistic updates with snapshots
 * - Cache cancellation and rollback
 * - Smart cache updates
 * - Selective invalidation
 *
 * This maintains all original behavior while reducing boilerplate significantly.
 */

'use client';

import { Budget, BudgetPeriod, invalidateBudgetComputedData, queryKeys, updateBudgetInCache, updateBudgetPeriodInCache } from '@/src/lib';
import { budgetPeriodService, budgetService } from '@/src/lib/api/client';
import { useGenericMutation } from '@/src/lib/hooks';

/**
 * Create a new budget
 */
export const useCreateBudget = () =>
  useGenericMutation<Budget, Omit<Budget, 'id' | 'created_at' | 'updated_at'>>(budgetService.create, {
    cacheKeys: (data) => [
      queryKeys.budgets(),
      queryKeys.budgetsByUser(data.user_id),
    ],
    cacheUpdateFn: updateBudgetInCache,
    invalidateFn: invalidateBudgetComputedData,
    operation: 'create',
  });

/**
 * Update an existing budget
 */
export const useUpdateBudget = () => {
  return useGenericMutation<Budget, { id: string; data: Partial<Budget> }>(
    ({ id, data }) => budgetService.update(id, data),
    {
      cacheKeys: (vars) => [
        queryKeys.budgets(),
        queryKeys.budget(vars.id),
      ],
      cacheUpdateFn: updateBudgetInCache,
      invalidateFn: invalidateBudgetComputedData,
      onMutateExtra: async (qc, variables) => {
        // Get current budget to find user_id for user-specific invalidation
        const currentBudget = qc.getQueryData<Budget>(queryKeys.budget(variables.id)) ||
          qc.getQueryData<Budget[]>(queryKeys.budgets())?.find(b => b.id === variables.id);

        if (currentBudget) {
          qc.cancelQueries({ queryKey: queryKeys.budgetsByUser(currentBudget.user_id) });
        }

        return { userBudgetsCached: !!currentBudget };
      },
      operation: 'update',
    }
  );
};

/**
 * Create a new budget period
 */
export const useCreateBudgetPeriod = () =>
  useGenericMutation<
    BudgetPeriod,
    { userId: string; budgetPeriod: Omit<BudgetPeriod, 'id' | 'created_at' | 'updated_at'> }
  >(
    ({ userId, budgetPeriod }) => budgetPeriodService.create(userId, budgetPeriod),
    {
      cacheKeys: (vars) => [
        queryKeys.budgetPeriods(),
        queryKeys.budgetPeriodsByUser(vars.userId),
      ],
      cacheUpdateFn: updateBudgetPeriodInCache,
      operation: 'create',
    }
  );

/**
 * Update an existing budget period
 */
export const useUpdateBudgetPeriod = () => {
  return useGenericMutation<
    BudgetPeriod,
    { userId: string; id: string; data: Partial<BudgetPeriod> }
  >(
    ({ userId, id, data }) => budgetPeriodService.update(userId, id, data),
    {
      cacheKeys: (vars) => [
        queryKeys.budgetPeriods(),
        queryKeys.budgetPeriod(vars.id),
        queryKeys.budgetPeriodsByUser(vars.userId),
      ],
      cacheUpdateFn: updateBudgetPeriodInCache,
      operation: 'update',
    }
  );
};

/**
 * Start a new budget period
 */
export const useStartBudgetPeriod = () =>
  useGenericMutation<BudgetPeriod, { userId: string }>(
    ({ userId }) => budgetPeriodService.startNewPeriod(userId),
    {
      cacheKeys: (vars) => [
        queryKeys.budgetPeriods(),
        queryKeys.budgetPeriodsByUser(vars.userId),
      ],
      cacheUpdateFn: updateBudgetPeriodInCache,
      invalidateFn: (qc, period) => {
        // Invalidate active periods
        qc.invalidateQueries({
          queryKey: queryKeys.activeBudgetPeriods(period.user_id),
          exact: true,
        });
        // Invalidate dashboard
        qc.invalidateQueries({
          queryKey: queryKeys.dashboardData(period.user_id),
          exact: true,
        });
      },
      operation: 'create',
    }
  );

/**
 * End the current budget period
 */
export const useEndBudgetPeriod = () =>
  useGenericMutation<BudgetPeriod | null, { userId: string; endDate?: string }>(
    ({ userId, endDate }) => budgetPeriodService.endCurrentPeriod(userId, endDate),
    {
      cacheKeys: (vars) => [
        queryKeys.budgetPeriods(),
        queryKeys.budgetPeriodsByUser(vars.userId),
      ],
      cacheUpdateFn: (qc, period) => {
        if (period) {
          updateBudgetPeriodInCache(qc, period, 'update');
        }
      },
      invalidateFn: (qc, period) => {
        if (!period) return;
        // Invalidate active periods
        qc.invalidateQueries({
          queryKey: queryKeys.activeBudgetPeriods(period.user_id),
          exact: true,
        });
        // Invalidate dashboard
        qc.invalidateQueries({
          queryKey: queryKeys.dashboardData(period.user_id),
          exact: true,
        });
        // Invalidate financial data
        qc.invalidateQueries({
          queryKey: [...queryKeys.financial(), 'total-balance', period.user_id],
          exact: true,
        });
      },
      operation: 'update',
    }
  );

/**
 * Delete a budget
 */
export const useDeleteBudget = () =>
  useGenericMutation<void, string>(
    (id) => budgetService.delete(id),
    {
      cacheKeys: () => [queryKeys.budgets()],
      cacheUpdateFn: (qc) => {
        // Delete doesn't return data, just remove from cache
        qc.invalidateQueries({ queryKey: queryKeys.budgets() });
      },
      operation: 'delete',
    }
  );
