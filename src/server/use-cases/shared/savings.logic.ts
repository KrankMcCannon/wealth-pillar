import type { Account } from '@/lib/types';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';

export interface NetSavingsResult {
  deposits: number;
  withdrawals: number;
  net: number;
  count: number;
}

export function classifyTransferSavingsDelta(
  source: Pick<Account, 'type' | 'liquidity'>,
  dest: Pick<Account, 'type' | 'liquidity'>,
  amount: number
): number {
  const from = resolveAccountLiquidity(source);
  const to = resolveAccountLiquidity(dest);
  if (from === 'spendable' && to === 'reserve') return amount;
  if (from === 'reserve' && to === 'spendable') return -amount;
  return 0;
}
