import { sql, type SQL } from 'drizzle-orm';

/** SQL counterpart of transactionInvolvesUser, verified against the domain
 * classifier on ownerless/shared/savings/split/internal transfers. Account
 * liquidity is resolved by the domain before constructing account_scope. */
export function transactionVisibilityPredicate(userId: SQL): SQL {
  const sourceActor = sql`case when cardinality(source.user_ids)=1 then source.user_ids[1] else t.user_id end`;
  const destinationOwner = sql`case when cardinality(destination.user_ids)=1 then destination.user_ids[1] else null end`;
  const savingsOwner = sql`case when cardinality(destination.user_ids)>1 then ${sourceActor} else coalesce(${destinationOwner},${sourceActor}) end`;
  return sql`(t.user_id=${userId} or (
    t.type='transfer' and t.amount<>0 and source.id is not null and destination.id is not null and (
      (source.spendable<>destination.spendable and ${savingsOwner}=${userId}) or
      (source.spendable and destination.spendable and ${sourceActor} is not null and ${destinationOwner} is not null and ${sourceActor}<>${destinationOwner} and (${sourceActor}=${userId} or ${destinationOwner}=${userId}))
    )
  ))`;
}
