import { createHash, randomBytes } from 'node:crypto';
import { and, eq, desc, isNull, sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import {
  accounts,
  users,
  categories,
  bankConnections,
  bankNotificationEvents,
  bankMerchantRules,
  transactions,
} from '@/server/db/schema';
import { suggestCategoryFromImportRow } from '@/lib/import/category-suggestions';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { SYSTEM_GROUP_ID } from '@/lib/constants';
import {
  type BankNotification,
  parseBankNotification,
  normalizeMerchant,
} from '@/lib/bank-notifications/parser';
import { applyTransactionBalanceAdjustments } from '@/server/use-cases/transactions/transaction-balance';
import { invalidateTransactionCaches } from '@/lib/utils/cache-utils';
import type { User } from '@/lib/types';
import type { DbExecutor } from '@/server/repositories/db-executor';

export class NotificationError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400
  ) {
    super(code);
  }
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const own = (user: User) => {
  if (!user.group_id) throw new NotificationError('unauthorized', 401);
  return and(eq(bankConnections.user_id, user.id), eq(bankConnections.group_id, user.group_id));
};
async function availableCategory(executor: DbExecutor, key: string, groupId: string) {
  const [category] = await executor
    .select()
    .from(categories)
    .where(
      and(eq(categories.key, key), sql`${categories.group_id} IN (${groupId}, ${SYSTEM_GROUP_ID})`)
    )
    .limit(1);
  return category;
}
async function assertConnectionScope(
  executor: DbExecutor,
  connection: typeof bankConnections.$inferSelect
) {
  const [owner] = await executor
    .select()
    .from(users)
    .where(and(eq(users.id, connection.user_id), eq(users.group_id, connection.group_id)))
    .limit(1);
  const [account] = await executor
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.id, connection.account_id),
        eq(accounts.group_id, connection.group_id),
        sql`${connection.user_id}::uuid = ANY(${accounts.user_ids})`
      )
    )
    .for('update');
  if (!owner || !account) throw new NotificationError('connection_unavailable', 403);
}

export async function createBankConnection(
  user: User,
  input: { name: string; accountId: string; category: string; autoImport: boolean }
) {
  const token = `wpn_${randomBytes(32).toString('base64url')}`;
  const result = await db.transaction(async (tx) => {
    // Serializes concurrent setup requests and caps persistent devices per user.
    await tx.select().from(users).where(eq(users.id, user.id)).for('update');
    const active = await tx
      .select({ id: bankConnections.id })
      .from(bankConnections)
      .where(and(own(user), isNull(bankConnections.revoked_at)));
    if (active.length >= 10) throw new NotificationError('device_limit');
    if (!(await availableCategory(tx, input.category, user.group_id!)))
      throw new NotificationError('invalid_category');
    const [connection] = await tx
      .insert(bankConnections)
      .values({
        user_id: user.id,
        group_id: user.group_id!,
        account_id: input.accountId,
        name: input.name,
        default_category: input.category,
        auto_import: input.autoImport,
        token_hash: hash(token),
      })
      .returning();
    await assertConnectionScope(tx, connection!);
    return { id: connection!.id, token };
  });
  return result;
}
export async function getBankNotificationSettings(user: User) {
  const connections = await db
    .select({
      id: bankConnections.id,
      name: bankConnections.name,
      account_id: bankConnections.account_id,
      auto_import: bankConnections.auto_import,
      last_used_at: bankConnections.last_used_at,
      revoked_at: bankConnections.revoked_at,
    })
    .from(bankConnections)
    .where(own(user))
    .orderBy(desc(bankConnections.created_at))
    .limit(50);
  const events = await db
    .select()
    .from(bankNotificationEvents)
    .where(
      and(
        eq(bankNotificationEvents.user_id, user.id),
        eq(bankNotificationEvents.group_id, user.group_id!)
      )
    )
    .orderBy(
      sql`CASE WHEN ${bankNotificationEvents.status} = 'pending' THEN 0 ELSE 1 END`,
      desc(bankNotificationEvents.received_at),
      desc(bankNotificationEvents.id)
    )
    .limit(50);
  const availableAccounts = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(
      and(eq(accounts.group_id, user.group_id!), sql`${user.id}::uuid = ANY(${accounts.user_ids})`)
    );
  const availableCategories = await CategoriesRepository.findAvailable(user.group_id!);
  return { connections, events, accounts: availableAccounts, categories: availableCategories };
}
export async function revokeBankConnection(user: User, id: string) {
  await db
    .update(bankConnections)
    .set({ revoked_at: new Date() })
    .where(and(own(user), eq(bankConnections.id, id)));
}

async function commitEvent(
  tx: DbExecutor,
  event: typeof bankNotificationEvents.$inferSelect,
  category: string
) {
  const parsed = event.parsed;
  if (!parsed || !(await availableCategory(tx, category, event.group_id)))
    throw new NotificationError('invalid_category');
  const [created] = await tx
    .insert(transactions)
    .values({
      description: parsed.description,
      amount: parsed.amount,
      type: parsed.type,
      category,
      date: parsed.date,
      user_id: event.user_id,
      account_id: event.account_id,
      group_id: event.group_id,
      frequency: 'once',
      import_hash: `notification:${event.fingerprint}`,
    })
    .onConflictDoNothing()
    .returning();
  if (!created) throw new NotificationError('duplicate_transaction', 409);
  await applyTransactionBalanceAdjustments(created, 1, tx);
  await tx
    .update(bankNotificationEvents)
    .set({ status: 'imported', category, transaction_id: created.id, reason: null })
    .where(eq(bankNotificationEvents.id, event.id));
}
function invalidate(event: { group_id: string; account_id: string; user_id: string }) {
  invalidateTransactionCaches({
    groupId: event.group_id,
    accountId: event.account_id,
    userId: event.user_id,
  });
}

export async function ingestBankNotification(token: string, input: BankNotification) {
  if (!/^wpn_[A-Za-z0-9_-]{43}$/.test(token)) throw new NotificationError('unauthorized', 401);
  const result = await db.transaction(async (tx) => {
    const [connection] = await tx
      .select()
      .from(bankConnections)
      .where(and(eq(bankConnections.token_hash, hash(token)), isNull(bankConnections.revoked_at)))
      .for('update');
    if (!connection) throw new NotificationError('unauthorized', 401);
    await assertConnectionScope(tx, connection);
    const now = new Date();
    const inWindow = now.getTime() - connection.rate_window.getTime() < 60_000;
    if (inWindow && connection.rate_count >= 60) throw new NotificationError('rate_limited', 429);
    await tx
      .update(bankConnections)
      .set({
        last_used_at: now,
        rate_count: inWindow ? connection.rate_count + 1 : 1,
        rate_window: inWindow ? connection.rate_window : now,
      })
      .where(eq(bankConnections.id, connection.id));
    const identity = input.eventId
      ? ['event', input.eventId]
      : [
          'content',
          input.occurredAt ? new Date(input.occurredAt).toISOString() : 'missing-date',
          normalizeMerchant(input.title),
          normalizeMerchant(input.body),
        ];
    const fingerprint = hash(JSON.stringify([input.provider, ...identity]));
    const [existing] = await tx
      .select()
      .from(bankNotificationEvents)
      .where(
        and(
          eq(bankNotificationEvents.account_id, connection.account_id),
          eq(bankNotificationEvents.fingerprint, fingerprint)
        )
      )
      .limit(1);
    if (existing)
      return {
        id: existing.id,
        status: existing.status,
        duplicate: true,
        group_id: connection.group_id,
        account_id: connection.account_id,
        user_id: connection.user_id,
      };
    const parsedResult =
      input.provider === connection.provider
        ? parseBankNotification(input, now)
        : { parsed: null, reason: 'unsupported_provider' };
    const parsed = parsedResult.parsed;
    let category = connection.default_category;
    if (parsed) {
      const [rule] = await tx
        .select()
        .from(bankMerchantRules)
        .where(
          and(
            eq(bankMerchantRules.user_id, connection.user_id),
            eq(bankMerchantRules.group_id, connection.group_id),
            eq(bankMerchantRules.provider, input.provider),
            eq(bankMerchantRules.merchant, normalizeMerchant(parsed.description))
          )
        )
        .limit(1);
      if (rule) category = rule.category;
      else {
        const hint = /pizzer|rosticcer|ristorant/i.test(parsed.description)
          ? 'ristorazione'
          : parsed.type === 'income' && !/stipendio|emolument|inps/i.test(parsed.description)
            ? 'altro'
            : suggestCategoryFromImportRow(parsed);
        if (hint !== 'altro' && (await availableCategory(tx, hint, connection.group_id)))
          category = hint;
      }
    }
    const validCategory = await availableCategory(tx, category, connection.group_id);
    // A CSV/manual match is ambiguous: keep both distinguishable and require review.
    const candidates = parsed
      ? await tx
          .select({ id: transactions.id })
          .from(transactions)
          .where(
            and(
              eq(transactions.account_id, connection.account_id),
              eq(transactions.group_id, connection.group_id),
              eq(transactions.date, parsed.date),
              eq(transactions.type, parsed.type),
              eq(transactions.amount, parsed.amount)
            )
          )
          .limit(1)
      : [];
    const reason =
      parsedResult.reason ??
      (!validCategory
        ? 'invalid_category'
        : candidates.length
          ? 'possible_duplicate'
          : !connection.auto_import
            ? 'review_mode'
            : null);
    const [event] = await tx
      .insert(bankNotificationEvents)
      .values({
        connection_id: connection.id,
        group_id: connection.group_id,
        user_id: connection.user_id,
        account_id: connection.account_id,
        fingerprint,
        payload: input,
        parsed,
        category: validCategory ? category : null,
        status: 'pending',
        reason,
      })
      .returning();
    if (parsed && !reason) await commitEvent(tx, event!, category);
    return {
      id: event!.id,
      status: parsed && !reason ? 'imported' : 'pending',
      duplicate: false,
      group_id: connection.group_id,
      account_id: connection.account_id,
      user_id: connection.user_id,
    };
  });
  if (result.status === 'imported') invalidate(result);
  // Never serialize the connection or its token hash to the device.
  return { id: result.id, status: result.status, duplicate: result.duplicate };
}

export async function reviewBankNotification(
  user: User,
  id: string,
  decision: 'import' | 'ignore',
  category?: string
) {
  const event = await db.transaction(async (tx) => {
    // Match ingestion lock order: connection, account, event.
    const [target] = await tx
      .select()
      .from(bankNotificationEvents)
      .where(
        and(
          eq(bankNotificationEvents.id, id),
          eq(bankNotificationEvents.user_id, user.id),
          eq(bankNotificationEvents.group_id, user.group_id!)
        )
      )
      .limit(1);
    if (!target) throw new NotificationError('not_found', 404);
    const [connection] = await tx
      .select()
      .from(bankConnections)
      .where(and(own(user), eq(bankConnections.id, target.connection_id)))
      .for('update');
    if (!connection) throw new NotificationError('not_found', 404);
    await assertConnectionScope(tx, connection);
    const [locked] = await tx
      .select()
      .from(bankNotificationEvents)
      .where(eq(bankNotificationEvents.id, id))
      .for('update');
    if (locked!.status !== 'pending') return null;
    if (decision === 'ignore') {
      await tx
        .update(bankNotificationEvents)
        .set({ status: 'ignored' })
        .where(eq(bankNotificationEvents.id, id));
      return null;
    }
    await commitEvent(tx, locked!, category ?? locked!.category ?? '');
    if (locked!.parsed && locked!.payload)
      await tx
        .insert(bankMerchantRules)
        .values({
          group_id: locked!.group_id,
          user_id: locked!.user_id,
          provider: locked!.payload.provider,
          merchant: normalizeMerchant(locked!.parsed.description),
          category: category ?? locked!.category!,
        })
        .onConflictDoUpdate({
          target: [
            bankMerchantRules.group_id,
            bankMerchantRules.user_id,
            bankMerchantRules.provider,
            bankMerchantRules.merchant,
          ],
          set: { category: category ?? locked!.category! },
        });
    return locked;
  });
  if (event) invalidate(event);
}
