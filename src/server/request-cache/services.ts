import { cache } from 'react';

import { getAccountsByGroupUseCase } from '@/server/use-cases/accounts/account.use-cases';
import { getAllCategoriesUseCase } from '@/server/use-cases/categories/category.use-cases';
import { getGroupUsersUseCase } from '@/server/use-cases/groups/groups.use-cases';

/**
 * Request-scoped deduplication for hot paths shared by layout and page-level use cases.
 * Same arguments in one React render tree → single underlying service call.
 */
export const getAccountsByGroupDeduped = cache((groupId: string) =>
  getAccountsByGroupUseCase(groupId)
);

export const getAllCategoriesDeduped = cache(() => getAllCategoriesUseCase());

export const getGroupUsersByGroupIdDeduped = cache((groupId: string) =>
  getGroupUsersUseCase(groupId)
);
