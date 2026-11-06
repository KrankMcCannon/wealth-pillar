import { beforeEach, expect, it, vi } from 'vitest';
import { getBankEventsAction, reviewBankNotificationAction } from './actions';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  getBankNotificationEvents,
  reviewBankNotification,
} from '@/server/use-cases/bank-notifications/notification-service';
import type { User } from '@/lib/types';
vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/server/use-cases/bank-notifications/notification-service', () => ({
  getBankNotificationEvents: vi.fn(),
  reviewBankNotification: vi.fn(),
  NotificationError: class extends Error {
    constructor(
      public code: string,
      public status = 400
    ) {
      super(code);
    }
  },
}));
const user = { id: 'owner', group_id: 'household' } as User;
const id = '00000000-0000-4000-8000-000000000001';
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(user);
});
it('derives queue ownership from the session and preserves cursor precision', async () => {
  const input = {
    status: 'history' as const,
    cursor: { id, receivedAt: '2026-11-01T12:00:00.123456Z' },
  };
  await getBankEventsAction(input);
  expect(getBankNotificationEvents).toHaveBeenCalledExactlyOnceWith(user, input);
  expect((await getBankEventsAction({ ...input, user_id: 'somebody-else' })).error).toBeTruthy();
  expect(getBankNotificationEvents).toHaveBeenCalledTimes(1);
});
it('refuses unauthenticated queue reads', async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  expect((await getBankEventsAction({})).error).toBe('unauthorized');
  expect(getBankNotificationEvents).not.toHaveBeenCalled();
});
it('validates manual EUR corrections without accepting account or owner overrides', async () => {
  const manual = {
    description: 'Corrected payment',
    amount: 12.34,
    type: 'expense',
    date: '2026-10-25',
  };
  await reviewBankNotificationAction({ id, decision: 'import', category: 'food', manual });
  expect(reviewBankNotification).toHaveBeenCalledExactlyOnceWith(
    user,
    id,
    'import',
    'food',
    manual
  );
  for (const invalid of [
    { ...manual, account_id: id },
    { ...manual, user_id: id },
    { ...manual, amount: 12.345 },
    { ...manual, date: '2026-02-31' },
    { ...manual, type: 'transfer' },
  ])
    expect(
      (
        await reviewBankNotificationAction({
          id,
          decision: 'import',
          category: 'food',
          manual: invalid,
        })
      ).error
    ).toBeTruthy();
  expect(reviewBankNotification).toHaveBeenCalledTimes(1);
});
