import type { Account } from '@/lib/types';

interface BalanceValue {
  balance: number;
  version?: string | undefined;
}
export interface BalanceMutation {
  deltas: Record<string, number>;
  status: 'pending' | 'committed';
}
export interface BalanceState {
  base: Record<string, BalanceValue>;
  confirmed: Record<string, BalanceValue>;
  pending: Record<string, BalanceMutation>;
}
export const emptyBalanceState = (): BalanceState => ({ base: {}, confirmed: {}, pending: {} });

export function displayBalances(accounts: Account[], state: BalanceState): Account[] {
  return accounts.map((account) => {
    const base = state.base[account.id];
    if (!base) return account;
    const delta = Object.values(state.pending).reduce(
      (sum, op) => sum + (op.deltas[account.id] ?? 0),
      0
    );
    return {
      ...account,
      balance: Math.round((base.balance + delta) * 100) / 100,
      ...(base.version ? { balance_version: base.version } : {}),
    };
  });
}

function settleBalances(state: BalanceState): BalanceState {
  const base = { ...state.base };
  const pending = Object.fromEntries(
    Object.entries(state.pending).map(([id, op]) => [id, { ...op, deltas: { ...op.deltas } }])
  );
  for (const [id, value] of Object.entries(state.confirmed)) {
    // Keep the optimistic overlay intact until every overlapping request has settled.
    // A response can already include another request whose response is still in flight.
    if (Object.values(pending).some((op) => op.status === 'pending' && id in op.deltas)) continue;
    base[id] = value;
    for (const op of Object.values(pending)) delete op.deltas[id];
  }
  return {
    ...state,
    base,
    pending: Object.fromEntries(
      Object.entries(pending).filter(([, op]) => Object.keys(op.deltas).length)
    ),
  };
}

export function acceptBalances(
  state: BalanceState,
  balances: Record<string, number>,
  versions: Record<string, string> = {}
): BalanceState {
  const confirmed = { ...state.confirmed };
  for (const [id, balance] of Object.entries(balances)) {
    const version = versions[id];
    const previous = confirmed[id] ?? state.base[id];
    // PostgreSQL supplies a monotonic balance revision under the account row lock.
    if (previous?.version && (!version || BigInt(version) < BigInt(previous.version))) continue;
    confirmed[id] = { balance, version };
  }
  return settleBalances({ ...state, confirmed });
}

export function seedBalances(state: BalanceState, accounts: Account[]): BalanceState {
  return acceptBalances(
    state,
    Object.fromEntries(accounts.map((a) => [a.id, Number(a.balance ?? 0)])),
    Object.fromEntries(
      accounts.filter((a) => a.balance_version).map((a) => [a.id, a.balance_version!])
    )
  );
}

export function beginBalanceMutation(
  state: BalanceState,
  accounts: Account[],
  id: string,
  deltas: Record<string, number>
): BalanceState {
  const base = { ...state.base };
  for (const account of accounts)
    if (!base[account.id])
      base[account.id] = {
        balance: Number(account.balance ?? 0),
        version: account.balance_version,
      };
  return { ...state, base, pending: { ...state.pending, [id]: { deltas, status: 'pending' } } };
}

export function finishBalanceMutation(
  state: BalanceState,
  id: string,
  result?: {
    accountBalances: Record<string, number>;
    accountBalanceVersions?: Record<string, string> | undefined;
  }
): BalanceState {
  const pending = { ...state.pending };
  if (result && pending[id]) pending[id] = { ...pending[id], status: 'committed' };
  else delete pending[id];
  return result
    ? acceptBalances({ ...state, pending }, result.accountBalances, result.accountBalanceVersions)
    : settleBalances({ ...state, pending });
}
