import { sql } from 'drizzle-orm';
import { resolveDb } from './db-executor';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';
import { financialDateKey } from '@/lib/utils/financial-date';
import { RECENT_ACTIVITY_LIMIT, dashboardTransactionStartDate } from '@/server/db/query-limits';
import { transactionVisibilityPredicate } from '@/server/ledger/visibility-predicate';
import type { Account, Transaction } from '@/lib/types';

export class RecentActivityRepository {
  static async byGroupScopes(groupId: string, userIds: string[], accounts: Account[]) {
    const accountScope = accounts.map((account) => ({
      id: account.id,
      user_ids: account.user_ids,
      spendable: resolveAccountLiquidity(account) === 'spendable',
    }));
    const rows = await resolveDb().execute<{ scope: string; items: Transaction[] }>(sql`
      with account_scope as (
        select * from jsonb_to_recordset(${JSON.stringify(accountScope)}::jsonb) as a(id uuid,user_ids uuid[],spendable boolean)
      ), scopes as (
        select null::uuid as user_id union all
        select value::uuid from jsonb_array_elements_text(${JSON.stringify([...new Set(userIds)])}::jsonb)
      )
      select coalesce(scopes.user_id::text,'all') as scope,
        coalesce(jsonb_agg(to_jsonb(recent) order by recent.date desc,recent.created_at desc nulls last,recent.id desc) filter(where recent.id is not null),'[]'::jsonb) as items
      from scopes left join lateral (
        select t.* from transactions t
        left join account_scope source on source.id=t.account_id
        left join account_scope destination on destination.id=t.to_account_id
        where t.group_id=${groupId}::uuid and t.date>=${financialDateKey(dashboardTransactionStartDate())}::date
          and (scopes.user_id is null or ${transactionVisibilityPredicate(sql`scopes.user_id`)})
        order by t.date desc,t.created_at desc nulls last,t.id desc limit ${RECENT_ACTIVITY_LIMIT}
      ) recent on true group by scopes.user_id
    `);
    const byUserId: Record<string, Transaction[]> = Object.fromEntries(
      userIds.map((id) => [id, []])
    );
    let all: Transaction[] = [];
    for (const row of rows) {
      const items = row.items.map((item) => ({ ...item, amount: Number(item.amount) }));
      if (row.scope === 'all') all = items;
      else byUserId[row.scope] = items;
    }
    return { all, byUserId };
  }
}
