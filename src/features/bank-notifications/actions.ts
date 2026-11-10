'use server';

import { runDurableAction } from '@/lib/server-action/run-durable-action';

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { serialize } from '@/lib/utils/serializer';
import { manualNotificationSchema, notificationPageSchema } from '@/lib/bank-notifications/review';
import {
  createBankConnection,
  getBankNotificationSettings,
  getBankNotificationEvents,
  revokeBankConnection,
  reviewBankNotification,
  NotificationError,
} from '@/server/use-cases/bank-notifications/notification-service';

async function authenticated() {
  const user = await getCurrentUser();
  if (!user?.group_id) throw new NotificationError('unauthorized', 401);
  return user;
}
async function run<T>(action: () => Promise<T>) {
  try {
    return { data: serialize(await action()), error: null };
  } catch (error) {
    return { data: null, error: error instanceof NotificationError ? error.code : 'unavailable' };
  }
}
export async function getBankSettingsAction() {
  return run(async () => getBankNotificationSettings(await authenticated()));
}
export async function getBankEventsAction(input: unknown = {}) {
  return run(async () =>
    getBankNotificationEvents(await authenticated(), notificationPageSchema.parse(input))
  );
}
export async function createBankConnectionAction(input: unknown) {
  return run(async () => {
    const data = z
      .object({
        name: z.string().trim().min(1).max(80),
        accountId: z.uuid(),
        autoImport: z.boolean(),
      })
      .strict()
      .parse(input);
    return createBankConnection(await authenticated(), data);
  });
}
export async function revokeBankConnectionAction(id: string) {
  return run(async () => revokeBankConnection(await authenticated(), z.uuid().parse(id)));
}
export async function reviewBankNotificationAction(input: unknown, operationId?: string) {
  return runDurableAction('reviewBankNotificationAction', [input], operationId, async () => {
    return run(async () => {
      const data = z
        .object({
          id: z.uuid(),
          decision: z.enum(['import', 'ignore']),
          category: z.string().min(1).max(100).optional(),
          manual: manualNotificationSchema.optional(),
        })
        .strict()
        .parse(input);
      return reviewBankNotification(
        await authenticated(),
        data.id,
        data.decision,
        data.category,
        data.manual
      );
    });
  });
}
