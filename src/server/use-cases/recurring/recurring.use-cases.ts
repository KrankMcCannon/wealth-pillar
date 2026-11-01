import {
  RecurringRepository,
  type RecurringScope,
} from '@/server/repositories/recurring.repository';
import { recurringTransactions } from '@/server/db/schema';
import { getUsersByGroupUseCase, getUserGroupIdUseCase } from '../users/user.use-cases';
import { cached } from '@/lib/cache';
import { cacheLife, cacheTag } from 'next/cache';
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
  'use cache';
  if (!groupId?.trim()) throw new Error('Group ID is required');
  cacheLife('minutes');
  cacheTag(`group:${groupId}:recurring`);
  const users = await getUsersByGroupUseCase(groupId);
  if (!users.length) return [];
  const userIds = users.map((u) => u.id);
  for (const id of userIds) cacheTag(`user:${id}:recurring`);
  const series = await RecurringRepository.findByUserIds(userIds, groupId);
  return serialize(series) as unknown as RecurringTransactionSeries[];
}

export async function getSeriesByIdUseCase(
  seriesId: string,
  scope?: RecurringScope
): Promise<RecurringTransactionSeries> {
  if (!seriesId?.trim()) throw new Error('Series ID is required');

  const getCachedSeries = cached(
    async () => {
      const series = await RecurringRepository.findById(seriesId, scope);
      return serialize(series) as unknown as RecurringTransactionSeries | null;
    },
    [...recurringCacheKeys.byId(seriesId), scope?.groupId ?? 'all', scope?.userId ?? 'all'],
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

  let groupId: string | undefined;
  if (data.user_ids && data.user_ids.length > 0 && typeof data.user_ids[0] === 'string') {
    try {
      groupId = await getUserGroupIdUseCase(data.user_ids[0]);
    } catch (e) {
      console.error(e);
    }
  }

  invalidateRecurringCaches({
    userIds: data.user_ids,
    groupId,
  });

  return serialize(series) as unknown as RecurringTransactionSeries;
}

export async function updateSeriesUseCase(
  id: string,
  data: RecurringUpdate,
  scope?: RecurringScope
): Promise<RecurringTransactionSeries> {
  const updatePayload = {
    ...data,
    amount: data.amount !== undefined ? data.amount.toString() : undefined,
  } as Partial<typeof recurringTransactions.$inferInsert>;

  const previous = await RecurringRepository.findById(id, scope);
  if (!previous) throw new Error('Recurring series not found');
  const series = await RecurringRepository.update(id, updatePayload, scope);
  if (!series) throw new Error('Failed to update series');

  let groupId: string | undefined;
  if (series.user_ids && series.user_ids.length > 0 && typeof series.user_ids[0] === 'string') {
    try {
      groupId = await getUserGroupIdUseCase(series.user_ids[0]);
    } catch (e) {
      console.error(e);
    }
  }

  invalidateRecurringCaches({
    seriesId: id,
    userIds: [...new Set([...(previous.user_ids ?? []), ...(series.user_ids ?? [])])],
    groupId,
  });

  return serialize(series) as unknown as RecurringTransactionSeries;
}

export async function deleteSeriesUseCase(id: string, scope?: RecurringScope): Promise<void> {
  const series = await RecurringRepository.findById(id, scope);
  if (!series) return;

  if (!(await RecurringRepository.delete(id, scope))) throw new Error('Recurring series not found');

  let groupId: string | undefined;
  if (series.user_ids && series.user_ids.length > 0 && typeof series.user_ids[0] === 'string') {
    try {
      groupId = await getUserGroupIdUseCase(series.user_ids[0]);
    } catch (e) {
      console.error(e);
    }
  }

  invalidateRecurringCaches({
    seriesId: id,
    userIds: series.user_ids,
    groupId,
  });
}
