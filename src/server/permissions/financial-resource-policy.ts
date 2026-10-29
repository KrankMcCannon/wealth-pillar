import type { User } from '@/lib/types';
import { AccessScope } from '@/lib/permissions/access-scope';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { UsersRepository } from '@/server/repositories/users.repository';

/** Admin visibility is restricted to the authenticated group, just like member visibility. */
export class FinancialResourcePolicy {
  readonly groupId: string;
  private readonly scope: AccessScope;

  constructor(user: User) {
    const groupId = user.group_id?.trim();
    if (!groupId) throw new Error('Gruppo non trovato');
    this.groupId = groupId;
    this.scope = AccessScope.for(user);
  }

  assertGroup(groupId: unknown): void {
    if (groupId !== this.groupId) throw new Error('Permesso negato');
  }

  async assertUsers(userIds: string[]): Promise<void> {
    if (!userIds.length || userIds.some((id) => !this.scope.canViewUser(id))) {
      throw new Error('Permesso negato');
    }
    const users = await UsersRepository.findByIds([...new Set(userIds)]);
    if (
      userIds.some((id) => !users.some((user) => user.id === id && user.group_id === this.groupId))
    ) {
      throw new Error('Permesso negato');
    }
  }

  async assertAccount(accountId: string): Promise<void> {
    const account = await AccountsRepository.findById(accountId);
    if (!account || account.group_id !== this.groupId || !this.scope.canViewShared(account)) {
      throw new Error('Permesso negato');
    }
  }

  async assertTransaction(input: {
    group_id: string | null;
    user_id: string | null;
    account_id: string;
    to_account_id?: string | null | undefined;
  }): Promise<void> {
    this.assertGroup(input.group_id);
    if (!input.user_id) throw new Error('User ID richiesto');
    await this.assertUsers([input.user_id]);
    await this.assertAccount(input.account_id);
    if (input.to_account_id) await this.assertAccount(input.to_account_id);
  }
}
