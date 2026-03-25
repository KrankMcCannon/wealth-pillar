import type { User } from '@/lib/types';
import { canAccessUserData, isMember } from '@/lib/utils';

export type AssertCanActResult = { ok: true } | { ok: false; error: string };

/**
 * Shared guard for server actions: auth + member self-only + group access rules.
 */
export function assertCanActOnUser(
  currentUser: User | null,
  targetUserId: string | undefined
): AssertCanActResult {
  if (!currentUser) {
    return { ok: false, error: 'Non autenticato' };
  }
  if (!targetUserId) {
    return { ok: false, error: 'User ID richiesto' };
  }
  if (isMember(currentUser) && targetUserId !== currentUser.id) {
    return { ok: false, error: 'Permesso negato' };
  }
  if (!canAccessUserData(currentUser, targetUserId)) {
    return { ok: false, error: 'Permesso negato' };
  }
  return { ok: true };
}
