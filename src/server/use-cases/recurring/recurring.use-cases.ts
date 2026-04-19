import { RecurringRepository } from '@/server/repositories/recurring.repository';
import { recurringTransactions } from '@/server/db/schema';
import { getUsersByGroupUseCase } from '../users/user.use-cases';
import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { recurringCacheKeys } from '@/lib/cache/keys';
import { serialize } from '@/lib/utils/serializer';
import { invalidateRecurringCaches } from '@/lib/utils/cache-utils';
import type { RecurringTransactionSeries } from '@/lib/types';
import type { Database } from '@/lib/types/database.types';

type RecurringInsert = Database['public']['Tables']['recurring_transactions']['Insert'];
type RecurringUpdate = Database['public']['Tables']['recurring_transactions']['Update'];

export async function getSeriesByUserUseCase(
  userId: string
): Promise<RecurringTransactionSeries[]> {
  if (!userId?.trim()) throw new Error('User ID is required');

  const getCachedSeries = cached(
    async () => {
      const series = await RecurringRepository.findByUser(userId);
      return serialize(series || []) as unknown as RecurringTransactionSeries[];
    },
    recurringCacheKeys.byUser(userId),
    cacheOptions.recurring(userId)
  );

  return await getCachedSeries();
}

export async function getSeriesByGroupUseCase(
  groupId: string
): Promise<RecurringTransactionSeries[]> {
  if (!groupId?.trim()) throw new Error('Group ID is required');

  const getCachedSeries = cached(
    async () => {
      const users = await getUsersByGroupUseCase(groupId);
      if (!users || users.length === 0) return [];

      const userIds = users.map((u) => u.id);
      const series = await RecurringRepository.findByUserIds(userIds);
      return serialize(series || []) as unknown as RecurringTransactionSeries[];
    },
    recurringCacheKeys.byGroup(groupId),
    cacheOptions.recurringGroup(groupId)
  );

  return await getCachedSeries();
}

export async function getSeriesByIdUseCase(seriesId: string): Promise<RecurringTransactionSeries> {
  if (!seriesId?.trim()) throw new Error('Series ID is required');

  const getCachedSeries = cached(
    async () => {
      const series = await RecurringRepository.findById(seriesId);
      return serialize(series) as unknown as RecurringTransactionSeries | null;
    },
    recurringCacheKeys.byId(seriesId),
    cacheOptions.recurringSingle(seriesId)
  );

  const series = await getCachedSeries();
  if (!series) throw new Error('Recurring series not found');

  return series;
}

export async function getActiveSeriesByUserUseCase(
  userId: string
): Promise<RecurringTransactionSeries[]> {
  const allSeries = await getSeriesByUserUseCase(userId);
  return allSeries.filter((s) => s.is_active);
}

export async function createSeriesUseCase(
  data: RecurringInsert
): Promise<RecurringTransactionSeries> {
  const series = await RecurringRepository.create({
    ...data,
    amount: data.amount.toString(),
  } as typeof recurringTransactions.$inferInsert);
  if (!series) throw new Error('Failed to create series');

  invalidateRecurringCaches({
    userIds: data.user_ids,
  });

  return serialize(series) as unknown as RecurringTransactionSeries;
}

export async function updateSeriesUseCase(
  id: string,
  data: RecurringUpdate
): Promise<RecurringTransactionSeries> {
  const updatePayload = {
    ...data,
    amount: data.amount !== undefined ? data.amount.toString() : undefined,
  } as Partial<typeof recurringTransactions.$inferInsert>;

  const series = await RecurringRepository.update(id, updatePayload);
  if (!series) throw new Error('Failed to update series');

  invalidateRecurringCaches({ seriesId: id });

  return serialize(series) as unknown as RecurringTransactionSeries;
}

export async function deleteSeriesUseCase(id: string): Promise<void> {
  const series = await RecurringRepository.findById(id);
  if (!series) return;

  await RecurringRepository.delete(id);

  invalidateRecurringCaches({
    seriesId: id,
    userIds: series.user_ids,
  });
}
