import type { User } from '@/lib/types';
import { denyUnlessCanViewUser } from '@/lib/permissions/action-auth';

export type AssertCanActResult = { ok: true } | { ok: false; error: string };

/**
 * Shared guard for server actions: auth + visibility for target user.
 */
export async function assertCanActOnUser(
  currentUser: User | null,
  targetUserId: string | undefined
): Promise<AssertCanActResult> {
  if (!currentUser) {
    return { ok: false, error: 'Non autenticato' };
  }
  if (!targetUserId) {
    return { ok: false, error: 'User ID richiesto' };
  }
  const denial = await denyUnlessCanViewUser(currentUser, targetUserId, 'Permesso negato');
  if (denial) return { ok: false, error: denial.error! };
  return { ok: true };
}
