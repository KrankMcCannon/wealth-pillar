import type { User } from '@/lib/types';
import { AccessScope } from '@/lib/permissions/access-scope';

export type AssertCanActResult = { ok: true } | { ok: false; error: string };

/**
 * Shared guard for server actions: auth + visibility for target user.
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
  if (!AccessScope.for(currentUser).canViewUser(targetUserId)) {
    return { ok: false, error: 'Permesso negato' };
  }
  return { ok: true };
}
