import { and, eq } from 'drizzle-orm';
import { bankMerchantRules, bankNotificationEvents } from '@/server/db/schema';
import type { DbExecutor } from '@/server/repositories/db-executor';
import { normalizeMerchant } from '@/lib/bank-notifications/parser';

/** Explicit ledger corrections take precedence over default and keyword categories. */
export async function rememberNotificationCategory(
  tx: DbExecutor,
  transaction: {
    id: string;
    import_hash: string | null;
    group_id: string | null;
    user_id: string | null;
    category: string;
  }
) {
  if (
    !transaction.import_hash?.startsWith('notification:') ||
    !transaction.group_id ||
    !transaction.user_id
  )
    return;
  const [event] = await tx
    .select()
    .from(bankNotificationEvents)
    .where(
      and(
        eq(bankNotificationEvents.transaction_id, transaction.id),
        eq(bankNotificationEvents.group_id, transaction.group_id),
        eq(bankNotificationEvents.user_id, transaction.user_id)
      )
    )
    .limit(1);
  if (!event?.parsed || !event.payload) return;
  await tx
    .insert(bankMerchantRules)
    .values({
      group_id: transaction.group_id,
      user_id: transaction.user_id,
      provider: event.payload.provider,
      merchant: normalizeMerchant(event.parsed.description),
      category: transaction.category,
    })
    .onConflictDoUpdate({
      target: [
        bankMerchantRules.group_id,
        bankMerchantRules.user_id,
        bankMerchantRules.provider,
        bankMerchantRules.merchant,
      ],
      set: { category: transaction.category },
    });
}
