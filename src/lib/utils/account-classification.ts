import type { Account, AccountLiquidity, AccountType } from '@/lib/types';
import { DEFAULT_LIQUIDITY_BY_TYPE } from '@/lib/types';

export function resolveAccountLiquidity(
  account: Pick<Account, 'type' | 'liquidity'>
): AccountLiquidity {
  if (account.liquidity === 'spendable' || account.liquidity === 'reserve') {
    return account.liquidity;
  }
  return DEFAULT_LIQUIDITY_BY_TYPE[account.type] ?? 'spendable';
}

export function defaultLiquidityForType(type: AccountType): AccountLiquidity {
  return DEFAULT_LIQUIDITY_BY_TYPE[type] ?? 'spendable';
}

export function isSpendableAccount(account: Pick<Account, 'type' | 'liquidity'>): boolean {
  return resolveAccountLiquidity(account) === 'spendable';
}

export function isReserveAccount(account: Pick<Account, 'type' | 'liquidity'>): boolean {
  return resolveAccountLiquidity(account) === 'reserve';
}
